-- Aggiungi unique constraint su user_analyses per prevenire doppio addebito
-- Questo impedisce che due richieste simultanee possano entrambe inserire

-- Prima rimuovi eventuali duplicati (mantieni il primo)
DELETE FROM user_analyses a
USING user_analyses b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.match_id = b.match_id;

-- Aggiungi il constraint
ALTER TABLE user_analyses
DROP CONSTRAINT IF EXISTS user_analyses_user_match_unique;

ALTER TABLE user_analyses
ADD CONSTRAINT user_analyses_user_match_unique
UNIQUE (user_id, match_id);
