'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, CheckCircle, Gift, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'

export default function EmailConfermataPage() {
  const router = useRouter()
  const { fetchUser, isAuthenticated } = useUserStore()
  const supabase = createClient()

  const [status, setStatus] = useState<'loading' | 'success' | 'claiming' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [claimedCredits, setClaimedCredits] = useState<number>(0)

  useEffect(() => {
    handleEmailConfirmation()
  }, [])

  const handleEmailConfirmation = async () => {
    try {
      // Supabase automatically handles the token exchange from URL hash
      // We just need to get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        setStatus('error')
        setErrorMessage('Errore durante la verifica della sessione')
        return
      }

      if (!session) {
        // Try to exchange the hash params for a session
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (setSessionError) {
            console.error('Set session error:', setSessionError)
            setStatus('error')
            setErrorMessage('Errore durante il login automatico')
            return
          }
        } else {
          // No session and no tokens - might be a direct visit
          setStatus('error')
          setErrorMessage('Link non valido o sessione scaduta')
          return
        }
      }

      // Fetch user data to update the store
      await fetchUser()

      // Check for credits to claim (magic link OR pending credits from Stripe)
      setStatus('claiming')
      await claimAllCredits()

    } catch (error) {
      console.error('Email confirmation error:', error)
      setStatus('error')
      setErrorMessage('Si e verificato un errore. Riprova.')
    }
  }

  const claimAllCredits = async () => {
    let totalClaimed = 0

    try {
      // 1. Check for magic link token in localStorage
      const magicToken = localStorage.getItem('magic_link_token')

      if (magicToken) {
        console.log('Found magic link token, claiming...')
        const magicRes = await fetch('/api/magic/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: magicToken })
        })

        const magicData = await magicRes.json()

        if (magicData.success && magicData.creditsAdded) {
          totalClaimed += magicData.creditsAdded
          console.log(`Magic link claimed: +${magicData.creditsAdded}`)
        }

        // Remove token regardless of outcome
        localStorage.removeItem('magic_link_token')
      }

      // 2. Check for pending credits from Stripe
      console.log('Checking for pending Stripe credits...')
      const pendingRes = await fetch('/api/credits/claim-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const pendingData = await pendingRes.json()

      if (pendingData.success && pendingData.creditsAdded > 0) {
        totalClaimed += pendingData.creditsAdded
        console.log(`Pending credits claimed: +${pendingData.creditsAdded}`)
      }

      // Update state with total claimed
      if (totalClaimed > 0) {
        setClaimedCredits(totalClaimed)
        // Refresh user data with new credits
        await fetchUser()
      }

      setStatus('success')

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

    } catch (error) {
      console.error('Claim credits error:', error)
      localStorage.removeItem('magic_link_token')
      setStatus('success') // Still show success for email confirmation
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <BarChart3 className="h-10 w-10 text-emerald-500" />
            <span className="text-3xl font-bold gradient-text">CalcioAI</span>
          </Link>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-8 text-center">
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Verifica in corso...</h2>
                <p className="text-slate-400">Stiamo confermando la tua email</p>
              </>
            )}

            {status === 'claiming' && (
              <>
                <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-violet-400 animate-pulse" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Attivazione crediti...</h2>
                <p className="text-slate-400">Stiamo attivando i tuoi crediti</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Email Confermata!</h2>

                {claimedCredits > 0 ? (
                  <div className="space-y-4">
                    <p className="text-slate-400">Il tuo account e attivo</p>
                    <div className="bg-violet-900/30 border border-violet-500/30 rounded-xl p-4">
                      <p className="text-violet-300 text-sm mb-1">Crediti attivati</p>
                      <div className="text-4xl font-bold text-violet-400">+{claimedCredits}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">Il tuo account e ora attivo</p>
                )}

                <div className="mt-6">
                  <p className="text-slate-500 text-sm mb-2">Reindirizzamento alla dashboard...</p>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">!</span>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Ops!</h2>
                <p className="text-slate-400 mb-6">{errorMessage}</p>
                <Link
                  href="/accedi"
                  className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Vai al login
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
