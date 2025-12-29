-- Create match_analyses table for caching AI-generated match analyses
CREATE TABLE IF NOT EXISTS match_analyses (
  id SERIAL PRIMARY KEY,
  fixture_id INTEGER UNIQUE NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  
  -- Foreign key constraint to matches table
  CONSTRAINT fk_match_analyses_fixture 
    FOREIGN KEY (fixture_id) 
    REFERENCES matches(fixture_id) 
    ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_analyses_fixture ON match_analyses(fixture_id);
CREATE INDEX IF NOT EXISTS idx_match_analyses_expires ON match_analyses(expires_at);
CREATE INDEX IF NOT EXISTS idx_match_analyses_created ON match_analyses(created_at DESC);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_match_analyses_updated_at 
    BEFORE UPDATE ON match_analyses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired analyses (run as cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_analyses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM match_analyses 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Add comment
COMMENT ON TABLE match_analyses IS 'Cache table for AI-generated match analyses. Expires when match starts or after 6 hours.';
COMMENT ON COLUMN match_analyses.analysis IS 'Complete AI analysis in JSON format including predictions, value bets, strategies, and narrative report.';
COMMENT ON COLUMN match_analyses.expires_at IS 'Analysis expires when match starts or 6 hours after creation, whichever comes first.';

-- Grant permissions (adjust based on your RLS policies)
-- This ensures the API can read/write to this table
GRANT ALL ON match_analyses TO service_role;
GRANT SELECT, INSERT, UPDATE ON match_analyses TO anon;
GRANT SELECT, INSERT, UPDATE ON match_analyses TO authenticated;