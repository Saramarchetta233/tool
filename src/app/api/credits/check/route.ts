import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json()

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato', hasEnough: false },
        { status: 401 }
      )
    }

    // Get current credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    const currentCredits = profile?.credits || 0
    const hasEnough = currentCredits >= amount

    return NextResponse.json({
      hasEnough,
      credits: currentCredits,
      required: amount
    })
  } catch (error) {
    console.error('Check credits error:', error)
    return NextResponse.json(
      { error: 'Errore durante il controllo dei crediti', hasEnough: false },
      { status: 500 }
    )
  }
}
