import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

function obfuscateEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local.charAt(0)}***@${domain}`
  }
  const obfuscatedLocal = local.charAt(0) + '***' + local.charAt(local.length - 1)
  return `${obfuscatedLocal}@${domain}`
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'token_required' }, { status: 400 })
  }

  const { data: magicLink, error } = await supabaseAdmin
    .from('magic_links')
    .select('email, is_used, expires_at, credits_to_grant')
    .eq('token', token)
    .single()

  if (error || !magicLink) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }

  if (magicLink.is_used) {
    return NextResponse.json({ error: 'already_used' }, { status: 400 })
  }

  if (new Date(magicLink.expires_at) < new Date()) {
    return NextResponse.json({ error: 'expired' }, { status: 400 })
  }

  return NextResponse.json({
    email: obfuscateEmail(magicLink.email),
    credits: magicLink.credits_to_grant
  })
}
