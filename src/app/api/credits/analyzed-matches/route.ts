import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ analyzedMatches: [] })
    }

    // Get all match IDs the user has analyzed
    const { data: analyses } = await supabase
      .from('user_analyses')
      .select('match_id')
      .eq('user_id', user.id)

    const analyzedMatches = analyses?.map(a => a.match_id) || []

    return NextResponse.json({ analyzedMatches })
  } catch (error) {
    console.error('Get analyzed matches error:', error)
    return NextResponse.json({ analyzedMatches: [] })
  }
}
