import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Get current credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits, has_purchased, tipster_first_view')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      credits: profile?.credits || 0,
      hasPurchased: profile?.has_purchased || false,
      tipsterFirstView: profile?.tipster_first_view || false
    })
  } catch (error) {
    console.error('Get balance error:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del saldo' },
      { status: 500 }
    )
  }
}
