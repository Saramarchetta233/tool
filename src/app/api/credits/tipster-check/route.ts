import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Check if user can view TipsterAI for free (first time) or needs to pay
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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits, tipster_first_view')
      .eq('id', user.id)
      .single()

    const isFirstView = !profile?.tipster_first_view
    const credits = profile?.credits || 0

    return NextResponse.json({
      isFirstView,
      credits,
      canRegenerate: isFirstView || credits >= 10
    })
  } catch (error) {
    console.error('Tipster check error:', error)
    return NextResponse.json(
      { error: 'Errore nel controllo' },
      { status: 500 }
    )
  }
}

// Mark first view as used
export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Use the stored function to check and mark first view
    const { data: isFirstView, error } = await supabase
      .rpc('check_tipster_first_view', {
        p_user_id: user.id
      })

    if (error) {
      console.error('Error checking first view:', error)
      return NextResponse.json(
        { error: 'Errore nel controllo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      wasFirstView: isFirstView,
      message: isFirstView ? 'Prima visualizzazione gratuita utilizzata' : 'Non era la prima visualizzazione'
    })
  } catch (error) {
    console.error('Tipster mark error:', error)
    return NextResponse.json(
      { error: 'Errore' },
      { status: 500 }
    )
  }
}
