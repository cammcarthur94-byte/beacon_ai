-- ============================================================================
-- BEACON PHASE 9: OUTREACH & PR CRM TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.outreach_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  publication_name TEXT NOT NULL,
  publication_domain TEXT NOT NULL,
  article_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_role TEXT,
  stage TEXT NOT NULL CHECK (stage IN ('generated', 'pitch_sent', 'review_scheduled', 'published_won')) DEFAULT 'generated',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  pitch_subject TEXT NOT NULL,
  pitch_body TEXT NOT NULL,
  editor_angle TEXT,
  suggested_hook TEXT,
  competitor_displaced TEXT,
  target_engine TEXT DEFAULT 'all',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outreach_pitches ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "Users can view outreach pitches for owned projects"
  ON public.outreach_pitches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = outreach_pitches.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert outreach pitches for owned projects"
  ON public.outreach_pitches
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = outreach_pitches.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update outreach pitches for owned projects"
  ON public.outreach_pitches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = outreach_pitches.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete outreach pitches for owned projects"
  ON public.outreach_pitches
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = outreach_pitches.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Indexes for lightning-fast pipeline lookups and filtering
CREATE INDEX IF NOT EXISTS idx_outreach_pitches_project_id ON public.outreach_pitches(project_id);
CREATE INDEX IF NOT EXISTS idx_outreach_pitches_stage ON public.outreach_pitches(project_id, stage);
CREATE INDEX IF NOT EXISTS idx_outreach_pitches_publication_domain ON public.outreach_pitches(project_id, publication_domain);
CREATE INDEX IF NOT EXISTS idx_outreach_pitches_created_at ON public.outreach_pitches(project_id, created_at DESC);
