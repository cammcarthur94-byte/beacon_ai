-- ============================================================================
-- BEACON GEO PLATFORM: ADVANCED SUITE MIGRATION (PHASE 1)
-- Personas, Multi-Turn Threads, Ground Truths, Hallucinations, Entity Graph, llms.txt
-- ============================================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE truth_category_enum AS ENUM ('pricing', 'features', 'integrations', 'compliance', 'specifications', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hallucination_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_status_enum AS ENUM ('unreviewed', 'acknowledged', 'resolved', 'false_positive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TABLE: PERSONAS (System Prompts & Simulated Evaluator Contexts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    age_demographics TEXT,
    background TEXT,
    goals TEXT,
    pain_points TEXT,
    information_sources TEXT,
    buying_objections TEXT,
    system_prompt TEXT NOT NULL,
    tone_traits TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.personas
    ADD COLUMN IF NOT EXISTS age_demographics TEXT,
    ADD COLUMN IF NOT EXISTS background TEXT,
    ADD COLUMN IF NOT EXISTS goals TEXT,
    ADD COLUMN IF NOT EXISTS pain_points TEXT,
    ADD COLUMN IF NOT EXISTS information_sources TEXT,
    ADD COLUMN IF NOT EXISTS buying_objections TEXT;

-- ============================================================================
-- 3. PROMPTS TABLE ENHANCEMENT: MULTI-TURN THREAD TRACKING
-- ============================================================================
ALTER TABLE public.prompts 
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS turn_index INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS thread_id UUID;

-- ============================================================================
-- 4. TABLE: BRAND TRUTHS (Ground Truth Knowledge Base for Hallucination Checking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.brand_truths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category truth_category_enum NOT NULL DEFAULT 'general',
    claim_topic TEXT NOT NULL, -- e.g. "Starting Pricing", "SOC-2 Type II Certification"
    ground_truth_statement TEXT NOT NULL, -- The verified factual description
    acceptable_variations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    contradiction_triggers TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- Common hallucinated claims
    verified_source_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 5. TABLE: HALLUCINATION ALERTS (Discrepancy Logging & Dashboard Alerts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hallucination_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    truth_id UUID REFERENCES public.brand_truths(id) ON DELETE SET NULL,
    result_id UUID REFERENCES public.results(id) ON DELETE CASCADE,
    engine TEXT NOT NULL,
    discrepancy_summary TEXT NOT NULL,
    hallucinated_statement TEXT NOT NULL,
    ground_truth_context TEXT NOT NULL,
    severity hallucination_severity_enum NOT NULL DEFAULT 'medium',
    status alert_status_enum NOT NULL DEFAULT 'unreviewed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 6. TABLE: ENTITY MENTIONS (Knowledge Graph & Semantic Adjective Mapping)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.entity_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
    result_id UUID REFERENCES public.results(id) ON DELETE CASCADE,
    engine TEXT NOT NULL,
    entity_name TEXT NOT NULL, -- e.g. "expensive", "innovative", "unreliable", "enterprise-grade"
    entity_type TEXT NOT NULL DEFAULT 'adjective', -- 'adjective', 'attribute', 'feature', 'sentiment_descriptor'
    sentiment sentiment_enum NOT NULL DEFAULT 'neutral',
    associated_target TEXT NOT NULL, -- Brand Name or Competitor Name
    is_brand BOOLEAN NOT NULL DEFAULT true,
    frequency INT NOT NULL DEFAULT 1,
    context_snippet TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 7. TABLE: LLMS.TXT CONFIGS (Agentic SEO Manager)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.llms_txt_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    curated_links JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_llms_txt TEXT NOT NULL DEFAULT '',
    raw_llms_full_txt TEXT NOT NULL DEFAULT '',
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 8. INDEXES FOR HIGH QUERY EFFICIENCY
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_personas_project_id ON public.personas(project_id);
CREATE INDEX IF NOT EXISTS idx_personas_system ON public.personas(is_system) WHERE is_system = true;

CREATE INDEX IF NOT EXISTS idx_prompts_parent_id ON public.prompts(parent_id);
CREATE INDEX IF NOT EXISTS idx_prompts_thread_id ON public.prompts(thread_id);
CREATE INDEX IF NOT EXISTS idx_prompts_persona_id ON public.prompts(persona_id);

CREATE INDEX IF NOT EXISTS idx_brand_truths_project_id ON public.brand_truths(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_truths_category ON public.brand_truths(category);

CREATE INDEX IF NOT EXISTS idx_hallucination_alerts_project_id ON public.hallucination_alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_hallucination_alerts_status ON public.hallucination_alerts(status);
CREATE INDEX IF NOT EXISTS idx_hallucination_alerts_severity ON public.hallucination_alerts(severity);

CREATE INDEX IF NOT EXISTS idx_entity_mentions_project_id ON public.entity_mentions(project_id);
CREATE INDEX IF NOT EXISTS idx_entity_mentions_lookup ON public.entity_mentions(project_id, associated_target, entity_name);
CREATE INDEX IF NOT EXISTS idx_entity_mentions_frequency ON public.entity_mentions(frequency DESC);

CREATE INDEX IF NOT EXISTS idx_llms_txt_configs_project_id ON public.llms_txt_configs(project_id);

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_truths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hallucination_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llms_txt_configs ENABLE ROW LEVEL SECURITY;

-- Policies for personas (System templates readable by all, custom personas scoped to tenant)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view system and project personas" ON public.personas;
    CREATE POLICY "Users can view system and project personas"
        ON public.personas FOR SELECT
        USING (
            is_system = true
            OR (
                project_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.projects
                    WHERE projects.id = personas.project_id
                      AND projects.user_id = auth.uid()
                )
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert personas for owned projects" ON public.personas;
    CREATE POLICY "Users can insert personas for owned projects"
        ON public.personas FOR INSERT
        WITH CHECK (
            is_system = false
            AND project_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = personas.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can update personas for owned projects" ON public.personas;
    CREATE POLICY "Users can update personas for owned projects"
        ON public.personas FOR UPDATE
        USING (
            is_system = false
            AND project_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = personas.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can delete personas for owned projects" ON public.personas;
    CREATE POLICY "Users can delete personas for owned projects"
        ON public.personas FOR DELETE
        USING (
            is_system = false
            AND project_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = personas.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

-- Policies for brand_truths
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view brand truths for owned projects" ON public.brand_truths;
    CREATE POLICY "Users can view brand truths for owned projects"
        ON public.brand_truths FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = brand_truths.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert brand truths for owned projects" ON public.brand_truths;
    CREATE POLICY "Users can insert brand truths for owned projects"
        ON public.brand_truths FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = brand_truths.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can update brand truths for owned projects" ON public.brand_truths;
    CREATE POLICY "Users can update brand truths for owned projects"
        ON public.brand_truths FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = brand_truths.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can delete brand truths for owned projects" ON public.brand_truths;
    CREATE POLICY "Users can delete brand truths for owned projects"
        ON public.brand_truths FOR DELETE
        USING (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = brand_truths.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

-- Policies for hallucination_alerts
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view hallucination alerts for owned projects" ON public.hallucination_alerts;
    CREATE POLICY "Users can view hallucination alerts for owned projects"
        ON public.hallucination_alerts FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = hallucination_alerts.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can update hallucination alerts for owned projects" ON public.hallucination_alerts;
    CREATE POLICY "Users can update hallucination alerts for owned projects"
        ON public.hallucination_alerts FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = hallucination_alerts.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

-- Policies for entity_mentions
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view entity mentions for owned projects" ON public.entity_mentions;
    CREATE POLICY "Users can view entity mentions for owned projects"
        ON public.entity_mentions FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = entity_mentions.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

-- Policies for llms_txt_configs
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view llms_txt configs for owned projects" ON public.llms_txt_configs;
    CREATE POLICY "Users can view llms_txt configs for owned projects"
        ON public.llms_txt_configs FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = llms_txt_configs.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert llms_txt configs for owned projects" ON public.llms_txt_configs;
    CREATE POLICY "Users can insert llms_txt configs for owned projects"
        ON public.llms_txt_configs FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = llms_txt_configs.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can update llms_txt configs for owned projects" ON public.llms_txt_configs;
    CREATE POLICY "Users can update llms_txt configs for owned projects"
        ON public.llms_txt_configs FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = llms_txt_configs.project_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

-- (No pre-seeded personas: users start with 0 default personas upon sign-up)
