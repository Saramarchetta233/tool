'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Eye, EyeOff, Mail, Lock, User, Gift, Check } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Le password non coincidono")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri")
      setLoading(false)
      return
    }

    try {
      // TODO: Implementare registrazione con Supabase
      // Per ora simuliamo una registrazione di successo
      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push('/dashboard')
    } catch (err) {
      setError("Errore durante la registrazione. Riprova.")
    } finally {
      setLoading(false)
    }
  }

  const features = [
    "Analisi AI avanzate per ogni partita",
    "Probabilità precise calcolate in tempo reale",
    "Dashboard personalizzata con statistiche",
    "Tipster AI per consigli quotidiani",
    "FantaCoach per gestire la tua squadra"
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8">
        {/* Form di registrazione */}
        <Card className="w-full lg:w-1/2 bg-slate-900/50 border-slate-800">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <BarChart3 className="h-8 w-8 text-emerald-500" />
              <span className="text-2xl font-bold gradient-text">CalcioAI</span>
            </div>
            <CardTitle className="text-white">Unisciti a CalcioAI</CardTitle>
            <CardDescription className="text-slate-400">
              Crea il tuo account e inizia ad analizzare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-900/20 rounded">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    name="name"
                    type="text"
                    placeholder="Il tuo nome"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    name="email"
                    type="email"
                    placeholder="la.tua.email@esempio.it"
                    value={formData.email}
                    onChange={handleInputChange}
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crea una password sicura"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
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
                <label className="text-sm font-medium text-slate-300">Conferma password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ripeti la password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
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
                {loading ? "Registrazione in corso..." : "Crea il tuo account"}
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-slate-500">
                  Hai già un account?{" "}
                  <Link href="/login" className="text-emerald-400 hover:underline">
                    Accedi qui
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Pannello informazioni */}
        <div className="w-full lg:w-1/2 space-y-6">
          <Card className="bg-gradient-to-br from-emerald-900/20 to-blue-900/20 border-emerald-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Offerta Lancio</CardTitle>
                <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                  <Gift className="h-3 w-3 mr-1" />
                  Limitata
                </Badge>
              </div>
              <CardDescription className="text-slate-300">
                Accesso completo a tutte le funzionalità
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">€27</div>
                <div className="text-sm text-slate-400 line-through">€97</div>
                <div className="text-sm text-emerald-400">100 analisi incluse</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/30 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Cosa ottieni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}