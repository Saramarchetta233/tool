'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabaseRef = useRef<any>(null)
  const initStarted = useRef(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initStarted.current) return
    initStarted.current = true

    const initSession = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        supabaseRef.current = supabase

        // Listen for auth state changes - Supabase fires PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
          console.log('Auth event:', event, session ? 'has session' : 'no session')

          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            if (session) {
              setSessionReady(true)
              setInitializing(false)
            }
          }
        })

        // Give Supabase a moment to auto-process the URL hash
        await new Promise(resolve => setTimeout(resolve, 500))

        // Check if session was established
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session check:', session ? 'found' : 'not found')

        if (session) {
          setSessionReady(true)
          setInitializing(false)
          return
        }

        // Try manual token extraction if no session yet
        const hash = window.location.hash
        console.log('URL hash:', hash ? 'present' : 'empty')

        if (hash && hash.length > 1) {
          const hashParams = new URLSearchParams(hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')

          console.log('Tokens found:', accessToken ? 'yes' : 'no')

          if (accessToken && refreshToken) {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })

            if (sessionError) {
              console.error('Set session error:', sessionError)
            } else if (data.session) {
              console.log('Session established manually')
              setSessionReady(true)
              setInitializing(false)
              window.history.replaceState(null, '', '/reset-password')
              return
            }
          }
        }

        // Wait a bit more for auth state change event
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Final check
        const { data: { session: finalSession } } = await supabase.auth.getSession()
        if (finalSession) {
          setSessionReady(true)
        } else {
          console.log('No session after all attempts')
          setSessionError(true)
        }
        setInitializing(false)

        return () => {
          subscription.unsubscribe()
        }
      } catch (err) {
        console.error('Init error:', err)
        setSessionError(true)
        setInitializing(false)
      }
    }

    initSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri')
      return
    }

    if (password !== confirmPassword) {
      setError('Le password non corrispondono')
      return
    }

    setLoading(true)

    try {
      if (!supabaseRef.current) {
        setError('Errore di inizializzazione')
        setLoading(false)
        return
      }

      const { error } = await supabaseRef.current.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/accedi')
        }, 3000)
      }
    } catch (err) {
      setError('Errore durante il reset della password')
    }

    setLoading(false)
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
          <CardContent className="pt-8">
            {initializing ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Verifica in corso...</h3>
                <p className="text-slate-400">Stiamo verificando il link</p>
              </div>
            ) : sessionError ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Link Scaduto</h3>
                <p className="text-slate-400 mb-6">
                  Il link per reimpostare la password e scaduto o non valido.
                </p>
                <Link href="/accedi">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Richiedi un nuovo link
                  </Button>
                </Link>
              </div>
            ) : success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Password Aggiornata!</h3>
                <p className="text-slate-400 mb-4">
                  La tua password e stata reimpostata con successo.
                </p>
                <p className="text-slate-500 text-sm mb-4">
                  Reindirizzamento al login...
                </p>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
              </div>
            ) : sessionReady ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Nuova Password</h3>
                  <p className="text-slate-400 text-sm">
                    Inserisci la tua nuova password
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-900/20 rounded">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Nuova Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimo 6 caratteri"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Conferma Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Ripeti la password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loading ? 'Salvataggio...' : 'Salva Nuova Password'}
                  </Button>
                </form>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            Torna alla homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
