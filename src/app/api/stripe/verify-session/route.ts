import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-12-15.clover',
    })

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

    const creditsToAdd = parseInt(session.metadata?.credits || '0')
    const packageType = session.metadata?.packageType
    const userId = session.metadata?.userId || user?.id

    // If we have a user, add credits (fallback if webhook didn't process)
    if (userId && creditsToAdd > 0) {
      // Check if this session was already processed
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('status')
        .eq('stripe_session_id', sessionId)
        .single()

      // Only add credits if not already completed
      if (!existingPurchase || existingPurchase.status !== 'completed') {
        console.log(`💰 Adding ${creditsToAdd} credits to user ${userId} (verify-session fallback)`)

        // Get current credits
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single()

        const currentCredits = profile?.credits || 0
        const newCredits = currentCredits + creditsToAdd

        // Update profile with new credits and mark as purchased
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            credits: newCredits,
            has_purchased: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating credits:', updateError)
        } else {
          console.log(`✅ Credits updated: ${currentCredits} -> ${newCredits}`)

          // Record transaction
          await supabase.from('transactions').insert({
            user_id: userId,
            type: packageType === 'initial' ? 'initial' : 'purchase',
            amount: creditsToAdd,
            description: `Acquisto ${packageType} - Stripe Session ${sessionId}`,
          })

          // Update purchase status if exists
          if (existingPurchase) {
            await supabase
              .from('purchases')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('stripe_session_id', sessionId)
          }
        }
      } else {
        console.log('✅ Session already processed, skipping credit addition')
      }
    }

    // Get updated credits
    let credits = 0
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits, has_purchased')
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
