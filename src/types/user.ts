export interface User {
  id: string
  email: string
  fullName?: string
  credits: number
  preferredLeagues: string[]
  goal: 'betting' | 'fantacalcio' | 'both'
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: 'purchase' | 'spend' | 'bonus'
  amount: number
  description: string
  stripeSessionId?: string
  createdAt: string
}

export interface Report {
  id: string
  userId: string
  matchId: string
  matchLabel: string
  reportType: 'match_analysis' | 'fanta_lineup'
  content: any
  creditsSpent: number
  createdAt: string
}