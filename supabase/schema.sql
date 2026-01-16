-- CalcioAI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  credits INTEGER DEFAULT 0,
  has_purchased BOOLEAN DEFAULT FALSE, -- Track if user has completed initial 49 EUR purchase
  preferred_leagues TEXT[] DEFAULT '{}',
  goal TEXT DEFAULT 'both' CHECK (goal IN ('betting', 'fantacalcio', 'both')),
  tipster_first_view BOOLEAN DEFAULT FALSE, -- Track if user has seen TipsterAI for free
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table for credit history
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spend', 'bonus', 'initial')),
  amount INTEGER NOT NULL, -- Positive for credits added, negative for credits spent
  description TEXT NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases table for payment tracking
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('initial', 'recharge_500', 'recharge_1500', 'recharge_3000')),
  amount_eur DECIMAL(10, 2) NOT NULL,
  credits_amount INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- User analysis history (to track which matches were analyzed)
CREATE TABLE IF NOT EXISTS public.user_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  match_id TEXT NOT NULL,
  match_label TEXT NOT NULL,
  analysis_type TEXT DEFAULT 'match' CHECK (analysis_type IN ('match', 'tipster')),
  credits_spent INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id, analysis_type)
);

-- TipsterAI regeneration tracking
CREATE TABLE IF NOT EXISTS public.tipster_regenerations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  regeneration_count INTEGER DEFAULT 0,
  last_regeneration_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipster_regenerations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (true);

-- Purchases policies
CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

-- User analyses policies
CREATE POLICY "Users can view own analyses" ON public.user_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.user_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tipster regenerations policies
CREATE POLICY "Users can view own regenerations" ON public.tipster_regenerations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own regenerations" ON public.tipster_regenerations
  FOR ALL USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    0 -- Credits will be added after payment
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to add credits to user
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_type TEXT DEFAULT 'purchase',
  p_stripe_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update user credits
  UPDATE public.profiles
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Insert transaction record
  INSERT INTO public.transactions (user_id, type, amount, description, stripe_session_id)
  VALUES (p_user_id, p_type, p_amount, p_description, p_stripe_session_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to spend credits
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = p_user_id;

  -- Check if user has enough credits
  IF current_credits < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Update user credits
  UPDATE public.profiles
  SET credits = credits - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Insert transaction record
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'spend', -p_amount, p_description);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has already viewed TipsterAI
CREATE OR REPLACE FUNCTION public.check_tipster_first_view(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_viewed BOOLEAN;
BEGIN
  SELECT tipster_first_view INTO has_viewed
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT has_viewed THEN
    UPDATE public.profiles
    SET tipster_first_view = TRUE
    WHERE id = p_user_id;
    RETURN TRUE; -- First view, free
  END IF;

  RETURN FALSE; -- Not first view, costs credits
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark user as having completed initial purchase
CREATE OR REPLACE FUNCTION public.mark_user_purchased(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles
  SET has_purchased = TRUE,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON public.purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON public.user_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_tipster_regenerations_user_date ON public.tipster_regenerations(user_id, date);
