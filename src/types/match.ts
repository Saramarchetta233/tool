export interface Team {
  id: number
  name: string
  logo: string
}

export interface Match {
  id: string
  league: string
  leagueName: string
  date: string
  time: string
  venue: string
  homeTeam: Team
  awayTeam: Team
  status: 'scheduled' | 'live' | 'finished'
}

export interface MatchPredictions {
  matchId: string
  predictions: {
    winner: {
      home: number
      draw: number
      away: number
    }
    goals: {
      over_1_5: number
      over_2_5: number
      under_2_5: number
      btts: number
    }
    doubleChance: {
      homeOrDraw: number
      awayOrDraw: number
      homeOrAway: number
    }
  }
  confidence: 'ALTA' | 'MEDIA' | 'BASSA'
  advice: string
}

export interface HeadToHead {
  homeWins: number
  draws: number
  awayWins: number
  totalGames: number
  avgGoals: number
  lastResult: {
    date: string
    homeScore: number
    awayScore: number
  }
}

export interface TeamForm {
  last5: ('W' | 'D' | 'L')[]
  points: number
  trend: 'up' | 'stable' | 'down'
  xG: number
  xGA: number
}

export interface Injuries {
  team: 'home' | 'away'
  player: string
  status: 'out' | 'doubt'
  impact: 'high' | 'medium' | 'low'
}

export interface MatchAnalysis {
  match: Match
  predictions: MatchPredictions
  headToHead: HeadToHead
  form: {
    home: TeamForm
    away: TeamForm
  }
  injuries: Injuries[]
  aiReport?: string
  strategy: {
    suggestedBet: string
    valueRange: string
    solidMarket: string
    analysis: string
    alternatives: string[]
    valueBetCheck: string[]
  }
}