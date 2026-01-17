import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // L'utente deve essere loggato
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'token_required' }, { status: 400 })
    }

    // Cerca il magic link
    const { data: magicLink, error: findError } = await supabaseAdmin
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single()

    // VERIFICA 1: Token esiste?
    if (findError || !magicLink) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
    }

    // VERIFICA 2: Gia usato?
    if (magicLink.is_used) {
      return NextResponse.json({ error: 'already_used' }, { status: 400 })
    }

    // VERIFICA 3: Scaduto?
    if (new Date(magicLink.expires_at) < new Date()) {
      return NextResponse.json({ error: 'expired' }, { status: 400 })
    }

    // VERIFICA 4: Email corrisponde?
    const userEmail = user.email?.toLowerCase().trim()
    const linkEmail = magicLink.email.toLowerCase().trim()

    if (userEmail !== linkEmail) {
      return NextResponse.json({
        error: 'email_mismatch',
        expectedEmail: linkEmail
      }, { status: 400 })
    }

    // TUTTO OK! Aggiungi crediti
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    const currentCredits = profile?.credits || 0
    const newCredits = currentCredits + magicLink.credits_to_grant

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        credits: newCredits,
        has_purchased: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating credits:', updateError)
      return NextResponse.json({ error: 'failed_to_add_credits' }, { status: 500 })
    }

    // Marca il link come USATO (non puo piu essere utilizzato)
    await supabaseAdmin
      .from('magic_links')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        used_by_user_id: user.id
      })
      .eq('token', token)

    // Registra la transazione
    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      type: 'magic_link',
      amount: magicLink.credits_to_grant,
      description: `Magic link attivato - ${magicLink.plan_type}`,
    })

    console.log(`Magic link riscattato! ${userEmail} ha ricevuto ${magicLink.credits_to_grant} crediti`)

    return NextResponse.json({
      success: true,
      creditsAdded: magicLink.credits_to_grant,
      newBalance: newCredits
    })

  } catch (error) {
    console.error('Magic link claim error:', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
