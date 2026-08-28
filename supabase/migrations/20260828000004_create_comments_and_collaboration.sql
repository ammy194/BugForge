-- ==============================================================================
-- BugForge Database Migration 04: Comments, Attachments, Git Links, and Watchers
-- ==============================================================================

-- 1. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_issue ON public.comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON public.comments(created_at ASC);

-- 2. Attachments Table
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    file_name TEXT NOT NULL,
    sanitized_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_issue ON public.attachments(issue_id);

-- 3. Issue Watchers Table
CREATE TABLE IF NOT EXISTS public.issue_watchers (
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (issue_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_watchers_user ON public.issue_watchers(user_id);

-- 4. Git Links Table (Commits, PRs, Branches, CI Runs)
CREATE TABLE IF NOT EXISTS public.git_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL CHECK (link_type IN ('COMMIT', 'PR', 'BRANCH', 'CI_RUN')),
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    author TEXT,
    status TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_git_links_issue ON public.git_links(issue_id);

-- 5. Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_links ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Comments
CREATE POLICY "View comments" ON public.comments FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.issues i
        WHERE i.id = issue_id AND public.is_project_member(i.project_id, auth.uid())
    ));

CREATE POLICY "Insert comments" ON public.comments FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Update own comments" ON public.comments FOR UPDATE TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Delete own comments" ON public.comments FOR DELETE TO authenticated
    USING (auth.uid() = author_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND global_role = 'ADMIN'
    ));

-- Attachments
CREATE POLICY "View attachments" ON public.attachments FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.issues i
        WHERE i.id = issue_id AND public.is_project_member(i.project_id, auth.uid())
    ));

CREATE POLICY "Insert attachments" ON public.attachments FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = uploader_id);

-- Watchers
CREATE POLICY "View watchers" ON public.issue_watchers FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.issues i
        WHERE i.id = issue_id AND public.is_project_member(i.project_id, auth.uid())
    ));

CREATE POLICY "Manage own watchers" ON public.issue_watchers FOR ALL TO authenticated
    USING (auth.uid() = user_id);

-- Git Links
CREATE POLICY "View git links" ON public.git_links FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.issues i
        WHERE i.id = issue_id AND public.is_project_member(i.project_id, auth.uid())
    ));

CREATE POLICY "Manage git links" ON public.git_links FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.issues i
        WHERE i.id = issue_id AND public.is_project_member(i.project_id, auth.uid())
    ));
