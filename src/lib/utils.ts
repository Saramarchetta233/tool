import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${value}%`
}

export function getConfidenceLevel(probability: number): 'ALTA' | 'MEDIA' | 'BASSA' {
  if (probability >= 60) return 'ALTA'
  if (probability >= 40) return 'MEDIA'
  return 'BASSA'
}

export function calculateValueBet(probability: number, odds: number): number {
  // Value = (Probability * Odds - 1) * 100
  return (probability / 100 * odds - 1) * 100
}
