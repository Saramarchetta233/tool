import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID mancante' },
        { status: 400 }
      )
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Pagamento non completato', status: session.payment_status },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get user credits if logged in
    let credits = 0
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      credits = profile?.credits || 0
    }

    return NextResponse.json({
      success: true,
      paymentStatus: session.payment_status,
      packageType: session.metadata?.packageType,
      creditsAdded: session.metadata?.credits,
      customerEmail: session.customer_details?.email,
      currentCredits: credits,
    })
  } catch (error) {
    console.error('Verify session error:', error)
    return NextResponse.json(
      { error: 'Errore nella verifica del pagamento' },
      { status: 500 }
    )
  }
}
