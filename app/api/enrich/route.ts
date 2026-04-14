import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { enrichTransactions } from '@/lib/claude'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = createServiceClient()

  try {
    // Tomar batch de 20 no-enriquecidas
    const { data: pending, error: fetchError } = await db
      .from('transactions')
      .select('id, description_raw, amount')
      .eq('user_id', session.user.id)
      .eq('enriched', false)
      .limit(20)

    if (fetchError) throw new Error(`DB fetch: ${fetchError.message}`)
    if (!pending || pending.length === 0) {
      return NextResponse.json({ done: true, enriched: 0, remaining: 0, message: 'Todo enriquecido ✓' })
    }

    // Llamar a OpenRouter
    const enrichedMap = await enrichTransactions(pending)

    // Actualizar uno por uno (más confiable que batch)
    for (const t of pending) {
      const e = enrichedMap.get(t.id)
      const { error: updateError } = await db
        .from('transactions')
        .update({
          merchant: e?.merchant ?? t.description_raw.slice(0, 40),
          category: e?.category ?? 'otro',
          type: e?.type ?? (t.amount > 0 ? 'ingreso' : 'compra'),
          enriched: true,
        })
        .eq('id', t.id)
        .eq('user_id', session.user.id)

      if (updateError) console.error('Update error:', updateError.message)
    }

    // Contar restantes
    const { count } = await db
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('enriched', false)

    const remaining = count ?? 0

    return NextResponse.json({
      done: remaining === 0,
      enriched: pending.length,
      remaining,
      message: `${pending.length} categorizadas. Quedan ${remaining}.`,
    })
  } catch (err: unknown) {
    console.error('[enrich] error:', err)
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
