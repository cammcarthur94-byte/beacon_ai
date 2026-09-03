-- ============================================================================
-- BEACON PHASE 8: CITATIONS & BACKLINK TRACKING TABLE
-- ============================================================================

create table if not exists public.citations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  run_id uuid references public.results(id) on delete set null,
  engine text,
  url text not null,
  domain text not null,
  source_type text not null check (source_type in ('news', 'forum', 'blog', 'documentation', 'social', 'other')),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.citations enable row level security;

-- Tenant Isolation: Allow authenticated project owners to read and insert citations
create policy "Users can view citations for owned projects"
  on public.citations
  for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = citations.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert citations for owned projects"
  on public.citations
  for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = citations.project_id
        and projects.user_id = auth.uid()
    )
  );

-- Indexes for lightning fast aggregations and ledger sorting
create index if not exists idx_citations_project_id on public.citations(project_id);
create index if not exists idx_citations_domain on public.citations(project_id, domain);
create index if not exists idx_citations_source_type on public.citations(project_id, source_type);
create index if not exists idx_citations_created_at on public.citations(project_id, created_at desc);
