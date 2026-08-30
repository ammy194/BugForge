-- ==============================================================================
-- BugForge Database Migration 08: Safe Signup Roles, Demo Flags & Invitations
-- ==============================================================================
-- This migration closes a privilege-escalation gap in the signup flow and adds
-- a persistent, database-backed project invitation system.
--
-- ROOT CAUSE FIXED:
--   public.handle_new_user() previously copied `raw_user_meta_data->>'global_role'`
--   directly onto profiles.global_role. Since global_role is also the value the
--   application's authorization layer treats as a *platform-wide* administrator
--   (see requireProjectRole / requireGlobalRole in the backend), any anonymous
--   signup that submitted `{ "global_role": "ADMIN" }` (e.g. by picking "System
--   Administrator" on the signup form) was granted unrestricted global admin
--   rights. This migration makes global_role always default to a safe value on
--   self-signup and introduces `primary_role`, a purely cosmetic column that
--   records the user's preferred/primary role without granting any privilege.
-- ==============================================================================

-- 1. Add a safe, cosmetic "primary/preferred role" column, separate from the
--    security-sensitive global_role column. Selecting a role at signup only
--    ever affects this column.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS primary_role TEXT NOT NULL DEFAULT 'DEVELOPER'
        CHECK (primary_role IN ('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER'));

COMMENT ON COLUMN public.profiles.primary_role IS
    'User-selected preferred role shown in their profile. Cosmetic only -- '
    'never grants privileges. Actual authorization is derived from global_role '
    '(platform-wide, service-role managed only) and project_members.role '
    '(per-project, managed by project PM/ADMIN).';

COMMENT ON COLUMN public.profiles.global_role IS
    'Platform-wide privilege level. Must NEVER be set from client-supplied '
    'signup/profile-sync payloads. Defaults to DEVELOPER for all self-registered '
    'accounts; only a service-role operation may elevate this value.';

-- 2. Re-create the new-user trigger so it can no longer be used to self-elevate.
--    global_role is always forced to the safe default 'DEVELOPER' regardless of
--    what the client placed in auth.users.raw_user_meta_data. primary_role is
--    still read from metadata (whitelisted against the enum via the CHECK
--    constraint above) purely for display purposes.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    requested_role TEXT;
BEGIN
    -- Whitelist the requested "primary role" -- fall back to DEVELOPER for
    -- anything unexpected instead of trusting the raw client value blindly.
    requested_role := NEW.raw_user_meta_data->>'primary_role';
    IF requested_role IS NULL THEN
        -- Backward compatible with the old metadata key so already-registered
        -- Supabase Auth users (created before this migration) still resolve
        -- to a sensible primary_role value on first profile sync.
        requested_role := NEW.raw_user_meta_data->>'global_role';
    END IF;
    IF requested_role NOT IN ('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER') THEN
        requested_role := 'DEVELOPER';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, avatar_url, global_role, primary_role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        'DEVELOPER', -- SECURITY: never trust client-supplied global_role
        requested_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Project Invitations table (Requirement 8/9/10/11/12)
CREATE TABLE IF NOT EXISTS public.project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'DEVELOPER'
        CHECK (role IN ('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER')),
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days')
);

CREATE INDEX IF NOT EXISTS idx_invitations_project ON public.project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee ON public.project_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.project_invitations(status);

-- Only one PENDING invitation may exist per (project, invitee) at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_unique_pending
    ON public.project_invitations(project_id, invitee_id)
    WHERE (status = 'PENDING');

ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Recipients can see invitations addressed to them.
CREATE POLICY "View own invitations" ON public.project_invitations FOR SELECT TO authenticated
    USING (invitee_id = auth.uid());

-- Project managers/admins of the target project can see invitations they sent
-- or that exist for their project.
CREATE POLICY "View project invitations" ON public.project_invitations FOR SELECT TO authenticated
    USING (public.get_project_role(project_id, auth.uid()) IN ('ADMIN', 'PROJECT_MANAGER'));

-- Only an authorized project member (PM/ADMIN) may create an invitation, and
-- only as themselves (inviter_id must match the authenticated user).
CREATE POLICY "Create project invitations" ON public.project_invitations FOR INSERT TO authenticated
    WITH CHECK (
        inviter_id = auth.uid()
        AND public.get_project_role(project_id, auth.uid()) IN ('ADMIN', 'PROJECT_MANAGER')
    );

-- Only the invitee may respond to (accept/decline) their own invitation.
CREATE POLICY "Respond to own invitation" ON public.project_invitations FOR UPDATE TO authenticated
    USING (invitee_id = auth.uid())
    WITH CHECK (invitee_id = auth.uid());

-- Inviters/PMs/Admins can revoke a pending invitation.
CREATE POLICY "Revoke project invitations" ON public.project_invitations FOR DELETE TO authenticated
    USING (public.get_project_role(project_id, auth.uid()) IN ('ADMIN', 'PROJECT_MANAGER'));
