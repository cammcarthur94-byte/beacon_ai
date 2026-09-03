-- BEACON GEO MIGRATION: Google AI Mode & AI Overviews Tier-2 Expansion
-- Adds 'pro' value to billing_tier_enum if it doesn't already exist

DO $$
BEGIN
    ALTER TYPE billing_tier_enum ADD VALUE IF NOT EXISTS 'pro' BEFORE 'enterprise';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON COLUMN public.prompts.target_engines IS 'Array of target engines: chatgpt, gemini, claude, perplexity, google_ai_overview, google_ai_mode';
