import { NextResponse } from 'next/server'

// Import the same array
const SERIE_A_PLAYERS = [
  // ATALANTA
  { name: "Marco Carnesecchi", role: "P", team: "Atalanta", team_id: 499 },
  { name: "Juan Musso", role: "P", team: "Atalanta", team_id: 499 },
  { name: "Francesco Rossi", role: "P", team: "Atalanta", team_id: 499 },
  { name: "Berat Djimsiti", role: "D", team: "Atalanta", team_id: 499 },
  { name: "Rafael Tolói", role: "D", team: "Atalanta", team_id: 499 },
  { name: "Sead Kolašinac", role: "D", team: "Atalanta", team_id: 499 },
  { name: "Matteo Ruggeri", role: "D", team: "Atalanta", team_id: 499 },
  { name: "Giorgio Scalvini", role: "D", team: "Atalanta", team_id: 499 },
  { name: "Davide Zappacosta", role: "D", team: "Atalanta", team_id: 499 },
  { name: "Mitchel Bakker", role: "D", team: "Atalanta", team_id: 499 },
  { name: "Marten de Roon", role: "C", team: "Atalanta", team_id: 499 },
  { name: "Éderson", role: "C", team: "Atalanta", team_id: 499 },
  { name: "Teun Koopmeiners", role: "C", team: "Atalanta", team_id: 499 },
  { name: "Mario Pašalić", role: "C", team: "Atalanta", team_id: 499 },
  { name: "Aleksey Miranchuk", role: "C", team: "Atalanta", team_id: 499 },
  { name: "Ademola Lookman", role: "A", team: "Atalanta", team_id: 499 },
  { name: "Charles De Ketelaere", role: "A", team: "Atalanta", team_id: 499 },
  { name: "Mateo Retegui", role: "A", team: "Atalanta", team_id: 499 },
  { name: "Gianluca Scamacca", role: "A", team: "Atalanta", team_id: 499 },

  // BOLOGNA
  { name: "Łukasz Skorupski", role: "P", team: "Bologna", team_id: 500 },
  { name: "Federico Ravaglia", role: "P", team: "Bologna", team_id: 500 },
  { name: "Nicola Bagnolini", role: "P", team: "Bologna", team_id: 500 },
  { name: "Stefan Posch", role: "D", team: "Bologna", team_id: 500 },
  { name: "Riccardo Calafiori", role: "D", team: "Bologna", team_id: 500 },
  { name: "Sam Beukema", role: "D", team: "Bologna", team_id: 500 },
  { name: "Charalampos Lykogiannis", role: "D", team: "Bologna", team_id: 500 },
  { name: "Lorenzo De Silvestri", role: "D", team: "Bologna", team_id: 500 },
  { name: "Jhon Lucumí", role: "D", team: "Bologna", team_id: 500 },
  { name: "Lewis Ferguson", role: "C", team: "Bologna", team_id: 500 },
  { name: "Nicolò Cambiaghi", role: "C", team: "Bologna", team_id: 500 },
  { name: "Remo Freuler", role: "C", team: "Bologna", team_id: 500 },
  { name: "Nikola Moro", role: "C", team: "Bologna", team_id: 500 },
  { name: "Kacper Urbanski", role: "C", team: "Bologna", team_id: 500 },
  { name: "Michel Aebischer", role: "C", team: "Bologna", team_id: 500 },
  { name: "Riccardo Orsolini", role: "A", team: "Bologna", team_id: 500 },
  { name: "Joshua Zirkzee", role: "A", team: "Bologna", team_id: 500 },
  { name: "Dan Ndoye", role: "A", team: "Bologna", team_id: 500 },
  { name: "Santiago Castro", role: "A", team: "Bologna", team_id: 500 },
  { name: "Federico Bernardeschi", role: "C", team: "Bologna", team_id: 500 },

  // CAGLIARI
  { name: "Simone Scuffet", role: "P", team: "Cagliari", team_id: 501 },
  { name: "Boris Radunović", role: "P", team: "Cagliari", team_id: 501 },
  { name: "Alen Sherri", role: "P", team: "Cagliari", team_id: 501 },
  { name: "Sebastiano Luperto", role: "D", team: "Cagliari", team_id: 501 },
  { name: "Yerry Mina", role: "D", team: "Cagliari", team_id: 501 },
  { name: "Pantelis Hatzidiakos", role: "D", team: "Cagliari", team_id: 501 },
  { name: "Tommaso Augello", role: "D", team: "Cagliari", team_id: 501 },
  { name: "Gabriele Zappa", role: "D", team: "Cagliari", team_id: 501 },
  { name: "Paulo Azzi", role: "D", team: "Cagliari", team_id: 501 },
  { name: "Matteo Prati", role: "C", team: "Cagliari", team_id: 501 },
  { name: "Razvan Marin", role: "C", team: "Cagliari", team_id: 501 },
  { name: "Antoine Makoumbou", role: "C", team: "Cagliari", team_id: 501 },
  { name: "Nicolas Viola", role: "C", team: "Cagliari", team_id: 501 },
  { name: "Gianluca Gaetano", role: "C", team: "Cagliari", team_id: 501 },
  { name: "Zito Luvumbo", role: "A", team: "Cagliari", team_id: 501 },
  { name: "Eldor Shomurodov", role: "A", team: "Cagliari", team_id: 501 },
  { name: "Roberto Piccoli", role: "A", team: "Cagliari", team_id: 501 },
  { name: "Kingstone Mutandwa", role: "A", team: "Cagliari", team_id: 501 },

  // COMO
  { name: "Emil Audero", role: "P", team: "Como", team_id: 477 },
  { name: "Pepe Reina", role: "P", team: "Como", team_id: 477 },
  { name: "Adrian Semper", role: "P", team: "Como", team_id: 477 },
  { name: "Alberto Moreno", role: "D", team: "Como", team_id: 477 },
  { name: "Federico Barba", role: "D", team: "Como", team_id: 477 },
  { name: "Marco Sala", role: "D", team: "Como", team_id: 477 },
  { name: "Ignace Van Der Brempt", role: "D", team: "Como", team_id: 477 },
  { name: "Edoardo Goldaniga", role: "D", team: "Como", team_id: 477 },
  { name: "Marc Kempf", role: "D", team: "Como", team_id: 477 },
  { name: "Sergi Roberto", role: "C", team: "Como", team_id: 477 },
  { name: "Nico Paz", role: "C", team: "Como", team_id: 477 },
  { name: "Yannik Engelhardt", role: "C", team: "Como", team_id: 477 },
  { name: "Máximo Perrone", role: "C", team: "Como", team_id: 477 },
  { name: "Lucas da Cunha", role: "C", team: "Como", team_id: 477 },
  { name: "Alieu Fadera", role: "A", team: "Como", team_id: 477 },
  { name: "Andrea Belotti", role: "A", team: "Como", team_id: 477 },
  { name: "Assane Diao", role: "A", team: "Como", team_id: 477 },
  { name: "Patrick Cutrone", role: "A", team: "Como", team_id: 477 },
]

export async function GET() {
  try {
    const teamCounts = SERIE_A_PLAYERS.reduce((acc: Record<string, number>, player) => {
      acc[player.team] = (acc[player.team] || 0) + 1
      return acc
    }, {})

    const teams = Object.entries(teamCounts).map(([team, count]) => ({ team, count }))
      .sort((a, b) => a.team.localeCompare(b.team))

    return NextResponse.json({ 
      total_players: SERIE_A_PLAYERS.length,
      total_teams: teams.length,
      teams,
      has_como: teams.some(t => t.team === 'Como'),
      como_players: SERIE_A_PLAYERS.filter(p => p.team === 'Como').length
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}