-- Fix UNIQUE constraint su tabella tips per permettere 5 tipologie al giorno
-- Problema: constraint UNIQUE(tip_type, valid_until) impedisce di salvare più tipologie per lo stesso giorno

-- Controlla se la tabella tips esiste
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tips') THEN
    -- Crea la tabella tips se non esiste
    CREATE TABLE public.tips (
      id BIGSERIAL PRIMARY KEY,
      tip_type VARCHAR(20) NOT NULL CHECK (tip_type IN ('singola', 'doppia', 'tripla', 'mista', 'bomba')),
      matches JSONB NOT NULL,
      odds DECIMAL(8,2) NOT NULL,
      confidence VARCHAR(10) CHECK (confidence IN ('BASSA', 'MEDIA', 'ALTA')),
      reasoning TEXT,
      valid_until DATE NOT NULL,
      result VARCHAR(10) DEFAULT 'pending' CHECK (result IN ('pending', 'won', 'lost')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Crea indici per performance
    CREATE INDEX idx_tips_valid_until ON public.tips(valid_until);
    CREATE INDEX idx_tips_type ON public.tips(tip_type);
    CREATE INDEX idx_tips_result ON public.tips(result);
    
    RAISE NOTICE 'Tabella tips creata con successo';
  ELSE
    RAISE NOTICE 'Tabella tips già esistente';
  END IF;
END $$;

-- Rimuovi il constraint UNIQUE(tip_type, valid_until) se esiste
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Cerca il nome del constraint unique
  SELECT conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'tips' 
  AND c.contype = 'u'
  AND array_to_string(array(
    SELECT a.attname
    FROM pg_attribute a
    WHERE a.attrelid = c.conrelid
    AND a.attnum = ANY(c.conkey)
    ORDER BY a.attnum
  ), ',') LIKE '%tip_type%valid_until%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.tips DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Constraint UNIQUE rimosso: %', constraint_name;
  ELSE
    RAISE NOTICE 'Nessun constraint UNIQUE trovato per tip_type,valid_until';
  END IF;
END $$;

-- Ora la tabella può salvare 5 tipologie diverse per lo stesso giorno
-- singola, doppia, tripla, mista, bomba per valid_until='2024-12-27'

-- Aggiungi trigger per updated_at se non esiste
CREATE OR REPLACE FUNCTION update_tips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tips_updated_at ON public.tips;
CREATE TRIGGER update_tips_updated_at 
  BEFORE UPDATE ON public.tips 
  FOR EACH ROW EXECUTE FUNCTION update_tips_updated_at();

-- Verifica finale
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'tips' AND schemaname = 'public';