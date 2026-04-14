import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const { email, password, name } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Contraseña mínimo 8 caracteres' }, { status: 400 })
  }

  const db = createServiceClient()

  // Verificar si ya existe
  const { data: existing } = await db
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { data: user, error } = await db
    .from('users')
    .insert({ email: email.toLowerCase(), password_hash, name })
    .select('id, email, name')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }

  return NextResponse.json({ user }, { status: 201 })
}
