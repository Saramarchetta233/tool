-- Migration: Add has_purchased column to profiles table
-- Run this in Supabase SQL Editor if you already have the profiles table

-- Add has_purchased column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'has_purchased'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN has_purchased BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create or replace the mark_user_purchased function
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
