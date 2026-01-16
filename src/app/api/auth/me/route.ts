import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      )
    }

    // Fetch user profile with credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name,
        credits: profile?.credits || 0,
        hasPurchased: profile?.has_purchased || false,
        tipsterFirstView: profile?.tipster_first_view || false,
        preferredLeagues: profile?.preferred_leagues || [],
        goal: profile?.goal || 'both',
        createdAt: profile?.created_at,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero utente' },
      { status: 500 }
    )
  }
}
