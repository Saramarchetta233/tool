# 🚀 Setup Variabili su Vercel

## 1. Vai su Vercel Dashboard
- https://vercel.com/dashboard
- Seleziona il tuo progetto
- Settings → Environment Variables

## 2. Aggiungi queste variabili:

### API-Football (obbligatorio per matches)
```
API_FOOTBALL_KEY = [la tua chiave che inizia con c2f3...]
API_FOOTBALL_HOST = v3.football.api-sports.io
```

### OpenAI (obbligatorio per TipsterAI)
```
OPENAI_API_KEY = [la tua chiave che inizia con sk-proj-...]
```

### Cron Secret (scegli una password lunga)
```
CRON_SECRET = TipsterAI_2025_AutoCron_mK9pQ2nL8xR5vN3wE7tY1zF6bH4cA9sD
```

### Supabase (le hai già)
```
NEXT_PUBLIC_SUPABASE_URL = https://[tuo-progetto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...
```

## 3. IMPORTANTE
- Seleziona **Production** per ogni variabile
- NON mettere mai queste chiavi nel codice

## 4. Deploy
```bash
vercel --prod --force
```

## 5. Test
Dopo il deploy, testa manualmente:
```
https://tuo-dominio.vercel.app/api/cron/sync-matches?secret=TipsterAI_2025_AutoCron_mK9pQ2nL8xR5vN3wE7tY1zF6bH4cA9sD
```