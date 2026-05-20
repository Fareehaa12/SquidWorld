import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PKR = (n: number) => {
  const v = Number(n)
  if (!isFinite(v)) return '₨0'
  return `₨${Math.abs(v).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
}

export const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`

export const healthColor = (pct: number) => {
  if (pct > 60) return '#2dc653'
  if (pct > 30) return '#ffb703'
  return '#ff6b6b'
}
