import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.userId
    const packageType = session.metadata?.packageType
    const credits = parseInt(session.metadata?.credits || '0')

    if (!credits) {
      console.error('No credits in session metadata')
      return NextResponse.json({ error: 'No credits' }, { status: 400 })
    }

    try {
      // If it's an initial purchase without user, we need to handle registration
      if (packageType === 'initial' && !userId) {
        // Customer email from Stripe
        const customerEmail = session.customer_details?.email

        if (customerEmail) {
          // Store pending credits for this email - will be applied at signup
          await supabaseAdmin.from('pending_credits').insert({
            email: customerEmail,
            credits: credits,
            stripe_session_id: session.id,
            package_type: packageType,
            created_at: new Date().toISOString(),
          })

          console.log(`Stored ${credits} pending credits for ${customerEmail}`)
        }
      } else if (userId) {
        // Add credits to existing user
        const { error: creditsError } = await supabaseAdmin.rpc('add_credits', {
          p_user_id: userId,
          p_amount: credits,
          p_description: `Acquisto pacchetto ${packageType}`,
          p_type: packageType === 'initial' ? 'initial' : 'purchase',
          p_stripe_session_id: session.id,
        })

        if (creditsError) {
          console.error('Error adding credits:', creditsError)
          return NextResponse.json({ error: 'Credits error' }, { status: 500 })
        }

        // If initial purchase, mark user as having purchased
        if (packageType === 'initial') {
          await supabaseAdmin
            .from('profiles')
            .update({ has_purchased: true })
            .eq('id', userId)

          console.log(`Marked user ${userId} as has_purchased`)
        }

        // Update purchase status
        await supabaseAdmin
          .from('purchases')
          .update({
            status: 'completed',
            stripe_payment_intent_id: session.payment_intent as string,
            completed_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id)

        console.log(`Added ${credits} credits to user ${userId}`)
      }
    } catch (error) {
      console.error('Error processing webhook:', error)
      return NextResponse.json({ error: 'Processing error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
