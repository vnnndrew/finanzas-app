const FINTOC_BASE = 'https://api.fintoc.com/v1'

async function fintocFetch(path: string) {
  const res = await fetch(`${FINTOC_BASE}${path}`, {
    headers: { Authorization: process.env.FINTOC_SECRET_KEY! },
  })

  const text = await res.text()

  if (!res.ok) {
    console.error(`[Fintoc] ${res.status} ${path}:`, text)
    throw new Error(`Fintoc ${res.status}: ${text}`)
  }

  return JSON.parse(text)
}

export interface FintocMovement {
  id: string
  amount: number
  currency: string
  description: string
  transaction_date: string | null
  post_date: string
  value_date?: string
  type: string
  pending: boolean
  recipient_account?: { name: string }
  sender_account?: { name: string }
}

export interface FintocAccount {
  id: string
  name: string
  official_name: string
  number: string
  holder_id: string
  holder_name: string
  currency: string
  balance: { available: number; current: number; limit: number }
  institution: { id: string; name: string; country: string }
  type: string
  refresh_status: string
}

// GET /v1/accounts?link_token=xxx
export async function getAccounts(linkToken: string): Promise<FintocAccount[]> {
  return fintocFetch(`/accounts?link_token=${linkToken}`)
}

// GET /v1/accounts/{id}/movements?link_token=xxx&since=xxx&per_page=xxx
export async function getMovements(
  linkToken: string,
  accountId: string,
  options?: { since?: string; until?: string; per_page?: number; page?: number }
): Promise<FintocMovement[]> {
  const params = new URLSearchParams({
    link_token: linkToken,
    per_page: String(options?.per_page ?? 100),
    confirmed_only: 'false',
  })
  if (options?.since) params.set('since', options.since)
  if (options?.until) params.set('until', options.until)
  if (options?.page) params.set('page', String(options.page))

  return fintocFetch(`/accounts/${accountId}/movements?${params}`)
}
