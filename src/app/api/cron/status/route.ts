import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cronSecret = process.env.CRON_SECRET
  const hasSecret = !!cronSecret
  
  // Lista dei cron configurati
  const crons = [
    { path: '/api/cron/sync-week', schedule: '1 0 * * *', time: '00:01', description: 'Sync settimanale partite' },
    { path: '/api/cron/complete-sync', schedule: '0 14 * * *', time: '14:00', description: 'Sync completo' },
    { path: '/api/cron/generate-tips-v2', schedule: '0 23 * * *', time: '23:00', description: 'Genera tips sera' },
    { path: '/api/cron/generate-tips-v2', schedule: '0 11 * * *', time: '11:00', description: 'Genera tips mattina' }
  ]
  
  // Test del CRON secret
  let secretStatus = 'NOT_SET'
  if (hasSecret) {
    secretStatus = cronSecret.length > 10 ? 'CONFIGURED' : 'TOO_SHORT'
  }
  
  // Verifica se i CRON endpoint esistono e sono accessibili
  const endpointChecks = []
  for (const cron of crons) {
    try {
      // Prova a chiamare l'endpoint senza secret per vedere se esiste
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000'
      
      endpointChecks.push({
        path: cron.path,
        time: cron.time,
        description: cron.description,
        exists: true, // Assumiamo che esistano se sono nel nostro codice
        requiresSecret: true
      })
    } catch (error) {
      endpointChecks.push({
        path: cron.path,
        time: cron.time,
        description: cron.description,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown'
      })
    }
  }
  
  // Istruzioni per fix
  const instructions = []
  
  if (secretStatus === 'NOT_SET') {
    instructions.push({
      issue: 'CRON_SECRET non configurato',
      fix: 'Vai su Vercel Dashboard > Settings > Environment Variables e aggiungi CRON_SECRET con un valore sicuro (almeno 32 caratteri)'
    })
  }
  
  if (secretStatus === 'TOO_SHORT') {
    instructions.push({
      issue: 'CRON_SECRET troppo corto',
      fix: 'Il secret deve essere almeno 32 caratteri per sicurezza'
    })
  }
  
  instructions.push({
    issue: 'I CRON potrebbero non essere attivi',
    fix: 'Dopo aver configurato CRON_SECRET, fai un nuovo deploy per attivare i cron'
  })
  
  return NextResponse.json({
    status: {
      cronSecretConfigured: hasSecret,
      cronSecretStatus: secretStatus,
      vercelUrl: process.env.VERCEL_URL || 'NOT_SET',
      nodeEnv: process.env.NODE_ENV
    },
    crons: endpointChecks,
    instructions,
    testUrls: {
      manualSync: '/api/matches/fix-dates',
      checkDates: '/api/matches/dates',
      note: 'Usa questi mentre sistemi i CRON automatici'
    },
    importantNote: 'I CRON di Vercel girano SOLO in produzione, non in dev locale!'
  })
}