import OpenAI from 'openai'
import type { Category } from '@/types'

function getClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY ?? 'missing',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      'X-Title': 'Finanzas CL',
    },
  })
}

// Modelo barato y rápido en OpenRouter
const MODEL = 'google/gemma-3-27b-it:free'

interface EnrichedTransaction {
  merchant: string
  category: Category
  type: 'compra' | 'transferencia' | 'pago_servicio' | 'cajero' | 'ingreso'
}

interface RawTransaction {
  id: string
  description_raw: string
  amount: number
}

export async function enrichTransactions(
  transactions: RawTransaction[]
): Promise<Map<string, EnrichedTransaction>> {
  const results = new Map<string, EnrichedTransaction>()

  // Procesar en batches de 20
  const batches: RawTransaction[][] = []
  for (let i = 0; i < transactions.length; i += 20) {
    batches.push(transactions.slice(i, i + 20))
  }

  for (const batch of batches) {
    const list = batch
      .map((t, i) => `${i + 1}. ID:${t.id} | DESC:"${t.description_raw}" | MONTO:${t.amount}`)
      .join('\n')

    const response = await getClient().chat.completions.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Eres un parser experto de transacciones bancarias chilenas (Santander Chile).
Analiza y clasifica estas transacciones. Conoces el contexto chileno.

REGLAS DE CATEGORIZACIÓN:
- supermercado: Lider, Jumbo, Unimarc, Santa Isabel, Tottus, Walmart, Acuenta, Fresh Market, Solofresco, cualquier supermercado/minimarket
- transporte: Uber, Cabify, Didi, BIP, Metro, bus, taxi, bencina, copec, shell, petrobras, estacionamiento
- entretenimiento: Netflix, Spotify, Disney, YouTube, Steam, juegos, cine, teatro, concierto, Apple, Google Play, licorería, bar
- salud: farmacia, clínica, hospital, médico, dentista, salcobrand, cruz verde, ahumada, laboratorio
- ropa: Falabella ropa, Zara, H&M, Forever21, prendas, vestuario (NO incluir IKEA ni tecnología)
- restaurantes: restaurant, café, pizza, sushi, comida, delivery, Rappi, PedidosYa, Junaeb, panadería, SUMUP (suele ser comercio pequeño/restorán), "COMER" en nombre
- servicios: Entel, Movistar, Claro, WOM, luz, gas, agua, internet, ESVAL, Enel, CGE, seguro, AFP, isapre, colegio, arriendo, PRONTOPAGA, PagosOnline, pago en línea
- transferencia: TRANSF, transferencia, TEF, depósito a persona (nombre de persona)
- otro: IKEA, tecnología, hogar, ferretería, lo que no encaje arriba

REGLAS DE MERCHANT:
- Limpiar prefijos: "COMPRA NACIONAL", "COMPRA INTERNACIONAL", "COMPRA NP", "PAGO EN LINEA", números de RUT al inicio
- SUMUP * NOMBRE → usar NOMBRE como merchant
- MERCADOPAGO*NOMBRE → usar NOMBRE como merchant
- "TRANSF A NOMBRE" → merchant = nombre de la persona
- Capitalizar correctamente: "ENTEL PCS" → "Entel"

Transacciones:
${list}

Responde SOLO con JSON array:
[{"id":"...","merchant":"...","category":"...","type":"..."}]`,
        },
      ],
    })

    try {
      const text = response.choices[0]?.message?.content ?? ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) continue

      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        id: string
        merchant: string
        category: Category
        type: EnrichedTransaction['type']
      }>

      for (const item of parsed) {
        results.set(item.id, {
          merchant: item.merchant,
          category: item.category,
          type: item.type,
        })
      }
    } catch {
      for (const t of batch) {
        results.set(t.id, {
          merchant: t.description_raw.slice(0, 30),
          category: 'otro',
          type: t.amount > 0 ? 'ingreso' : 'compra',
        })
      }
    }
  }

  return results
}

export async function enrichSingle(
  description: string,
  amount: number
): Promise<EnrichedTransaction> {
  const map = await enrichTransactions([
    { id: 'single', description_raw: description, amount },
  ])
  return (
    map.get('single') ?? {
      merchant: description.slice(0, 30),
      category: 'otro',
      type: amount > 0 ? 'ingreso' : 'compra',
    }
  )
}
