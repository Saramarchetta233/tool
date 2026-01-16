import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { amount, description, matchId, analysisType = 'match' } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Importo non valido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Se c'è un matchId, usa INSERT per prevenire race condition
    if (matchId) {
      // Prova a inserire PRIMA - se esiste già, il DB rifiuterà (unique constraint)
      const { data: insertResult, error: insertError } = await supabase
        .from('user_analyses')
        .insert({
          user_id: user.id,
          match_id: matchId,
          match_label: description || matchId,
          analysis_type: analysisType,
          credits_spent: amount
        })
        .select('id')
        .single()

      // Se errore di conflitto (23505) = già analizzato
      if (insertError) {
        if (insertError.code === '23505') {
          console.log('⚠️ Match già analizzato (unique constraint), skip spending')
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single()

          return NextResponse.json({
            success: true,
            credits: currentProfile?.credits || 0,
            spent: 0,
            alreadyAnalyzed: true
          })
        }
        // Altro errore - log e continua (potrebbe essere che la tabella non ha il constraint)
        console.log('Insert error (non-conflict):', insertError)
      }
    }

    // Get current credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits < amount) {
      // Se avevamo inserito l'analisi ma non abbiamo crediti, rimuovila
      if (matchId) {
        await supabase
          .from('user_analyses')
          .delete()
          .eq('user_id', user.id)
          .eq('match_id', matchId)
      }
      return NextResponse.json(
        { error: 'Crediti insufficienti', credits: profile?.credits || 0 },
        { status: 400 }
      )
    }

    // Spend credits using the stored function
    const { data: spendResult, error: spendError } = await supabase
      .rpc('spend_credits', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: description || 'Analisi partita'
      })

    if (spendError || !spendResult) {
      // Se errore, rimuovi l'analisi inserita
      if (matchId) {
        await supabase
          .from('user_analyses')
          .delete()
          .eq('user_id', user.id)
          .eq('match_id', matchId)
      }
      return NextResponse.json(
        { error: 'Errore durante la spesa dei crediti' },
        { status: 500 }
      )
    }

    // Get updated credits
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    console.log(`✅ Credits spent: ${amount} for match ${matchId}`)

    return NextResponse.json({
      success: true,
      credits: updatedProfile?.credits || 0,
      spent: amount
    })
  } catch (error) {
    console.error('Spend credits error:', error)
    return NextResponse.json(
      { error: 'Errore durante la spesa dei crediti' },
      { status: 500 }
    )
  }
}
