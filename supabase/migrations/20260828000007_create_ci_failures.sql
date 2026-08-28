-- ==============================================================================
-- BugForge Database Migration 07: CI Runs and CI Failures Entity
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ci_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'github_actions',
    build_id TEXT NOT NULL,
    build_url TEXT NOT NULL,
    branch TEXT NOT NULL,
    commit_sha TEXT NOT NULL,
    commit_author TEXT,
    status TEXT NOT NULL DEFAULT 'FAILED',
    environment TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ci_runs_project ON public.ci_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_ci_runs_commit ON public.ci_runs(commit_sha);

CREATE TABLE IF NOT EXISTS public.ci_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    ci_run_id UUID REFERENCES public.ci_runs(id) ON DELETE SET NULL,
    test_suite TEXT NOT NULL,
    test_name TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    expected_result TEXT,
    actual_result TEXT,
    branch TEXT NOT NULL,
    commit_sha TEXT NOT NULL,
    environment TEXT,
    status TEXT NOT NULL DEFAULT 'UNRESOLVED', -- 'UNRESOLVED', 'CONVERTED_TO_ISSUE', 'IGNORED'
    converted_issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ci_failures_project ON public.ci_failures(project_id);
CREATE INDEX IF NOT EXISTS idx_ci_failures_status ON public.ci_failures(status);

-- Enable RLS
ALTER TABLE public.ci_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ci_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view CI runs" ON public.ci_runs FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_id AND pm.user_id = auth.uid()
    ));

CREATE POLICY "Project members can view and manage CI failures" ON public.ci_failures FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_id AND pm.user_id = auth.uid()
    ));
