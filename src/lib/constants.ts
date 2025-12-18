export const LEAGUES = {
  'serie-a': 135,
  'serie-b': 136,
  'premier': 39,
  'la-liga': 140,
  'bundesliga': 78,
  'ligue-1': 61,
  'champions': 2,
  'europa': 3,
} as const

export const LEAGUE_NAMES = {
  'serie-a': 'Serie A',
  'serie-b': 'Serie B',
  'premier': 'Premier League',
  'la-liga': 'La Liga',
  'bundesliga': 'Bundesliga',
  'ligue-1': 'Ligue 1',
  'champions': 'Champions League',
  'europa': 'Europa League',
} as const

export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 25,
    price: 4.99,
    pricePerCredit: 0.20,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 60,
    price: 9.99,
    pricePerCredit: 0.17,
    popular: true,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    credits: 150,
    price: 19.99,
    pricePerCredit: 0.13,
  },
] as const

export const CREDIT_COSTS = {
  MATCH_ANALYSIS: 2,
  AI_REPORT_REGEN: 1,
  FANTA_LINEUP: 3,
} as const

export const FREE_CREDITS = {
  SIGNUP: 5,
  WEEKLY_BONUS: 2,
} as const

export const FORMATIONS = [
  '3-4-3',
  '3-5-2', 
  '4-3-3',
  '4-4-2',
  '4-5-1',
] as const