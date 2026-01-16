'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Eye, EyeOff, Mail, Lock, User, Gift, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'

function AttivaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const { login, signup, isAuthenticated, fetchUser } = useUserStore()

  // Token validation state
  const [validating, setValidating] = useState(true)
  const [tokenData, setTokenData] = useState<{ email: string; credits: number } | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)

  // Claim state
  const [claiming, setClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [creditsAdded, setCreditsAdded] = useState(0)

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Signup state
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      router.push('/')
    }
  }, [token, router])

  // Save token to localStorage for post-email-confirmation claim
  useEffect(() => {
    if (token) {
      localStorage.setItem('magic_link_token', token)
      console.log('Token salvato in localStorage:', token)
    }
  }, [token])

  // Validate token on mount
  useEffect(() => {
    if (token) {
      validateToken()
    }
  }, [token])

  // Auto-claim if authenticated
  useEffect(() => {
    if (isAuthenticated && token && tokenData && !claiming && !claimSuccess && !claimError) {
      claimCredits()
    }
  }, [isAuthenticated, token, tokenData])

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/magic/preview?token=${token}`)
      const data = await response.json()

      if (response.ok) {
        setTokenData({ email: data.email, credits: data.credits })
      } else {
        setTokenError(data.error)
      }
    } catch (err) {
      setTokenError('connection_error')
    } finally {
      setValidating(false)
    }
  }

  const claimCredits = async () => {
    setClaiming(true)
    setClaimError(null)

    try {
      const response = await fetch('/api/magic/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setClaimSuccess(true)
        setCreditsAdded(data.creditsAdded)
        // Remove token from localStorage
        localStorage.removeItem('magic_link_token')
        // Refresh user data
        await fetchUser()
        // Remove token from URL for security
        router.replace('/attiva')
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setClaimError(data.error)
      }
    } catch (err) {
      setClaimError('connection_error')
    } finally {
      setClaiming(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    const result = await login(loginEmail, loginPassword)

    if (result.success) {
      // Will auto-claim via useEffect
    } else {
      setLoginError(result.error || 'Credenziali non valide')
    }

    setLoginLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupLoading(true)
    setSignupError('')

    if (signupPassword.length < 6) {
      setSignupError('La password deve avere almeno 6 caratteri')
      setSignupLoading(false)
      return
    }

    const result = await signup(signupEmail, signupPassword, signupName)

    if (result.success) {
      setSignupSuccess(true)
    } else {
      setSignupError(result.error || 'Errore durante la registrazione')
    }

    setSignupLoading(false)
  }

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Verifica del link in corso...</p>
        </div>
      </div>
    )
  }

  // Token error states
  if (tokenError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/50 border-slate-800">
          <CardContent className="pt-8 text-center">
            {tokenError === 'invalid_token' && (
              <>
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Link non valido</h2>
                <p className="text-slate-400 mb-6">
                  Questo link di attivazione non e valido. Controlla di aver copiato l'URL correttamente o contatta il supporto.
                </p>
              </>
            )}
            {tokenError === 'already_used' && (
              <>
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Link gia utilizzato</h2>
                <p className="text-slate-400 mb-6">
                  Questo link di attivazione e gia stato utilizzato. Se hai bisogno di assistenza, contatta il supporto.
                </p>
              </>
            )}
            {tokenError === 'expired' && (
              <>
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Link scaduto</h2>
                <p className="text-slate-400 mb-6">
                  Questo link di attivazione e scaduto. Contatta il supporto per ricevere un nuovo link.
                </p>
              </>
            )}
            {tokenError === 'connection_error' && (
              <>
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Errore di connessione</h2>
                <p className="text-slate-400 mb-6">
                  Impossibile verificare il link. Riprova piu tardi.
                </p>
              </>
            )}
            <Link href="/">
              <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
                Torna alla homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Claim success state
  if (claimSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/50 border-slate-800">
          <CardContent className="pt-8 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Crediti Attivati!</h2>
            <div className="text-4xl font-bold text-emerald-400 my-4">+{creditsAdded}</div>
            <p className="text-slate-400 mb-6">
              I tuoi crediti sono stati aggiunti con successo. Stai per essere reindirizzato alla dashboard...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Claim error state
  if (claimError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/50 border-slate-800">
          <CardContent className="pt-8 text-center">
            {claimError === 'email_mismatch' && (
              <>
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Email non corrispondente</h2>
                <p className="text-slate-400 mb-4">
                  Per attivare i crediti devi accedere con l'email usata per l'acquisto:
                </p>
                <div className="bg-slate-800 rounded-lg p-3 mb-6">
                  <code className="text-emerald-400 font-semibold">{tokenData?.email}</code>
                </div>
                <p className="text-sm text-slate-500 mb-6">
                  Effettua il logout e accedi/registrati con l'email corretta.
                </p>
              </>
            )}
            {claimError === 'already_used' && (
              <>
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Link gia utilizzato</h2>
                <p className="text-slate-400 mb-6">
                  Questo link e gia stato utilizzato per attivare i crediti.
                </p>
              </>
            )}
            {(claimError === 'internal_error' || claimError === 'connection_error' || claimError === 'failed_to_add_credits') && (
              <>
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Errore</h2>
                <p className="text-slate-400 mb-6">
                  Si e verificato un errore durante l'attivazione. Riprova o contatta il supporto.
                </p>
                <Button
                  onClick={claimCredits}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white mb-4"
                >
                  Riprova
                </Button>
              </>
            )}
            <Link href="/">
              <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
                Torna alla homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Claiming in progress
  if (claiming) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Attivazione crediti in corso...</p>
        </div>
      </div>
    )
  }

  // Main activation page (user not logged in)
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <BarChart3 className="h-10 w-10 text-emerald-500" />
            <span className="text-3xl font-bold gradient-text">CalcioAI</span>
          </Link>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-white text-2xl">Attiva il tuo accesso CalcioAI</CardTitle>
            <CardDescription className="text-slate-400">
              Registrati con l'email usata per l'acquisto per ricevere i tuoi crediti
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Credits preview */}
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-slate-400 mb-1">Crediti in attesa di attivazione</p>
              <div className="text-3xl font-bold text-emerald-400">{tokenData?.credits || 4000}</div>
            </div>

            {/* Email hint */}
            <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm text-slate-400">Email richiesta per l'attivazione:</p>
                  <p className="text-white font-semibold">{tokenData?.email}</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="login" className="data-[state=active]:bg-emerald-600">
                  Accedi
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-emerald-600">
                  Registrati
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-900/20 rounded">
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        type="email"
                        placeholder="la.tua.email@esempio.it"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="La tua password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loginLoading ? 'Accesso in corso...' : 'Accedi e Attiva Crediti'}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-6">
                {signupSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Registrazione Completata!</h3>
                    <p className="text-slate-400 mb-4">
                      Controlla la tua email per confermare l'account, poi torna qui e accedi per attivare i crediti.
                    </p>
                    <Button
                      onClick={() => setSignupSuccess(false)}
                      variant="outline"
                      className="border-slate-700 text-white hover:bg-slate-800"
                    >
                      Torna al login
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-4">
                    {signupError && (
                      <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-900/20 rounded">
                        {signupError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Nome (opzionale)</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Il tuo nome"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          type="email"
                          placeholder="la.tua.email@esempio.it"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          type={showSignupPassword ? 'text' : 'password'}
                          placeholder="Minimo 6 caratteri"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          minLength={6}
                          className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={signupLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {signupLoading ? 'Registrazione in corso...' : 'Registrati'}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
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

export default function AttivaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Caricamento...</p>
        </div>
      </div>
    }>
      <AttivaContent />
    </Suspense>
  )
}
