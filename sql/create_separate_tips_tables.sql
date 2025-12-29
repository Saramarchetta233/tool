-- SINGOLA: 1 partita con combo
CREATE TABLE IF NOT EXISTS tips_singola (
  id SERIAL PRIMARY KEY,
  fixture_id INTEGER NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  league TEXT NOT NULL,
  match_time TEXT NOT NULL,
  prediction TEXT NOT NULL, -- es: "1 + Over 1.5"
  prediction_label TEXT NOT NULL, -- es: "JUVE VINCE + ALMENO 2 GOL"
  odds DECIMAL(10,2) NOT NULL CHECK (odds >= 1.70 AND odds <= 2.50),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  reasoning TEXT NOT NULL,
  valid_until DATE NOT NULL,
  result VARCHAR(10) DEFAULT 'pending' CHECK (result IN ('pending', 'won', 'lost')),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(valid_until)
);

-- DOPPIA: 2 partite combinate
CREATE TABLE IF NOT EXISTS tips_doppia (
  id SERIAL PRIMARY KEY,
  matches JSONB NOT NULL, -- Array di 2 partite
  total_odds DECIMAL(10,2) NOT NULL CHECK (total_odds >= 1.90 AND total_odds <= 3.50),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  strategy_reasoning TEXT NOT NULL,
  valid_until DATE NOT NULL,
  result VARCHAR(10) DEFAULT 'pending' CHECK (result IN ('pending', 'won', 'lost')),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(valid_until)
);

-- TRIPLA: 3 partite combinate
CREATE TABLE IF NOT EXISTS tips_tripla (
  id SERIAL PRIMARY KEY,
  matches JSONB NOT NULL, -- Array di 3 partite
  total_odds DECIMAL(10,2) NOT NULL CHECK (total_odds >= 2.80 AND total_odds <= 5.00),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  strategy_reasoning TEXT NOT NULL,
  valid_until DATE NOT NULL,
  result VARCHAR(10) DEFAULT 'pending' CHECK (result IN ('pending', 'won', 'lost')),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(valid_until)
);

-- MISTA: 5-8 partite conservative
CREATE TABLE IF NOT EXISTS tips_mista (
  id SERIAL PRIMARY KEY,
  matches JSONB NOT NULL, -- Array di 5-8 partite
  total_odds DECIMAL(10,2) NOT NULL CHECK (total_odds >= 10.0 AND total_odds <= 30.0),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  strategy_reasoning TEXT NOT NULL,
  valid_until DATE NOT NULL,
  result VARCHAR(10) DEFAULT 'pending' CHECK (result IN ('pending', 'won', 'lost')),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(valid_until)
);

-- BOMBA: 3-5 partite ad alto rischio o risultati esatti
CREATE TABLE IF NOT EXISTS tips_bomba (
  id SERIAL PRIMARY KEY,
  matches JSONB NOT NULL, -- Array di 3-5 partite
  tip_type VARCHAR(20) NOT NULL CHECK (tip_type IN ('risultati_esatti', 'upset', 'combo')),
  total_odds DECIMAL(10,2) NOT NULL CHECK (total_odds >= 30.0),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  strategy_reasoning TEXT NOT NULL,
  valid_until DATE NOT NULL,
  result VARCHAR(10) DEFAULT 'pending' CHECK (result IN ('pending', 'won', 'lost')),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(valid_until)
);

-- INDICI per performance
CREATE INDEX idx_singola_date ON tips_singola(valid_until DESC);
CREATE INDEX idx_doppia_date ON tips_doppia(valid_until DESC);
CREATE INDEX idx_tripla_date ON tips_tripla(valid_until DESC);
CREATE INDEX idx_mista_date ON tips_mista(valid_until DESC);
CREATE INDEX idx_bomba_date ON tips_bomba(valid_until DESC);

-- FUNZIONE per pulire tips vecchi (opzionale)
CREATE OR REPLACE FUNCTION cleanup_old_tips()
RETURNS void AS $$
BEGIN
  DELETE FROM tips_singola WHERE valid_until < CURRENT_DATE - INTERVAL '30 days';
  DELETE FROM tips_doppia WHERE valid_until < CURRENT_DATE - INTERVAL '30 days';
  DELETE FROM tips_tripla WHERE valid_until < CURRENT_DATE - INTERVAL '30 days';
  DELETE FROM tips_mista WHERE valid_until < CURRENT_DATE - INTERVAL '30 days';
  DELETE FROM tips_bomba WHERE valid_until < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;