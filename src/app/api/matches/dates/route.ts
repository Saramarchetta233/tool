import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }
      }
    )
    
    // Query per ottenere tutte le date con partite
    const { data: dates, error } = await supabase
      .from('matches')
      .select('match_date')
      .order('match_date', { ascending: true })
    
    if (error) throw error
    
    // Raggruppa per data e conta
    const dateCount: Record<string, number> = {}
    dates?.forEach(row => {
      const date = row.match_date
      dateCount[date] = (dateCount[date] || 0) + 1
    })
    
    // Converti in array ordinato con info sui giorni
    const sortedDates = Object.entries(dateCount)
      .map(([date, count]) => {
        const d = new Date(date)
        const dayName = d.toLocaleDateString('it-IT', { weekday: 'long' })
        const isWeekend = d.getDay() === 0 || d.getDay() === 6
        
        return {
          date,
          count,
          dayName,
          isWeekend,
          dayOfWeek: d.getDay()
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))
    
    // Trova domenica 4 gennaio
    const sunday4Jan = sortedDates.find(d => d.date === '2025-01-04')
    
    // Identifica gap
    const gaps: string[] = []
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const current = new Date(sortedDates[i].date)
      const next = new Date(sortedDates[i + 1].date)
      const diffDays = Math.floor((next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays > 1) {
        gaps.push(`Gap di ${diffDays - 1} giorni tra ${sortedDates[i].date} e ${sortedDates[i + 1].date}`)
      }
    }
    
    const today = new Date().toISOString().split('T')[0]
    const futureDates = sortedDates.filter(d => d.date >= today)
    
    return NextResponse.json({
      success: true,
      totalDates: sortedDates.length,
      totalMatches: dates?.length || 0,
      dateRange: {
        from: sortedDates[0]?.date,
        to: sortedDates[sortedDates.length - 1]?.date
      },
      futureDates: {
        count: futureDates.length,
        dates: futureDates
      },
      sunday4January: sunday4Jan || { status: 'NOT FOUND', message: 'Domenica 4 gennaio non ha partite!' },
      gaps: gaps.length > 0 ? gaps : 'Nessun gap trovato',
      allDates: sortedDates
    })
    
  } catch (error) {
    console.error('Error fetching match dates:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}