-- Fix check constraints per i nuovi range specificati
-- Singola: 1.60-2.00
-- Doppia: 2.00-2.50  
-- Tripla: 3.00-3.50

-- Drop vecchi constraints
ALTER TABLE tips_singola DROP CONSTRAINT IF EXISTS tips_singola_odds_check;
ALTER TABLE tips_doppia DROP CONSTRAINT IF EXISTS tips_doppia_total_odds_check;
ALTER TABLE tips_tripla DROP CONSTRAINT IF EXISTS tips_tripla_total_odds_check;
ALTER TABLE tips_mista DROP CONSTRAINT IF EXISTS tips_mista_total_odds_check;

-- Aggiungi nuovi constraints con range corretti
ALTER TABLE tips_singola ADD CONSTRAINT tips_singola_odds_check 
  CHECK (odds >= 1.60 AND odds <= 2.00);

ALTER TABLE tips_doppia ADD CONSTRAINT tips_doppia_total_odds_check 
  CHECK (total_odds >= 2.00 AND total_odds <= 2.50);

ALTER TABLE tips_tripla ADD CONSTRAINT tips_tripla_total_odds_check 
  CHECK (total_odds >= 3.00 AND total_odds <= 3.50);

-- Mista più flessibile: 5.0-50.0 per permettere varie combinazioni
ALTER TABLE tips_mista ADD CONSTRAINT tips_mista_total_odds_check 
  CHECK (total_odds >= 5.0 AND total_odds <= 50.0);

-- Verifica che i constraints siano stati applicati
SELECT 
  table_name, 
  constraint_name, 
  check_clause 
FROM information_schema.check_constraints 
WHERE table_name LIKE 'tips_%' 
  AND constraint_name LIKE '%odds_check'
ORDER BY table_name;