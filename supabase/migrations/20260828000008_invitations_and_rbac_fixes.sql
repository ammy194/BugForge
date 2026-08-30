-- ==============================================================================
-- BugForge Database Migration 08: Invitations and RBAC Isolation Fixes
-- ==============================================================================

-- 1. Project Invitations Table
CREATE TABLE IF NOT EXISTS public.project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'DEVELOPER' CHECK (role IN ('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_invitations_project ON public.project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON public.project_invitations(invitee_email);

ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Project invitations policies
-- A user can view an invitation if they are a member of the project OR if it is sent to their email
CREATE POLICY "View invitations" ON public.project_invitations FOR SELECT TO authenticated
    USING (
        public.is_project_member(project_id, auth.uid()) 
        OR 
        invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );

-- Only project managers and admins can create invitations
CREATE POLICY "Create invitations" ON public.project_invitations FOR INSERT TO authenticated
    WITH CHECK (public.get_project_role(project_id, auth.uid()) IN ('ADMIN', 'PROJECT_MANAGER'));

-- Anyone can update an invitation (to accept/decline) if it's sent to them, OR if they are a project admin/pm
CREATE POLICY "Update invitations" ON public.project_invitations FOR UPDATE TO authenticated
    USING (
        public.get_project_role(project_id, auth.uid()) IN ('ADMIN', 'PROJECT_MANAGER')
        OR 
        invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );

-- 2. RBAC Fixes for custom user isolation
-- Replace the old RLS helper functions to NOT use global_role bypass except for the exact Demo Admin UUID
-- Demo Admin UUID: '11111111-1111-4111-a111-111111111111'

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = p_project_id AND user_id = p_user_id
    ) OR (p_user_id = '11111111-1111-4111-a111-111111111111');
$$;

CREATE OR REPLACE FUNCTION public.get_project_role(p_project_id UUID, p_user_id UUID)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT CASE 
        WHEN p_user_id = '11111111-1111-4111-a111-111111111111' THEN 'ADMIN'
        ELSE (SELECT role FROM public.project_members WHERE project_id = p_project_id AND user_id = p_user_id LIMIT 1)
    END;
$$;
