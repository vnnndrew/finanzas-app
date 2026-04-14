export type Category =
  | 'supermercado'
  | 'transporte'
  | 'entretenimiento'
  | 'salud'
  | 'ropa'
  | 'restaurantes'
  | 'servicios'
  | 'transferencia'
  | 'otro'

export interface Transaction {
  id: string
  user_id: string
  fintoc_id?: string
  amount: number // negative = gasto, positive = ingreso
  description_raw: string
  merchant: string
  category: Category
  type: 'compra' | 'transferencia' | 'pago_servicio' | 'cajero' | 'ingreso'
  date: string // ISO
  account_id?: string
  enriched: boolean
  created_at: string
}

export interface Account {
  id: string
  user_id: string
  fintoc_link_token: string
  bank_name: string
  account_number_last4: string
  account_type: string
  currency: string
  balance: number
  created_at: string
}

export interface MonthlyStats {
  month: string
  income: number
  expenses: number
  balance: number
}

export interface CategoryStats {
  category: Category
  total: number
  count: number
  percentage: number
}

export interface Budget {
  id: string
  user_id: string
  category: Category
  amount: number
  created_at: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  amount: number
  month: string // '2026-04'
  created_at: string
}

export interface BudgetWithSpent extends Budget {
  spent: number
  percentage: number
}

export interface MonthlyRecap {
  current: { income: number; expenses: number; balance: number }
  previous: { income: number; expenses: number; balance: number }
  diff: { income: number; expenses: number; balance: number }
  topCategory: { category: Category; total: number; diff: number } | null
  savedMore: boolean
}

export interface RecurringExpense {
  merchant: string
  category: Category
  avgAmount: number
  months: number // how many months it appeared
  lastDate: string
}

export interface Projection {
  projected: number
  currentSpent: number
  dailyAvg: number
  daysLeft: number
  daysPassed: number
}

export interface SpendingAlert {
  type: 'unusual_day' | 'budget_warning' | 'budget_exceeded'
  message: string
  amount?: number
  category?: Category
  date?: string
}

export const CATEGORY_CONFIG: Record<
  Category,
  { label: string; color: string; icon: string }
> = {
  supermercado:   { label: 'Supermercado',    color: '#00D084', icon: '🛒' },
  transporte:     { label: 'Transporte',       color: '#4D9EFF', icon: '🚗' },
  entretenimiento:{ label: 'Entretenimiento',  color: '#A855F7', icon: '🎬' },
  salud:          { label: 'Salud',            color: '#FF6B6B', icon: '🏥' },
  ropa:           { label: 'Ropa',             color: '#FFB84D', icon: '👕' },
  restaurantes:   { label: 'Restaurantes',     color: '#FF8C42', icon: '🍽️' },
  servicios:      { label: 'Servicios',        color: '#64748B', icon: '⚡' },
  transferencia:  { label: 'Transferencia',    color: '#94A3B8', icon: '↔️' },
  otro:           { label: 'Otro',             color: '#475569', icon: '📦' },
}
