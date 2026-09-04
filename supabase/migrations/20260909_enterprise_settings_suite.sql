-- Migration: 20260909_enterprise_settings_suite.sql
-- Description: Schema for enterprise settings suite:
--              workspace_settings (branding & localization),
--              team_members & team_invitations (RBAC),
--              api_keys & webhooks (developer platform).

-- 1. Workspace Settings (White-labeling & Localization)
CREATE TABLE IF NOT EXISTS public.workspace_settings (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  language TEXT NOT NULL DEFAULT 'en-US',
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  sso_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Team Members Table (RBAC)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  avatar_url TEXT,
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Team Invitations Table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Developer API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{"read:audits"}',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Webhook Endpoints Table
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  event_types TEXT[] NOT NULL DEFAULT '{"sov.drop_alert"}',
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_settings_project_id ON public.workspace_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_project_id ON public.team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_project_id ON public.team_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_api_keys_project_id ON public.api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_project_id ON public.webhooks(project_id);

-- 7. Row Level Security Policies

-- Workspace Settings Policies
CREATE POLICY "Users can view workspace settings for their projects"
  ON public.workspace_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = workspace_settings.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert/update workspace settings for their projects"
  ON public.workspace_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = workspace_settings.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Team Members Policies
CREATE POLICY "Users can view team members of their projects"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = team_members.project_id
      AND (
        projects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.project_id = team_members.project_id
          AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Owners and admins can manage team members"
  ON public.team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = team_members.project_id
      AND (
        projects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.project_id = team_members.project_id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Team Invitations Policies
CREATE POLICY "Users can view invitations for their projects"
  ON public.team_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = team_invitations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage invitations"
  ON public.team_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = team_invitations.project_id
      AND (
        projects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.project_id = team_invitations.project_id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'admin')
        )
      )
    )
  );

-- API Keys Policies
CREATE POLICY "Users can view api keys for their projects"
  ON public.api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = api_keys.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage api keys"
  ON public.api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = api_keys.project_id
      AND (
        projects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.project_id = api_keys.project_id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Webhooks Policies
CREATE POLICY "Users can view webhooks for their projects"
  ON public.webhooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = webhooks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage webhooks"
  ON public.webhooks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = webhooks.project_id
      AND (
        projects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.project_id = webhooks.project_id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'admin')
        )
      )
    )
  );

