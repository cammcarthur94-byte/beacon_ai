-- ============================================================================
-- BEACON: CONTENT STUDIO DRAFTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  gap_id TEXT,
  target_domain TEXT NOT NULL,
  target_topic TEXT NOT NULL,
  competitors JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_type TEXT NOT NULL,
  angle_title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "Users can view content drafts for owned projects"
  ON public.content_drafts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = content_drafts.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert content drafts for owned projects"
  ON public.content_drafts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = content_drafts.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update content drafts for owned projects"
  ON public.content_drafts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = content_drafts.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete content drafts for owned projects"
  ON public.content_drafts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = content_drafts.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_content_drafts_project_id ON public.content_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_target_domain ON public.content_drafts(project_id, target_domain);
CREATE INDEX IF NOT EXISTS idx_content_drafts_created_at ON public.content_drafts(project_id, created_at DESC);
