-- ============================================================================
-- BEACON: PROMPT CATEGORIZATION MIGRATION
-- Adds search_intent and brand_association to public.prompts table
-- ============================================================================

alter table public.prompts
  add column if not exists search_intent text check (search_intent in ('informational', 'navigational', 'commercial', 'transactional')) default 'informational',
  add column if not exists brand_association text check (brand_association in ('branded', 'unbranded')) default 'unbranded';

-- Add index for intent and association filtering
create index if not exists idx_prompts_intent on public.prompts(search_intent);
create index if not exists idx_prompts_brand_association on public.prompts(brand_association);
