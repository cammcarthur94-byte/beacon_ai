-- ============================================================================
-- BEACON PLAN ARCHITECTURE: Basic / Starter / Pro (NO free tier)
-- ============================================================================
-- Implements strict hard-cap enforcement for the new 3-tier pricing:
--
--   Basic   ($49/mo)  : 1 brand,  1 seat,   100 prompts,   3,000 answers/mo
--   Starter ($149/mo) : 5 brands, 3 seats,  450 prompts,  13,500 answers/mo
--   Pro     ($349/mo) : unlimited brands/seats, 1,050 prompts, 31,500 answers/mo
--
-- Enforcement is layered:
--   1. plan_usage_counters  -> monthly metered usage per project
--   2. BEFORE INSERT triggers on prompts / results
--      -> physically block rows that would exceed the plan's quota
--      (a Basic user literally cannot persist a 101st prompt or a 3,001st
--       analyzed answer; the API middleware returns a 402-style verdict)
--   3. Project creation / team invite checks mirror the brand & seat caps
-- ============================================================================

-- 1. EXTEND THE BILLING TIER ENUM --------------------------------------------
ALTER TYPE billing_tier_enum ADD VALUE IF NOT EXISTS 'basic';

-- 2. PLAN LIMITS REFERENCE TABLE ---------------------------------------------
-- Values match src/lib/billing/plan-limits.ts (single source of truth).
CREATE TABLE IF NOT EXISTS public.plan_limits (
    plan_id                 TEXT PRIMARY KEY CHECK (plan_id IN ('basic', 'starter', 'pro')),
    max_brands              INT,           -- NULL = unlimited
    max_seats               INT,           -- NULL = unlimited
    max_custom_prompts      INT NOT NULL,
    max_answers_analyzed    INT NOT NULL
);

INSERT INTO public.plan_limits (plan_id, max_brands, max_seats, max_custom_prompts, max_answers_analyzed)
VALUES
    ('basic',   1,    1, 100,  3000),
    ('starter', 5,    3, 450, 13500),
    ('pro',     NULL, NULL, 1050, 31500)
ON CONFLICT (plan_id) DO UPDATE
SET max_brands           = EXCLUDED.max_brands,
    max_seats            = EXCLUDED.max_seats,
    max_custom_prompts   = EXCLUDED.max_custom_prompts,
    max_answers_analyzed = EXCLUDED.max_answers_analyzed;

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_limits readable by authenticated users"
    ON public.plan_limits
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. MONTHLY USAGE COUNTERS ----------------------------------------------------
-- One row per project per billing period. period_start is the first day of
-- the UTC month; counters reset naturally when a new period row is created.
CREATE TABLE IF NOT EXISTS public.plan_usage_counters (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    period_start  DATE NOT NULL DEFAULT date_trunc('month', now())::date,
    prompts_used  INT  NOT NULL DEFAULT 0,
    answers_used  INT  NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (project_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_plan_usage_counters_project
    ON public.plan_usage_counters(project_id, period_start DESC);

ALTER TABLE public.plan_usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view usage for own projects"
    ON public.plan_usage_counters
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = plan_usage_counters.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Service role manages writes (server middleware + triggers).

-- 4. PROMPT QUOTA TRIGGER (strict hard cap) -----------------------------------
CREATE OR REPLACE FUNCTION public.enforce_prompt_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_id   TEXT;
    v_limit     INT;
    v_used      INT;
BEGIN
    -- Tier -> plan mapping (legacy aliases map to nearest new plan)
    SELECT CASE p.tier
               WHEN 'basic'     THEN 'basic'
               WHEN 'starter'   THEN 'starter'
               WHEN 'growth'    THEN 'starter'
               WHEN 'pro'       THEN 'pro'
               WHEN 'enterprise' THEN 'pro'
               ELSE 'starter'
           END
    INTO v_plan_id
    FROM public.projects p
    WHERE p.id = NEW.project_id;

    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'Project % not found for prompt quota check', NEW.project_id;
    END IF;

    SELECT l.max_custom_prompts INTO v_limit
    FROM public.plan_limits l WHERE l.plan_id = v_plan_id;

    SELECT COALESCE(SUM(c.prompts_used), 0) INTO v_used
    FROM public.plan_usage_counters c
    WHERE c.project_id = NEW.project_id
      AND c.period_start = date_trunc('month', now())::date;

    IF v_used >= v_limit THEN
        RAISE EXCEPTION 'PLAN_QUOTA_EXCEEDED: Monthly custom-prompt limit reached (%/%) on the % plan. Upgrade to track more prompts.',
            v_used, v_limit, v_plan_id
        USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prompt_quota ON public.prompts;
CREATE TRIGGER trg_prompt_quota
    BEFORE INSERT ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_prompt_quota();

-- 5. ANSWER-ANALYSIS QUOTA TRIGGER (strict hard cap) ---------------------------
-- Every parsed AI engine output ("answers analyzed") increments the meter and
-- is physically rejected once the plan cap is reached.
CREATE OR REPLACE FUNCTION public.enforce_answer_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_project_id UUID;
    v_plan_id    TEXT;
    v_limit      INT;
    v_used       INT;
BEGIN
    SELECT prompt.project_id INTO v_project_id
    FROM public.prompts prompt
    WHERE prompt.id = NEW.prompt_id;

    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Prompt % not found for answer quota check', NEW.prompt_id;
    END IF;

    SELECT CASE p.tier
               WHEN 'basic'     THEN 'basic'
               WHEN 'starter'   THEN 'starter'
               WHEN 'growth'    THEN 'starter'
               WHEN 'pro'       THEN 'pro'
               WHEN 'enterprise' THEN 'pro'
               ELSE 'starter'
           END
    INTO v_plan_id
    FROM public.projects p
    WHERE p.id = v_project_id;

    SELECT l.max_answers_analyzed INTO v_limit
    FROM public.plan_limits l WHERE l.plan_id = v_plan_id;

    SELECT COALESCE(SUM(c.answers_used), 0) INTO v_used
    FROM public.plan_usage_counters c
    WHERE c.project_id = v_project_id
      AND c.period_start = date_trunc('month', now())::date;

    IF v_used >= v_limit THEN
        RAISE EXCEPTION 'PLAN_QUOTA_EXCEEDED: Monthly answer-analysis limit reached (%/%) on the % plan. Upgrade to analyze more answers.',
            v_used, v_limit, v_plan_id
        USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_answer_quota ON public.results;
CREATE TRIGGER trg_answer_quota
    BEFORE INSERT ON public.results
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_answer_quota();

-- 6. USAGE COUNTER MAINTENANCE TRIGGERS -----------------------------------------
-- Keep plan_usage_counters in sync with actual rows so the quota checks and
-- the API middleware always agree.

CREATE OR REPLACE FUNCTION public.increment_prompt_usage()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.plan_usage_counters (project_id, period_start, prompts_used, answers_used)
    VALUES (NEW.project_id, date_trunc('month', now())::date, 1, 0)
    ON CONFLICT (project_id, period_start)
    DO UPDATE SET
        prompts_used = plan_usage_counters.prompts_used + 1,
        updated_at   = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_increment_prompt_usage ON public.prompts;
CREATE TRIGGER trg_increment_prompt_usage
    AFTER INSERT ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_prompt_usage();

CREATE OR REPLACE FUNCTION public.increment_answer_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_project_id UUID;
BEGIN
    SELECT prompt.project_id INTO v_project_id
    FROM public.prompts prompt
    WHERE prompt.id = NEW.prompt_id;

    INSERT INTO public.plan_usage_counters (project_id, period_start, prompts_used, answers_used)
    VALUES (v_project_id, date_trunc('month', now())::date, 0, 1)
    ON CONFLICT (project_id, period_start)
    DO UPDATE SET
        answers_used = plan_usage_counters.answers_used + 1,
        updated_at   = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_increment_answer_usage ON public.results;
CREATE TRIGGER trg_increment_answer_usage
    AFTER INSERT ON public.results
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_answer_usage();

-- Deleting rows refunds quota so users can manage their allocation.
CREATE OR REPLACE FUNCTION public.decrement_prompt_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.plan_usage_counters
    SET prompts_used = GREATEST(0, prompts_used - 1),
        updated_at   = timezone('utc'::text, now())
    WHERE project_id = OLD.project_id
      AND period_start = date_trunc('month', OLD.created_at)::date;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_decrement_prompt_usage ON public.prompts;
CREATE TRIGGER trg_decrement_prompt_usage
    AFTER DELETE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_prompt_usage();

CREATE OR REPLACE FUNCTION public.decrement_answer_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_project_id UUID;
    v_created_at TIMESTAMPTZ;
BEGIN
    SELECT prompt.project_id, prompt.created_at INTO v_project_id, v_created_at
    FROM public.prompts prompt
    WHERE prompt.id = OLD.prompt_id;

    UPDATE public.plan_usage_counters
    SET answers_used = GREATEST(0, answers_used - 1),
        updated_at   = timezone('utc'::text, now())
    WHERE project_id = v_project_id
      AND period_start = date_trunc('month', v_created_at)::date;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_decrement_answer_usage ON public.results;
CREATE TRIGGER trg_decrement_answer_usage
    AFTER DELETE ON public.results
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_answer_usage();

-- 7. BRAND LIMIT ENFORCEMENT (project creation) ---------------------------------
CREATE OR REPLACE FUNCTION public.enforce_brand_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_id  TEXT;
    v_limit    INT;
    v_used     INT;
BEGIN
    SELECT CASE NEW.tier
               WHEN 'basic'     THEN 'basic'
               WHEN 'starter'   THEN 'starter'
               WHEN 'growth'    THEN 'starter'
               WHEN 'pro'       THEN 'pro'
               WHEN 'enterprise' THEN 'pro'
               ELSE 'starter'
           END
    INTO v_plan_id;

    SELECT l.max_brands INTO v_limit
    FROM public.plan_limits l WHERE l.plan_id = v_plan_id;

    IF v_limit IS NULL THEN
        RETURN NEW; -- unlimited
    END IF;

    SELECT COUNT(*) INTO v_used
    FROM public.projects p
    WHERE p.user_id = NEW.user_id;

    IF v_used >= v_limit THEN
        RAISE EXCEPTION 'PLAN_QUOTA_EXCEEDED: Your % plan includes % brand(s). Upgrade to add more brands.',
            v_plan_id, v_limit
        USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_brand_quota ON public.projects;
CREATE TRIGGER trg_brand_quota
    BEFORE INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_brand_quota();

-- 8. SEAT LIMIT ENFORCEMENT (team invitations) -----------------------------------
CREATE OR REPLACE FUNCTION public.enforce_seat_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_id  TEXT;
    v_limit    INT;
    v_used     INT;
BEGIN
    SELECT CASE p.tier
               WHEN 'basic'     THEN 'basic'
               WHEN 'starter'   THEN 'starter'
               WHEN 'growth'    THEN 'starter'
               WHEN 'pro'       THEN 'pro'
               WHEN 'enterprise' THEN 'pro'
               ELSE 'starter'
           END
    INTO v_plan_id
    FROM public.projects p
    WHERE p.id = NEW.project_id;

    SELECT l.max_seats INTO v_limit
    FROM public.plan_limits l WHERE l.plan_id = v_plan_id;

    IF v_limit IS NULL THEN
        RETURN NEW; -- unlimited
    END IF;

    SELECT COUNT(*) INTO v_used
    FROM public.team_members tm
    WHERE tm.project_id = NEW.project_id;

    IF v_used >= v_limit THEN
        RAISE EXCEPTION 'PLAN_QUOTA_EXCEEDED: Your % plan includes % user seat(s). Upgrade to invite more teammates.',
            v_plan_id, v_limit
        USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_seat_quota ON public.team_members;
CREATE TRIGGER trg_seat_quota
    BEFORE INSERT ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_seat_quota();

-- 9. BACKFILL: initialize counters for existing projects -------------------------
INSERT INTO public.plan_usage_counters (project_id, period_start, prompts_used, answers_used)
SELECT p.id,
       date_trunc('month', now())::date,
       (SELECT COUNT(*) FROM public.prompts pr
         WHERE pr.project_id = p.id
           AND date_trunc('month', pr.created_at)::date = date_trunc('month', now())::date),
       (SELECT COUNT(*) FROM public.results r
          JOIN public.prompts pr ON pr.id = r.prompt_id
         WHERE pr.project_id = p.id
           AND date_trunc('month', r.created_at)::date = date_trunc('month', now())::date)
FROM public.projects p
ON CONFLICT (project_id, period_start) DO NOTHING;
