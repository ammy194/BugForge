-- ==============================================================================
-- BugForge Database Migration 06: Webhooks and Developer Integrations
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret TEXT,
    events TEXT[] NOT NULL DEFAULT '{"issue.created", "issue.resolved", "ci.failed"}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_project ON public.webhooks(project_id);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Manage project webhooks" ON public.webhooks FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_id AND pm.user_id = auth.uid() AND pm.role IN ('ADMIN', 'PROJECT_MANAGER')
    ));

CREATE POLICY "View webhook deliveries" ON public.webhook_deliveries FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.webhooks w
        JOIN public.project_members pm ON pm.project_id = w.project_id
        WHERE w.id = webhook_id AND pm.user_id = auth.uid()
    ));
