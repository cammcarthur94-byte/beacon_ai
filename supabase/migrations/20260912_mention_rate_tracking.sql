-- ============================================================================
-- BEACON: MENTION RATE TRACKING SYSTEM MIGRATION (PHASE 1)
-- ============================================================================

-- 1. TABLE: TARGET PROMPTS
CREATE TABLE IF NOT EXISTS public.target_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    target_brand_name TEXT NOT NULL,
    target_domain TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TABLE: MENTION LOGS
CREATE TABLE IF NOT EXISTS public.mention_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES public.target_prompts(id) ON DELETE CASCADE,
    engine TEXT NOT NULL, -- e.g. 'chatgpt', 'perplexity', 'claude', 'gemini'
    brand_mentioned BOOLEAN NOT NULL DEFAULT false,
    raw_response TEXT NOT NULL DEFAULT '',
    run_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. HIGH-EFFICIENCY INDEXES
CREATE INDEX IF NOT EXISTS idx_target_prompts_tenant_id ON public.target_prompts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_target_prompts_active ON public.target_prompts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mention_logs_prompt_id ON public.mention_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_mention_logs_engine ON public.mention_logs(engine);
CREATE INDEX IF NOT EXISTS idx_mention_logs_run_date ON public.mention_logs(run_date DESC);
CREATE INDEX IF NOT EXISTS idx_mention_logs_lookup ON public.mention_logs(prompt_id, engine, run_date, brand_mentioned);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.target_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mention_logs ENABLE ROW LEVEL SECURITY;

-- Policies for target_prompts
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view target prompts for owned projects" ON public.target_prompts;
    CREATE POLICY "Users can view target prompts for owned projects"
        ON public.target_prompts FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = target_prompts.tenant_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert target prompts for owned projects" ON public.target_prompts;
    CREATE POLICY "Users can insert target prompts for owned projects"
        ON public.target_prompts FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = target_prompts.tenant_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can update target prompts for owned projects" ON public.target_prompts;
    CREATE POLICY "Users can update target prompts for owned projects"
        ON public.target_prompts FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = target_prompts.tenant_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can delete target prompts for owned projects" ON public.target_prompts;
    CREATE POLICY "Users can delete target prompts for owned projects"
        ON public.target_prompts FOR DELETE
        USING (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = target_prompts.tenant_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

-- Policies for mention_logs
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view mention logs for owned prompts" ON public.mention_logs;
    CREATE POLICY "Users can view mention logs for owned prompts"
        ON public.mention_logs FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.target_prompts
                JOIN public.projects ON projects.id = target_prompts.tenant_id
                WHERE target_prompts.id = mention_logs.prompt_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert mention logs for owned prompts" ON public.mention_logs;
    CREATE POLICY "Users can insert mention logs for owned prompts"
        ON public.mention_logs FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.target_prompts
                JOIN public.projects ON projects.id = target_prompts.tenant_id
                WHERE target_prompts.id = mention_logs.prompt_id
                  AND projects.user_id = auth.uid()
            )
        );
END $$;

-- 5. RPC FUNCTION: get_mention_rate
CREATE OR REPLACE FUNCTION public.get_mention_rate(
    p_tenant_id UUID,
    p_engine TEXT DEFAULT NULL,
    p_days_back INT DEFAULT NULL
)
RETURNS NUMERIC(5, 2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_runs INT;
    v_true_mentions INT;
    v_rate NUMERIC(5, 2);
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE ml.brand_mentioned = true)
    INTO
        v_total_runs,
        v_true_mentions
    FROM public.mention_logs ml
    JOIN public.target_prompts tp ON ml.prompt_id = tp.id
    WHERE tp.tenant_id = p_tenant_id
      AND (p_engine IS NULL OR p_engine = '' OR LOWER(p_engine) = 'all' OR LOWER(ml.engine) = LOWER(p_engine))
      AND (p_days_back IS NULL OR p_days_back <= 0 OR ml.run_date >= (timezone('utc'::text, now()) - (p_days_back || ' days')::INTERVAL));

    IF v_total_runs = 0 THEN
        RETURN 0.00;
    END IF;

    v_rate := ROUND(((v_true_mentions::NUMERIC / v_total_runs::NUMERIC) * 100.0), 2);
    RETURN v_rate;
END;
$$;

-- Grant execution to authenticated & service_role
GRANT EXECUTE ON FUNCTION public.get_mention_rate(UUID, TEXT, INT) TO authenticated, service_role, anon;

-- 6. SAMPLE SEED DATA (Safe conditional seed for immediate testing)
DO $$
DECLARE
    v_sample_project_id UUID;
    v_sample_prompt_id UUID;
BEGIN
    -- Check if any project exists
    SELECT id INTO v_sample_project_id FROM public.projects LIMIT 1;
    
    IF v_sample_project_id IS NOT NULL THEN
        -- Insert a sample target prompt if none exists for this project
        IF NOT EXISTS (SELECT 1 FROM public.target_prompts WHERE tenant_id = v_sample_project_id) THEN
            INSERT INTO public.target_prompts (
                tenant_id,
                query_text,
                target_brand_name,
                target_domain
            ) VALUES (
                v_sample_project_id,
                'what are the best high performance leggings and activewear brands',
                'Alo Yoga',
                'aloyoga.com'
            ) RETURNING id INTO v_sample_prompt_id;

            -- Insert sample logs across engines
            INSERT INTO public.mention_logs (prompt_id, engine, brand_mentioned, raw_response, run_date) VALUES
                (v_sample_prompt_id, 'chatgpt', true, 'Alo Yoga is one of the top recommended brands for studio yoga and activewear.', now() - INTERVAL '1 day'),
                (v_sample_prompt_id, 'chatgpt', true, 'For dynamic yoga, Alo Yoga and Lululemon offer high-performance leggings.', now() - INTERVAL '2 days'),
                (v_sample_prompt_id, 'perplexity', true, 'According to consumer tests, Alo Yoga leads in fabric softness and mobility.', now() - INTERVAL '1 day'),
                (v_sample_prompt_id, 'perplexity', false, 'The top activewear brands cited are Lululemon and Athleta.', now() - INTERVAL '3 days'),
                (v_sample_prompt_id, 'claude', false, 'When considering activewear, Vuori and Gymshark are popular options.', now() - INTERVAL '1 day'),
                (v_sample_prompt_id, 'claude', true, 'Alo Yoga features mindful design and durable compression fabrics.', now() - INTERVAL '4 days');
        END IF;
    END IF;
END $$;
