import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const API_KEY = process.env.API_FOOTBALL_KEY
  const BASE_URL = 'https://v3.football.api-sports.io'
  
  // Data di oggi
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  
  // Determina la stagione corretta
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const season = month >= 1 && month <= 7 ? year - 1 : year
  
  console.log('🔍 Test API Football:')
  console.log('📅 Data:', dateStr)
  console.log('📅 Anno corrente:', year)
  console.log('📅 Mese:', month)
  console.log('📅 Stagione calcolata:', season)
  
  const results = []
  
  try {
    // Test 1: Serie A
    console.log('\n🇮🇹 Test Serie A...')
    const serieAUrl = `${BASE_URL}/fixtures?date=${dateStr}&league=135&season=${season}`
    const serieAResponse = await fetch(serieAUrl, {
      headers: {
        'X-RapidAPI-Key': API_KEY!,
        'X-RapidAPI-Host': 'v3.football.api-sports.io',
      },
    })
    
    const serieAData = await serieAResponse.json()
    console.log('Serie A response:', JSON.stringify(serieAData, null, 2))
    
    results.push({
      league: 'Serie A',
      url: serieAUrl,
      status: serieAResponse.status,
      matches: serieAData?.response?.length || 0,
      data: serieAData
    })
    
    // Test 2: Premier League
    console.log('\n🏴󐁧󐁢󐁥󐁮󐁧󐁿 Test Premier League...')
    const premierUrl = `${BASE_URL}/fixtures?date=${dateStr}&league=39&season=${season}`
    const premierResponse = await fetch(premierUrl, {
      headers: {
        'X-RapidAPI-Key': API_KEY!,
        'X-RapidAPI-Host': 'v3.football.api-sports.io',
      },
    })
    
    const premierData = await premierResponse.json()
    console.log('Premier response:', JSON.stringify(premierData, null, 2))
    
    results.push({
      league: 'Premier League',
      url: premierUrl,
      status: premierResponse.status,
      matches: premierData?.response?.length || 0,
      data: premierData
    })
    
    // Test 3: Prova anche con stagione 2024 per vedere se ci sono dati
    console.log('\n🔄 Test con stagione 2024...')
    const test2024Url = `${BASE_URL}/fixtures?date=${dateStr}&league=135&season=2024`
    const test2024Response = await fetch(test2024Url, {
      headers: {
        'X-RapidAPI-Key': API_KEY!,
        'X-RapidAPI-Host': 'v3.football.api-sports.io',
      },
    })
    
    const test2024Data = await test2024Response.json()
    
    results.push({
      league: 'Serie A (2024 test)',
      url: test2024Url,
      status: test2024Response.status,
      matches: test2024Data?.response?.length || 0,
      data: test2024Data
    })
    
    // Test 4: Fixtures dei prossimi 7 giorni
    console.log('\n📅 Test prossimi 7 giorni Serie A...')
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 7)
    const endDateStr = endDate.toISOString().split('T')[0]
    
    const next7Url = `${BASE_URL}/fixtures?from=${dateStr}&to=${endDateStr}&league=135&season=${season}`
    const next7Response = await fetch(next7Url, {
      headers: {
        'X-RapidAPI-Key': API_KEY!,
        'X-RapidAPI-Host': 'v3.football.api-sports.io',
      },
    })
    
    const next7Data = await next7Response.json()
    
    results.push({
      league: 'Serie A (prossimi 7 giorni)',
      url: next7Url,
      status: next7Response.status,
      matches: next7Data?.response?.length || 0,
      data: next7Data
    })
    
  } catch (error) {
    console.error('❌ Errore:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 })
  }
  
  return NextResponse.json({
    testInfo: {
      date: dateStr,
      year,
      month,
      calculatedSeason: season,
      apiKeyPresent: !!API_KEY,
      apiKeyLength: API_KEY?.length || 0
    },
    results,
    summary: {
      totalMatchesFound: results.reduce((sum, r) => sum + r.matches, 0),
      successfulRequests: results.filter(r => r.status === 200).length,
      failedRequests: results.filter(r => r.status !== 200).length
    }
  })
}