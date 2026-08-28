-- ==============================================================================
-- BugForge Database Migration 03: Issues, History, Labels, and Notifications
-- ==============================================================================

-- 1. Labels Table
CREATE TABLE IF NOT EXISTS public.labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_labels_project ON public.labels(project_id);

-- 2. Issues Table
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    key TEXT NOT NULL UNIQUE,
    issue_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    issue_type TEXT NOT NULL DEFAULT 'BUG' CHECK (issue_type IN ('BUG', 'FEATURE', 'TASK', 'IMPROVEMENT')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'TRIAGED', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'VERIFIED', 'CLOSED', 'REOPENED')),
    priority TEXT NOT NULL DEFAULT 'P2_MEDIUM' CHECK (priority IN ('P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW')),
    severity TEXT NOT NULL DEFAULT 'MAJOR' CHECK (severity IN ('BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL')),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    component_id UUID REFERENCES public.components(id) ON DELETE SET NULL,
    version_id UUID REFERENCES public.versions(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
    environment TEXT,
    repro_steps TEXT,
    expected_behavior TEXT,
    actual_behavior TEXT,
    resolution TEXT CHECK (resolution IS NULL OR resolution IN ('FIXED', 'WONT_FIX', 'DUPLICATE', 'INVALID', 'CANNOT_REPRODUCE')),
    duplicate_of_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_project ON public.issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_key ON public.issues(key);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_assignee ON public.issues(assignee_id);
CREATE INDEX IF NOT EXISTS idx_issues_reporter ON public.issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_created ON public.issues(created_at DESC);

-- 3. Issue Labels Mapping Table
CREATE TABLE IF NOT EXISTS public.issue_labels (
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
    PRIMARY KEY (issue_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_labels_issue ON public.issue_labels(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_labels_label ON public.issue_labels(label_id);

-- 4. Issue History (Immutable Audit Log)
CREATE TABLE IF NOT EXISTS public.issue_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_history_issue ON public.issue_history(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_history_created ON public.issue_history(created_at DESC);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('ASSIGNED', 'MENTIONED', 'STATUS_CHANGED', 'COMMENTED', 'RESOLVED', 'REOPENED', 'CI_FAILURE')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- 6. Enable RLS
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Issues: Project members can view
CREATE POLICY "View issues" ON public.issues FOR SELECT TO authenticated
    USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Create issues" ON public.issues FOR INSERT TO authenticated
    WITH CHECK (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Update issues" ON public.issues FOR UPDATE TO authenticated
    USING (public.is_project_member(project_id, auth.uid()));

-- History: Project members can view audit log
CREATE POLICY "View issue history" ON public.issue_history FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.issues i
        WHERE i.id = issue_id AND public.is_project_member(i.project_id, auth.uid())
    ));

-- Notifications: Users only see their own notifications
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
