import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // Get user transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json(
        { transactions: [] }
      )
    }

    return NextResponse.json({
      transactions: transactions || []
    })
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle transazioni' },
      { status: 500 }
    )
  }
}
