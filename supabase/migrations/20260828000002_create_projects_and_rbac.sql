-- ==============================================================================
-- BugForge Database Migration 02: Projects, Members, Components, Releases & RLS
-- ==============================================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(10) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    issue_counter INTEGER NOT NULL DEFAULT 0,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_key ON public.projects(key);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);

-- 2. Project Members Table (RBAC per project)
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'DEVELOPER' CHECK (role IN ('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);

-- 3. Components Table (e.g. Auth, Checkout, API, Frontend)
CREATE TABLE IF NOT EXISTS public.components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    default_assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_components_project ON public.components(project_id);

-- 4. Versions / Releases Table
CREATE TABLE IF NOT EXISTS public.versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'UNRELEASED' CHECK (status IN ('UNRELEASED', 'RELEASED', 'ARCHIVED')),
    release_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_versions_project ON public.versions(project_id);

-- 5. Milestones Table (e.g. Sprint 14, Q3 Launch)
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON public.milestones(project_id);

-- 6. Helper RLS Functions
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = p_project_id AND user_id = p_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id AND global_role = 'ADMIN'
    );
$$;

CREATE OR REPLACE FUNCTION public.get_project_role(p_project_id UUID, p_user_id UUID)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT CASE 
        WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND global_role = 'ADMIN') THEN 'ADMIN'
        ELSE (SELECT role FROM public.project_members WHERE project_id = p_project_id AND user_id = p_user_id LIMIT 1)
    END;
$$;

-- 7. Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- 8. Row Level Security Policies
-- Projects: Authenticated users can view projects they are members of (or if admin)
CREATE POLICY "View projects" ON public.projects FOR SELECT TO authenticated
    USING (public.is_project_member(id, auth.uid()));

CREATE POLICY "Create projects" ON public.projects FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Update projects" ON public.projects FOR UPDATE TO authenticated
    USING (public.get_project_role(id, auth.uid()) IN ('ADMIN', 'PROJECT_MANAGER'));

-- Project Members
CREATE POLICY "View project members" ON public.project_members FOR SELECT TO authenticated
    USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Manage project members" ON public.project_members FOR ALL TO authenticated
    USING (public.get_project_role(project_id, auth.uid()) IN ('ADMIN', 'PROJECT_MANAGER'));

-- Components, Versions, Milestones: Members can read, PM/Admin can manage
CREATE POLICY "View components" ON public.components FOR SELECT TO authenticated
    USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Manage components" ON public.components FOR ALL TO authenticated
    USING (public.get_project_role(project_id, auth.uid()) IN ('ADMIN', 'PROJECT_MANAGER'));

CREATE POLICY "View versions" ON public.versions FOR SELECT TO authenticated
    USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Manage versions" ON public.versions FOR ALL TO authenticated
    USING (public.get_project_role(project_id, auth.uid()) IN ('ADMIN', 'PROJECT_MANAGER'));

CREATE POLICY "View milestones" ON public.milestones FOR SELECT TO authenticated
    USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Manage milestones" ON public.milestones FOR ALL TO authenticated
    USING (public.get_project_role(project_id, auth.uid()) IN ('ADMIN', 'PROJECT_MANAGER'));
