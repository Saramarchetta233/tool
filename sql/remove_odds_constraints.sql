-- RIMUOVI TUTTI I CHECK CONSTRAINTS SULLE QUOTE
-- Questi vincoli impediscono il salvataggio delle tips

-- Drop tutti i constraints esistenti
ALTER TABLE tips_singola DROP CONSTRAINT IF EXISTS tips_singola_odds_check;
ALTER TABLE tips_doppia DROP CONSTRAINT IF EXISTS tips_doppia_total_odds_check;
ALTER TABLE tips_tripla DROP CONSTRAINT IF EXISTS tips_tripla_total_odds_check;
ALTER TABLE tips_mista DROP CONSTRAINT IF EXISTS tips_mista_total_odds_check;

-- Pulizia: rimuovi eventuali dati duplicati/corrotti
DELETE FROM tips_singola WHERE valid_until < CURRENT_DATE;
DELETE FROM tips_doppia WHERE valid_until < CURRENT_DATE;
DELETE FROM tips_tripla WHERE valid_until < CURRENT_DATE;
DELETE FROM tips_mista WHERE valid_until < CURRENT_DATE;
DELETE FROM tips_bomba WHERE valid_until < CURRENT_DATE;
DELETE FROM tips_serie_a WHERE valid_until < CURRENT_DATE;

-- Verifica che i constraints siano stati rimossi
SELECT
  table_name,
  constraint_name
FROM information_schema.table_constraints
WHERE table_name LIKE 'tips_%'
  AND constraint_type = 'CHECK'
ORDER BY table_name;
