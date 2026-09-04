-- Migration: 20260910_team_invitations_and_custom_rbac.sql
-- Description: Adds invitation security tokens, expiration, and custom RBAC permissions to projects

-- 1. Add custom role_permissions JSON column to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS role_permissions JSONB DEFAULT NULL;

-- 2. Enhance team_invitations with token, expires_at, and invited_by
ALTER TABLE public.team_invitations
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Populate existing rows with a secure random token if empty
UPDATE public.team_invitations
SET token = encode(gen_random_bytes(24), 'hex')
WHERE token IS NULL;

-- 4. Index for fast invite token lookup
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);
