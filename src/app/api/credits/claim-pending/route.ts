import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
    }

    const userEmail = user.email.toLowerCase().trim()

    // Check for pending credits for this email
    const { data: pendingCredits, error: pendingError } = await supabaseAdmin
      .from('pending_credits')
      .select('*')
      .eq('email', userEmail)
      .is('claimed_at', null)
      .order('created_at', { ascending: true })

    if (pendingError) {
      console.error('Error fetching pending credits:', pendingError)
      return NextResponse.json({ error: 'database_error' }, { status: 500 })
    }

    if (!pendingCredits || pendingCredits.length === 0) {
      return NextResponse.json({
        success: true,
        creditsAdded: 0,
        message: 'No pending credits found'
      })
    }

    // Calculate total credits to add
    const totalCredits = pendingCredits.reduce((sum, pc) => sum + (pc.credits || 0), 0)

    if (totalCredits === 0) {
      return NextResponse.json({
        success: true,
        creditsAdded: 0,
        message: 'No credits to claim'
      })
    }

    // Get current user credits
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    const currentCredits = profile?.credits || 0
    const newCredits = currentCredits + totalCredits

    // Update user credits
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

    // Mark all pending credits as claimed
    const pendingIds = pendingCredits.map(pc => pc.id)
    await supabaseAdmin
      .from('pending_credits')
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: user.id
      })
      .in('id', pendingIds)

    // Record transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      type: 'pending_claim',
      amount: totalCredits,
      description: `Crediti da acquisto Stripe (${pendingCredits.length} pending)`,
    })

    console.log(`Claimed ${totalCredits} pending credits for ${userEmail}`)

    return NextResponse.json({
      success: true,
      creditsAdded: totalCredits,
      newBalance: newCredits
    })

  } catch (error) {
    console.error('Claim pending credits error:', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
