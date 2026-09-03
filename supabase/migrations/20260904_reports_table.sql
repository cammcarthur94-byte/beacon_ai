-- Migration: Create reports table for Phase 4 Comprehensive Executive AI Audit Reports

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    date_range TEXT NOT NULL CHECK (date_range IN ('7d', '30d', 'all')),
    report_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast workspace query and chronological ordering
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON public.reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Project isolation RLS policy: Users can only view reports for projects they own
CREATE POLICY "Users can view reports of own projects"
    ON public.reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.reports.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

-- Users can insert reports for projects they own
CREATE POLICY "Users can insert reports for own projects"
    ON public.reports
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.reports.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

-- Users can delete reports for projects they own
CREATE POLICY "Users can delete reports of own projects"
    ON public.reports
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.reports.project_id
            AND public.projects.user_id = auth.uid()
        )
    );
