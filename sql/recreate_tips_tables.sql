-- Ricreo le 5 tabelle separate per i tips come avevamo fatto

-- Tabella per SINGOLA
CREATE TABLE IF NOT EXISTS tips_singola (
  id SERIAL PRIMARY KEY,
  fixture_id INTEGER NOT NULL,
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  league VARCHAR(255) NOT NULL,
  match_time VARCHAR(10) NOT NULL,
  prediction VARCHAR(100) NOT NULL,
  prediction_label VARCHAR(255) NOT NULL,
  odds DECIMAL(10,2) NOT NULL CHECK (odds >= 1.70 AND odds <= 2.50),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  reasoning TEXT NOT NULL,
  valid_until DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(valid_until)
);

-- Tabella per DOPPIA  
CREATE TABLE IF NOT EXISTS tips_doppia (
  id SERIAL PRIMARY KEY,
  matches JSONB NOT NULL,
  total_odds DECIMAL(10,2) NOT NULL CHECK (total_odds >= 1.90 AND total_odds <= 3.50),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  strategy_reasoning TEXT NOT NULL,
  valid_until DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(valid_until)
);

-- Tabella per TRIPLA
CREATE TABLE IF NOT EXISTS tips_tripla (
  id SERIAL PRIMARY KEY,
  matches JSONB NOT NULL,
  total_odds DECIMAL(10,2) NOT NULL CHECK (total_odds >= 2.80 AND total_odds <= 5.00),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  strategy_reasoning TEXT NOT NULL,
  valid_until DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(valid_until)
);

-- Tabella per MISTA
CREATE TABLE IF NOT EXISTS tips_mista (
  id SERIAL PRIMARY KEY,
  matches JSONB NOT NULL,
  total_odds DECIMAL(10,2) NOT NULL CHECK (total_odds >= 10.00 AND total_odds <= 30.00),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  strategy_reasoning TEXT NOT NULL,
  valid_until DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(valid_until)
);

-- Tabella per BOMBA
CREATE TABLE IF NOT EXISTS tips_bomba (
  id SERIAL PRIMARY KEY,
  matches JSONB NOT NULL,
  tip_type VARCHAR(50) DEFAULT 'risultati_esatti',
  total_odds DECIMAL(10,2) NOT NULL CHECK (total_odds >= 30.00),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  strategy_reasoning TEXT NOT NULL,
  valid_until DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(valid_until)
);

-- Abilita RLS se necessario
ALTER TABLE tips_singola ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips_doppia ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips_tripla ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips_mista ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips_bomba ENABLE ROW LEVEL SECURITY;

-- Policy per permettere tutto (da configurare secondo le tue necessità)
CREATE POLICY "Enable all for tips_singola" ON tips_singola FOR ALL USING (true);
CREATE POLICY "Enable all for tips_doppia" ON tips_doppia FOR ALL USING (true);
CREATE POLICY "Enable all for tips_tripla" ON tips_tripla FOR ALL USING (true);
CREATE POLICY "Enable all for tips_mista" ON tips_mista FOR ALL USING (true);
CREATE POLICY "Enable all for tips_bomba" ON tips_bomba FOR ALL USING (true);