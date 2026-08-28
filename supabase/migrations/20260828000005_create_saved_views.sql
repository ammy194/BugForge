-- ==============================================================================
-- BugForge Database Migration 05: Saved Views and Custom Query Filters
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.saved_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'filter',
    query_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_views_user ON public.saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_project ON public.saved_views(project_id);

-- Enable RLS
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "View own or shared saved views" ON public.saved_views FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_shared = TRUE);

CREATE POLICY "Create saved views" ON public.saved_views FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own saved views" ON public.saved_views FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Delete own saved views" ON public.saved_views FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
