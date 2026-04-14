import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Santiago',
  }).format(new Date(dateStr))
}

export function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Santiago',
  }).format(new Date(dateStr))
}

export function getMonthLabel(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    month: 'short',
    year: '2-digit',
    timeZone: 'America/Santiago',
  }).format(new Date(dateStr))
}

export function currentMonthRange(): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}
