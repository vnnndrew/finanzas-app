import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const envVars = {}
readFileSync(join(__dir, '..', '.env.local'), 'utf-8').split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) envVars[key.trim()] = rest.join('=').trim()
})

const db = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)
const ai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: envVars.OPENROUTER_API_KEY,
  defaultHeaders: { 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'Finanzas CL' },
})
const MODEL = 'google/gemma-3-27b-it:free'

// ── FASE 1: Reglas locales ────────────────────────────────────────────────────
const RULES = [
  { cat: 'transferencia', type: 'transferencia', re: /TRANSF|TEF|GIRO\s+A|DEPOSITO A/i },
  { cat: 'supermercado',  type: 'compra', re: /LIDER|JUMBO|UNIMARC|SANTA ISABEL|TOTTUS|WALMART|ACUENTA|FRESH MARKET|SOLOFRESCO|EKONO|MAYORISTA 10/i },
  { cat: 'transporte',    type: 'compra', re: /\bUBER\b|CABIFY|DIDI|METRO CL|BIPER|COPEC|SHELL|PETROBRAS|GULF|TERPEL|BENCIN|ESTACIONAMIENTO|PARKING|AUTOPISTA|PEAJE/i },
  { cat: 'restaurantes',  type: 'compra', re: /SUMUP|RAPPI|PEDIDOS YA|MCDONALD|BURGER KING|KFC|SUBWAY|DOMINO|PIZZA|SUSHI|RESTAURANT|RESTORAN|\bCAFE\b|CAFETER|JAURIEL|COMER DE|PANADERIA|PASTELERIA|FUENTE DE SODA/i },
  { cat: 'entretenimiento', type: 'pago_servicio', re: /NETFLIX|SPOTIFY|DISNEY|YOUTUBE|APPLE\.COM|APPLE\.COM-BILL|GOOGLE PLAY|STEAM|XBOX|PLAYSTATION|TWITCH|HBO|PRIME VIDEO|CINE|LICORERIA|LICORERA|BOTILLERIA/i },
  { cat: 'servicios',     type: 'pago_servicio', re: /ENTEL|MOVISTAR|CLARO|WOM|GTD|VTR|ENEL|CGE|ESVAL|ESSBIO|METROGAS|PRONTOPAGA|PAGO EN LINEA|ISAPRE|FONASA|AFP|COLEGIO|LICEO|UNIVERSIDAD|SEGURO|ARRIENDO/i },
  { cat: 'salud',         type: 'compra', re: /FARMACIA|SALCOBRAND|CRUZ VERDE|AHUMADA|CLINICA|HOSPITAL|MEDICO|DENTISTA|LABORATORIO|OPTICA/i },
  { cat: 'ropa',          type: 'compra', re: /\bZARA\b|H&M|H & M|FOREVER21|FALABELLA ROPA|LA POLAR|FORUS|\bADIDAS\b|\bNIKE\b|\bPUMA\b|CALZADO|VESTUARIO/i },
  { cat: 'otro',          type: 'cajero', re: /CAJERO|ATM|\bRETIRO\b/i },
]

function categorizeByRules(desc, amount) {
  if (amount > 0) return { cat: 'otro', type: 'ingreso' }
  for (const r of RULES) if (r.re.test(desc)) return { cat: r.cat, type: r.type }
  return null // no match → usar AI
}

function cleanMerchant(desc) {
  let m = desc
    .replace(/^(COMPRA (NACIONAL|INTERNACIONAL|NP)|PAGO EN LINEA)\s+/i, '')
    .replace(/^NP\s+/i, '')
    .replace(/^\d{7,12}[A-Z]?\s+/i, '')
    .trim()
  const sumup = m.match(/SUMUP\s*\*\s*(.+)/i)
  if (sumup) return toTitle(sumup[1].trim().slice(0, 35))
  const mp = m.match(/MERCADOPAGO\s*\*(.+)/i)
  if (mp) return 'MercadoPago · ' + toTitle(mp[1].trim().slice(0, 25))
  const transf = m.match(/(?:TRANSF|TRANSFERENCIA)\s+A\s+(.+)/i)
  if (transf) return toTitle(transf[1].trim().slice(0, 35))
  return toTitle(m.slice(0, 35))
}

function toTitle(s) {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

// ── FASE 2: AI para "otro" sin categoría clara ────────────────────────────────
const PROMPT = `Eres un parser de transacciones bancarias chilenas. Para cada transacción devuelve categoría y merchant limpio.
Categorías: supermercado, transporte, entretenimiento, salud, ropa, restaurantes, servicios, transferencia, otro
Type: compra, transferencia, pago_servicio, cajero, ingreso
Responde SOLO JSON: [{"id":"...","merchant":"...","category":"...","type":"..."}]`

async function enrichWithAI(batch) {
  const list = batch.map((t, i) =>
    `${i + 1}. ID:${t.id} | "${t.description_raw}" | ${t.amount} CLP`
  ).join('\n')

  const res = await ai.chat.completions.create({
    model: MODEL, max_tokens: 800,
    messages: [{ role: 'system', content: PROMPT }, { role: 'user', content: list }]
  })
  const text = res.choices[0]?.message?.content ?? ''
  const match = text.match(/\[[\s\S]*?\]/)
  if (!match) throw new Error('Sin JSON: ' + text.slice(0, 80))
  return JSON.parse(match[0])
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const { data: pending } = await db
    .from('transactions').select('id, description_raw, amount').eq('enriched', false)

  if (!pending?.length) { console.log('✅ Todo categorizado'); return }
  console.log(`${pending.length} transacciones a procesar\n`)

  // Fase 1: reglas locales
  const needsAI = []
  let rulesCount = 0

  for (const t of pending) {
    const match = categorizeByRules(t.description_raw, t.amount)
    if (match) {
      await db.from('transactions').update({
        merchant: cleanMerchant(t.description_raw),
        category: match.cat,
        type: match.type,
        enriched: true,
      }).eq('id', t.id)
      rulesCount++
    } else {
      needsAI.push(t)
    }
  }

  console.log(`✓ Fase 1 (reglas): ${rulesCount}/${pending.length}`)
  console.log(`→ Fase 2 (AI):     ${needsAI.length} sin categoría clara\n`)

  if (!needsAI.length) { console.log('✅ Listo'); return }

  // Fase 2: AI con rate limit respetado (1 llamada cada 20s)
  let aiDone = 0
  for (let i = 0; i < needsAI.length; i += 5) {
    const batch = needsAI.slice(i, i + 5)
    process.stdout.write(`AI [${i + 1}-${Math.min(i + 5, needsAI.length)}/${needsAI.length}] `)
    try {
      const enriched = await enrichWithAI(batch)
      for (const item of enriched) {
        await db.from('transactions').update({
          merchant: item.merchant, category: item.category,
          type: item.type, enriched: true,
        }).eq('id', item.id)
      }
      aiDone += batch.length
      console.log('✓')
    } catch (e) {
      console.log('✗ ' + e.message.slice(0, 60))
      // fallback
      for (const t of batch) {
        await db.from('transactions').update({
          merchant: cleanMerchant(t.description_raw),
          category: 'otro', type: t.amount > 0 ? 'ingreso' : 'compra', enriched: true,
        }).eq('id', t.id)
      }
    }
    if (i + 5 < needsAI.length) {
      process.stdout.write('  (espera 20s rate limit...)\r')
      await sleep(20000)
    }
  }

  console.log(`\n✅ Listo. Reglas: ${rulesCount} | AI: ${aiDone} | Total: ${pending.length}`)
}

main().catch(console.error)
