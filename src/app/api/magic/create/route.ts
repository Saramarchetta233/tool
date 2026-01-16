import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Verifica API key
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.MAGIC_LINK_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Genera token random 32 caratteri
    const token = crypto.randomBytes(16).toString('hex')

    // Scadenza: 30 giorni da oggi
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Salva il magic link
    const { data, error } = await supabaseAdmin
      .from('magic_links')
      .insert({
        token,
        email: email.toLowerCase().trim(),
        credits_to_grant: 4000,
        plan_type: 'one_time',
        is_used: false,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating magic link:', error)
      return NextResponse.json({ error: 'Failed to create magic link' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calcioaipro.com'
    const claimUrl = `${baseUrl}/attiva?token=${token}`

    console.log(`Magic link creato per ${email}: ${claimUrl}`)

    return NextResponse.json({
      success: true,
      token,
      claimUrl
    })

  } catch (error) {
    console.error('Magic link creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
