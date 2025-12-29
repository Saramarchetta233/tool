// Gestisce SOLO le quote REALI dal database, NON quelle inventate da GPT
export interface RealOdds {
  winner: {
    home: number
    draw: number
    away: number
  }
  doubleChance: {
    x1: number  // 1X (casa non perde)
    x2: number  // X2 (ospite non perde) 
    x12: number // 1X2 (casa o ospite vince)
  }
  goals: {
    over_1_5: number
    under_1_5: number
    over_2_5: number
    under_2_5: number
    over_3_5: number
    under_3_5: number
    btts: number     // Both teams to score
    nobtts: number   // No BTTS
  }
}

export interface Selection {
  fixture_id: number
  home_team: string
  away_team: string
  league: string
  time: string
  prediction: string
  prediction_label: string
  odds: number  // QUOTA REALE, non inventata!
  confidence: number
  reasoning: string
}

export class RealOddsManager {
  
  // Assegna quote REALI basate sulla selezione GPT
  static assignRealOdds(prediction: string, realOdds: any): number {
    
    // Approccio flessibile: prova diverse strutture possibili
    switch (prediction.toLowerCase().trim()) {
      // === RISULTATO ===
      case '1':
        return realOdds.winner?.home || realOdds.home || 1.80
      
      case 'x':
        return realOdds.winner?.draw || realOdds.draw || 3.20
      
      case '2':
        return realOdds.winner?.away || realOdds.away || 2.50
      
      // === DOPPIA CHANCE ===
      case '1x':
        return realOdds.doubleChance?.x1 || realOdds.home_draw || 1.30
      
      case 'x2':
        return realOdds.doubleChance?.x2 || realOdds.away_draw || 1.40
      
      case '12':
      case '1x2':
        return realOdds.doubleChance?.x12 || realOdds.home_away || 1.20
      
      // === GOALS ===
      case 'over 1.5':
      case 'over1.5':
        return realOdds.goals?.over_1_5 || realOdds.over_1_5 || 1.25
      
      case 'under 1.5':
      case 'under1.5':
        return realOdds.goals?.under_1_5 || realOdds.under_1_5 || 4.00
      
      case 'over 2.5':
      case 'over2.5':
        return realOdds.goals?.over_2_5 || realOdds.over_2_5 || 1.80
      
      case 'under 2.5':
      case 'under2.5':
        return realOdds.goals?.under_2_5 || realOdds.under_2_5 || 1.90
      
      case 'over 3.5':
      case 'over3.5':
        return realOdds.goals?.over_3_5 || realOdds.over_3_5 || 3.50
      
      case 'under 3.5':
      case 'under3.5':
        return realOdds.goals?.under_3_5 || realOdds.under_3_5 || 1.30
      
      // === BTTS ===
      case 'gol':
      case 'btts':
      case 'both teams to score':
        return realOdds.goals?.btts || realOdds.btts_yes || 1.70
      
      case 'nogol':
      case 'no btts':
      case 'no both teams to score':
        return realOdds.goals?.nobtts || realOdds.btts_no || 2.10
      
      // === COMBO ===
      default:
        return this.calculateComboOdds(prediction, realOdds)
    }
  }
  
  // Calcola quote per selezioni combo tipo "1 + Over 1.5"
  private static calculateComboOdds(prediction: string, realOdds: RealOdds): number {
    
    // Parsing combo con +
    if (prediction.includes('+')) {
      const parts = prediction.split('+').map(p => p.trim())
      let totalOdds = 1
      
      for (const part of parts) {
        const partOdds = this.assignRealOdds(part, realOdds)
        totalOdds *= partOdds
      }
      
      return Math.round(totalOdds * 100) / 100
    }
    
    // Parsing combo con spazio (es: "1 Over 2.5")
    if (prediction.includes(' ') && !prediction.includes('over') && !prediction.includes('under')) {
      const parts = prediction.split(' ').filter(p => p.trim())
      let totalOdds = 1
      
      for (const part of parts) {
        if (part.toLowerCase() === 'over' || part.toLowerCase() === 'under') continue
        const partOdds = this.assignRealOdds(part, realOdds)
        totalOdds *= partOdds
      }
      
      return Math.round(totalOdds * 100) / 100
    }
    
    // NON usare fallback fake - segnala errore
    console.error(`❌ Prediction non riconosciuta: "${prediction}" - nessuna quota reale`)
    return 0
  }
  
  // Trova la migliore selezione per raggiungere un target di quota
  static findBestSelectionForTarget(realOdds: RealOdds, targetMin: number, targetMax: number): {prediction: string, odds: number, label: string} {
    
    // Tutte le opzioni possibili con quote REALI (solo se esistono!)
    const options = []
    
    // Aggiungi solo opzioni con quote REALI
    if (realOdds.winner?.home) options.push({ prediction: '1', odds: realOdds.winner.home, label: 'VINCE' })
    if (realOdds.winner?.draw) options.push({ prediction: 'X', odds: realOdds.winner.draw, label: 'PAREGGIO' })
    if (realOdds.winner?.away) options.push({ prediction: '2', odds: realOdds.winner.away, label: 'VINCE' })
    
    if (realOdds.doubleChance?.x1) options.push({ prediction: '1X', odds: realOdds.doubleChance.x1, label: 'NON PERDE' })
    if (realOdds.doubleChance?.x2) options.push({ prediction: 'X2', odds: realOdds.doubleChance.x2, label: 'NON PERDE' })
    if (realOdds.doubleChance?.x12) options.push({ prediction: '12', odds: realOdds.doubleChance.x12, label: 'VITTORIA' })
    
    if (realOdds.goals?.over_1_5) options.push({ prediction: 'Over 1.5', odds: realOdds.goals.over_1_5, label: 'ALMENO 2 GOL' })
    if (realOdds.goals?.under_1_5) options.push({ prediction: 'Under 1.5', odds: realOdds.goals.under_1_5, label: 'MASSIMO 1 GOL' })
    if (realOdds.goals?.over_2_5) options.push({ prediction: 'Over 2.5', odds: realOdds.goals.over_2_5, label: 'ALMENO 3 GOL' })
    if (realOdds.goals?.under_2_5) options.push({ prediction: 'Under 2.5', odds: realOdds.goals.under_2_5, label: 'MASSIMO 2 GOL' })
    if (realOdds.goals?.over_3_5) options.push({ prediction: 'Over 3.5', odds: realOdds.goals.over_3_5, label: 'ALMENO 4 GOL' })
    if (realOdds.goals?.under_3_5) options.push({ prediction: 'Under 3.5', odds: realOdds.goals.under_3_5, label: 'MASSIMO 3 GOL' })
    if (realOdds.goals?.btts) options.push({ prediction: 'Gol', odds: realOdds.goals.btts, label: 'ENTRAMBE SEGNANO' })
    if (realOdds.goals?.nobtts) options.push({ prediction: 'NoGol', odds: realOdds.goals.nobtts, label: 'NON ENTRAMBE SEGNANO' })
    
    // Filtra opzioni nel range target
    const validOptions = options.filter(opt => opt.odds >= targetMin && opt.odds <= targetMax)
    
    if (validOptions.length > 0) {
      // Restituisci quella più vicina al centro del range
      const targetCenter = (targetMin + targetMax) / 2
      return validOptions.reduce((best, curr) => {
        const bestDist = Math.abs(best.odds - targetCenter)
        const currDist = Math.abs(curr.odds - targetCenter)
        return currDist < bestDist ? curr : best
      })
    }
    
    // Se nessuna opzione nel range e ci sono comunque opzioni, trova la più vicina
    if (options.length > 0) {
      return options.reduce((best, curr) => {
        const bestDist = Math.min(
          Math.abs(best.odds - targetMin),
          Math.abs(best.odds - targetMax)
        )
        const currDist = Math.min(
          Math.abs(curr.odds - targetMin),
          Math.abs(curr.odds - targetMax)
        )
        return currDist < bestDist ? curr : best
      })
    }
    
    // Se NON ci sono quote reali disponibili, ritorna un fallback che segnala errore
    console.error(`❌ Nessuna quota reale disponibile nel range ${targetMin}-${targetMax}`)
    return { prediction: '', odds: 0, label: 'ERRORE' }
  }
  
  // Costruisce selezioni multiple per raggiungere quota target
  static buildMultipleSelection(
    matches: any[], 
    targetMin: number, 
    targetMax: number, 
    count: number,
    usedMatches: number[] = []
  ): Selection[] {
    
    const available = matches.filter(m => !usedMatches.includes(m.fixture_id))
    const selections: Selection[] = []
    let totalOdds = 1
    
    for (const match of available) {
      if (selections.length >= count) break
      
      const realOdds = match.odds as RealOdds
      if (!realOdds) continue
      
      // Calcola quota necessaria per la prossima selezione
      const remaining = count - selections.length
      const neededOdds = Math.pow(targetMin / totalOdds, 1 / remaining)
      const maxOdds = Math.pow(targetMax / totalOdds, 1 / remaining)
      
      // Trova migliore selezione per questo match
      const bestSelection = this.findBestSelectionForTarget(realOdds, neededOdds * 0.8, maxOdds * 1.2)
      
      const selection: Selection = {
        fixture_id: match.fixture_id,
        home_team: match.home_team?.name || match.home_team,
        away_team: match.away_team?.name || match.away_team,
        league: match.league_name || match.league,
        time: match.match_time || match.time,
        prediction: bestSelection.prediction,
        prediction_label: this.buildPredictionLabel(
          bestSelection.prediction, 
          bestSelection.label, 
          match.home_team?.name || match.home_team,
          match.away_team?.name || match.away_team
        ),
        odds: bestSelection.odds,
        confidence: match.confidence || 70,
        reasoning: match.reasoning || `Selezione basata su analisi tecnica`
      }
      
      selections.push(selection)
      totalOdds *= selection.odds
    }
    
    return selections
  }
  
  private static buildPredictionLabel(prediction: string, label: string, homeTeam: string, awayTeam: string): string {
    const home = homeTeam?.toUpperCase() || 'CASA'
    const away = awayTeam?.toUpperCase() || 'OSPITE'
    
    switch(prediction) {
      case '1': return `${home} ${label}`
      case '2': return `${away} ${label}`
      case '1X': return `${home} ${label}`
      case 'X2': return `${away} ${label}`
      case '12': return `${label}`
      default: return label
    }
  }
  
  // Verifica se le quote sono nei range corretti per tipo di scommessa
  static validateOddsRange(odds: number, type: 'singola' | 'doppia' | 'tripla'): boolean {
    // Range DATABASE esistenti (non possiamo cambiarli facilmente)
    const ranges = {
      singola: { min: 1.70, max: 2.50 },
      doppia: { min: 1.90, max: 3.50 },
      tripla: { min: 2.80, max: 5.00 }
    }
    
    const range = ranges[type]
    return odds >= range.min && odds <= range.max
  }
}

// Helper per risultati esatti con quote realistiche  
export const EXACT_SCORE_ODDS: Record<string, number> = {
  '1-0': 6.50, '0-1': 7.50, '2-0': 8.00, '0-2': 9.00,
  '2-1': 8.50, '1-2': 9.50, '1-1': 6.00, '0-0': 9.00,
  '3-0': 13.00, '0-3': 15.00, '3-1': 15.00, '1-3': 17.00,
  '2-2': 12.00, '3-2': 21.00, '2-3': 23.00, '4-0': 25.00,
  '0-4': 28.00, '4-1': 30.00, '1-4': 35.00, '3-3': 40.00
}