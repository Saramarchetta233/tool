import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BarChart3 className="h-8 w-8 text-emerald-500" />
            <span className="text-2xl font-bold gradient-text">CalcioAI</span>
          </div>
          <CardTitle className="text-white">Bentornato</CardTitle>
          <CardDescription className="text-slate-400">
            Accedi al tuo account per continuare l'analisi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-4">
              Per accedere, configura prima le variabili d'ambiente:
            </p>
            <ul className="text-xs text-slate-500 space-y-1 text-left">
              <li>• NEXT_PUBLIC_SUPABASE_URL</li>
              <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
          
          <div className="pt-4">
            <Link href="/">
              <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800">
                Torna alla Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}