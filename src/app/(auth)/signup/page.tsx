import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Gift } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BarChart3 className="h-8 w-8 text-emerald-500" />
            <span className="text-2xl font-bold gradient-text">CalcioAI</span>
          </div>
          <CardTitle className="text-white">Accesso Immediato</CardTitle>
          <CardDescription className="text-slate-400">
            Sblocca CalcioAI con 100 analisi e tutte le funzionalità
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge className="mb-4 bg-red-500/10 text-red-400 border-red-500/20">
              <Gift className="h-3 w-3 mr-1" />
              Solo €27 - Offerta Lancio
            </Badge>
            
            <p className="text-slate-400 text-sm mb-4">
              Per registrarti, configura prima le variabili d'ambiente:
            </p>
            <ul className="text-xs text-slate-500 space-y-1 text-left">
              <li>• NEXT_PUBLIC_SUPABASE_URL</li>
              <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
          
          <div className="pt-4 space-y-2">
            <Link href="/">
              <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800">
                Torna alla Home
              </Button>
            </Link>
            <p className="text-xs text-slate-500 text-center">
              Hai già un account? <Link href="/login" className="text-emerald-400 hover:underline">Accedi</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}