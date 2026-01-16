'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Eye, EyeOff, Mail, Lock, User, CreditCard, CheckCircle, ArrowLeft, KeyRound } from "lucide-react"
import { useUserStore } from "@/stores/userStore"

export default function AccediPage() {
  const router = useRouter()
  const { login, signup } = useUserStore()

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Signup state
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupName, setSignupName] = useState("")
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState("")
  const [signupSuccess, setSignupSuccess] = useState(false)

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState("")
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")

    const result = await login(loginEmail, loginPassword)

    if (result.success) {
      router.push('/dashboard')
    } else {
      setLoginError(result.error || "Credenziali non valide")
    }

    setLoginLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupLoading(true)
    setSignupError("")

    if (signupPassword.length < 6) {
      setSignupError("La password deve avere almeno 6 caratteri")
      setSignupLoading(false)
      return
    }

    const result = await signup(signupEmail, signupPassword, signupName)

    if (result.success) {
      setSignupSuccess(true)
    } else {
      setSignupError(result.error || "Errore durante la registrazione")
    }

    setSignupLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetError("")

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResetError(data.error || "Errore durante l'invio dell'email")
      } else {
        setResetSuccess(true)
      }
    } catch (error) {
      setResetError("Errore di connessione")
    }

    setResetLoading(false)
  }

  const handlePurchase = async () => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageType: 'initial' }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setLoginError('Errore durante la creazione del pagamento')
      }
    } catch (error) {
      setLoginError('Errore di connessione')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <BarChart3 className="h-10 w-10 text-emerald-500" />
            <span className="text-3xl font-bold gradient-text">CalcioAI</span>
          </Link>
          <p className="text-slate-400">
            Il tuo assistente AI per il calcio
          </p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-white text-xl">Accedi o Registrati</CardTitle>
            <CardDescription className="text-slate-400">
              Inizia ad analizzare le partite con l'intelligenza artificiale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
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
                {showForgotPassword ? (
                  // Forgot Password View
                  resetSuccess ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-8 w-8 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Email Inviata!</h3>
                      <p className="text-slate-400 mb-2">
                        Abbiamo inviato un link per reimpostare la password a:
                      </p>
                      <p className="text-emerald-400 font-semibold mb-4">{resetEmail}</p>
                      <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm text-slate-300 mb-2">Cosa fare ora:</p>
                        <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1">
                          <li>Controlla la tua casella email</li>
                          <li>Clicca sul link nel messaggio</li>
                          <li>Scegli una nuova password</li>
                        </ol>
                        <p className="text-xs text-slate-500 mt-3">
                          Non trovi l'email? Controlla la cartella spam.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setShowForgotPassword(false)
                          setResetSuccess(false)
                          setResetEmail("")
                        }}
                        variant="outline"
                        className="border-slate-700 text-white hover:bg-slate-800"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Torna al login
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false)
                          setResetError("")
                        }}
                        className="flex items-center text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Torna al login
                      </button>

                      <div className="text-center py-4">
                        <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <KeyRound className="h-7 w-7 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Password Dimenticata?</h3>
                        <p className="text-slate-400 text-sm">
                          Inserisci la tua email e ti invieremo un link per reimpostare la password.
                        </p>
                      </div>

                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        {resetError && (
                          <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-900/20 rounded">
                            {resetError}
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <Input
                              type="email"
                              placeholder="la.tua.email@esempio.it"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={resetLoading}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          {resetLoading ? "Invio in corso..." : "Invia Link di Reset"}
                        </Button>
                      </form>
                    </div>
                  )
                ) : (
                  // Normal Login Form
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
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-300">Password</label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          Password dimenticata?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          type={showLoginPassword ? "text" : "password"}
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
                      {loginLoading ? "Accesso in corso..." : "Accedi"}
                    </Button>
                  </form>
                )}
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
                      Controlla la tua email per confermare l'account, poi torna qui per accedere.
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

                    {/* Info box */}
                    <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-emerald-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-emerald-400 font-medium">Dopo la registrazione</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Completa l'acquisto di <span className="text-white font-semibold">49</span> per ricevere
                            <span className="text-emerald-400 font-semibold"> 4000 crediti</span> e accesso per tutta la stagione!
                          </p>
                        </div>
                      </div>
                    </div>

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
                          type={showSignupPassword ? "text" : "password"}
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
                      {signupLoading ? "Registrazione in corso..." : "Registrati"}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">oppure</span>
              </div>
            </div>

            {/* Purchase CTA */}
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-3">
                Non hai ancora un account?
              </p>
              <Button
                onClick={handlePurchase}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Acquista Ora - 49 (4000 crediti)
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Accesso per tutta la stagione 2025/2026
              </p>
            </div>
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
