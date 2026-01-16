import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { matchId } = await request.json()

    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId richiesto' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Check if user already analyzed this match
    const { data: existingAnalysis } = await supabase
      .from('user_analyses')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('match_id', matchId)
      .single()

    return NextResponse.json({
      alreadyAnalyzed: !!existingAnalysis,
      analyzedAt: existingAnalysis?.created_at || null
    })
  } catch (error) {
    console.error('Check analysis error:', error)
    return NextResponse.json({
      alreadyAnalyzed: false,
      analyzedAt: null
    })
  }
}
