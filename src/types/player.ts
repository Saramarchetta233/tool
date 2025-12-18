export interface Player {
  id: string
  name: string
  role: 'P' | 'D' | 'C' | 'A'
  team: string
  avgRating: number
  lastGames: number[]
  ownership: number
  nextOpponent: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface Roster {
  id: string
  userId: string
  name: string
  players: Player[]
  module: string
  createdAt: string
  updatedAt: string
}

export interface FantaLineup {
  formation: string
  starters: {
    player: Player
    motivation: string
    predictedRating: number
    risk: string
  }[]
  bench: {
    player: Player
    priority: number
  }[]
  captain: {
    player: Player
    reason: string
  }
  viceCaptain: {
    player: Player
    reason: string
  }
}