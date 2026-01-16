import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Credit packages configuration
const CREDIT_PACKAGES = {
  initial: {
    name: 'CalcioAI - Accesso Completo',
    description: 'Accesso a CalcioAI per tutta la stagione + 4000 crediti',
    price: 4900, // in cents (49.00 EUR)
    credits: 4000,
  },
  recharge_500: {
    name: 'Ricarica 500 Crediti',
    description: '500 crediti per CalcioAI',
    price: 999, // 9.99 EUR
    credits: 500,
  },
  recharge_1500: {
    name: 'Ricarica 1500 Crediti',
    description: '1500 crediti per CalcioAI',
    price: 2499, // 24.99 EUR
    credits: 1500,
  },
  recharge_3000: {
    name: 'Ricarica 3000 Crediti',
    description: '3000 crediti per CalcioAI',
    price: 3999, // 39.99 EUR
    credits: 3000,
  },
}

export async function POST(request: NextRequest) {
  try {
    const { packageType } = await request.json()

    if (!packageType || !CREDIT_PACKAGES[packageType as keyof typeof CREDIT_PACKAGES]) {
      return NextResponse.json(
        { error: 'Pacchetto non valido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // For recharges, user must be authenticated
    if (packageType !== 'initial' && (!user || authError)) {
      return NextResponse.json(
        { error: 'Devi essere autenticato per ricaricare i crediti' },
        { status: 401 }
      )
    }

    const pkg = CREDIT_PACKAGES[packageType as keyof typeof CREDIT_PACKAGES]

    // ============================================
    // LOCALHOST TEST MODE - Bypass Stripe
    // ============================================
    const isLocalhost = process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')

    if (isLocalhost && user) {
      console.log('🧪 LOCALHOST TEST MODE - Bypassing Stripe')
      console.log(`💰 Adding ${pkg.credits} credits to user ${user.id}`)

      // Add credits directly
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          credits: supabase.rpc ? undefined : pkg.credits, // Will use raw update below
          has_purchased: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      // Update credits with increment
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      const newCredits = (profile?.credits || 0) + pkg.credits

      await supabase
        .from('profiles')
        .update({
          credits: newCredits,
          has_purchased: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: packageType === 'initial' ? 'initial' : 'purchase',
        amount: pkg.credits,
        description: `[TEST] ${pkg.name}`,
      })

      console.log(`✅ Credits added successfully. New balance: ${newCredits}`)

      // In localhost test mode, redirect directly to dashboard with success message
      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?acquisto=completato&crediti=${pkg.credits}`,
        sessionId: `test_${Date.now()}`,
        testMode: true,
      })
    }
    // ============================================
    // END LOCALHOST TEST MODE
    // ============================================

    // Production: Use Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pkg.name,
              description: pkg.description,
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento-completato?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento-annullato`,
      metadata: {
        userId: user?.id || '',
        packageType,
        credits: pkg.credits.toString(),
      },
      // If it's initial purchase, we'll need to collect email for account creation
      ...(packageType === 'initial' && !user && {
        customer_email: undefined, // Will be collected in checkout
      }),
    })

    // Record pending purchase
    if (user) {
      await supabase.from('purchases').insert({
        user_id: user.id,
        package_type: packageType,
        amount_eur: pkg.price / 100,
        credits_amount: pkg.credits,
        stripe_session_id: session.id,
        status: 'pending',
      })
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione del pagamento' },
      { status: 500 }
    )
  }
}
