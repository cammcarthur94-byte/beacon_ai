-- BEACON GEO / AEO SAAS PLATFORM DATABASE SCHEMA
-- Compatible with PostgreSQL 15+ and Supabase

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE billing_tier_enum AS ENUM ('starter', 'pro', 'growth', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_frequency_enum AS ENUM ('daily', 'weekly', 'biweekly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sentiment_enum AS ENUM ('positive', 'neutral', 'negative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE chat_sender_enum AS ENUM ('user', 'agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. USERS (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PROJECTS (Tenancy & Brand Context)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    tier billing_tier_enum NOT NULL DEFAULT 'starter',
    audit_limit INT NOT NULL DEFAULT 20,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    -- Brand Kit JSONB structure:
    -- {
    --   "industry": "B2B SaaS / FinTech",
    --   "target_audience": "Series B+ CFOs and VP of Finance",
    --   "core_offerings": "Automated spend management and corporate cards",
    --   "competitors": [
    --     {"name": "Ramp", "domain": "ramp.com"},
    --     {"name": "Brex", "domain": "brex.com"}
    --   ],
    --   "tone_of_voice": "Authoritative, Direct, Institutional"
    -- }
    brand_kit JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PROMPTS (Scheduled Tracking Phrases)
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    frequency audit_frequency_enum NOT NULL DEFAULT 'daily',
    target_engines TEXT[] NOT NULL DEFAULT ARRAY['chatgpt', 'gemini', 'claude', 'perplexity'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. RESULTS (Parsed AI Engine Outputs)
CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    engine TEXT NOT NULL, -- 'chatgpt', 'gemini', 'claude', 'perplexity'
    visibility_score INT NOT NULL DEFAULT 0, -- 0 to 100
    brand_mentioned BOOLEAN NOT NULL DEFAULT false,
    sentiment sentiment_enum NOT NULL DEFAULT 'neutral',
    sentiment_score NUMERIC(4, 2) NOT NULL DEFAULT 0.00, -- -1.00 to 1.00
    raw_text TEXT NOT NULL,
    cited_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ranking_position INT, -- 1st, 2nd, 3rd brand mentioned if detectable
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. CHAT MESSAGES (Proactive AI Agent Conversations)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    sender chat_sender_enum NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. INDEXES FOR HIGH QUERY EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON public.prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_prompts_next_run ON public.prompts(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_results_prompt_id ON public.results(prompt_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON public.results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON public.chat_messages(project_id, created_at ASC);

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view and update own profile"
    ON public.users
    FOR ALL
    USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects"
    ON public.projects
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
    ON public.projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON public.projects
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON public.projects
    FOR DELETE
    USING (auth.uid() = user_id);

-- Prompts policies
CREATE POLICY "Users can view prompts belonging to their projects"
    ON public.prompts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = prompts.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert prompts for their projects"
    ON public.prompts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = prompts.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update prompts belonging to their projects"
    ON public.prompts
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = prompts.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete prompts belonging to their projects"
    ON public.prompts
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = prompts.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Results policies
CREATE POLICY "Users can view results for their prompts"
    ON public.results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts
            JOIN public.projects ON projects.id = prompts.project_id
            WHERE prompts.id = results.prompt_id
            AND projects.user_id = auth.uid()
        )
    );

-- Chat messages policies
CREATE POLICY "Users can view chat messages for their projects"
    ON public.chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = chat_messages.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert chat messages for their projects"
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = chat_messages.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- 10. AUTH TRIGGER (Auto sync auth.users to public.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
