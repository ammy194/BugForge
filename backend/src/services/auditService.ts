import { DEMO_PERSONAS } from './userService';
import { logger } from '../utils/logger';

export type AuditActionType =
  | 'ISSUE_DELETE'
  | 'ROLE_CHANGE'
  | 'WEBHOOK_CREATE'
  | 'EXPORT_DATA'
  | 'AUTH_LOGIN'
  | 'TRANSITION_OVERRIDE'
  | 'SETTINGS_UPDATE';

export interface AuditLogItem {
  id: string;
  project_id?: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  action: AuditActionType;
  target_entity: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const auditLogsStore: AuditLogItem[] = [];

// Seed realistic enterprise audit events
function initSeedAuditLogs() {
  if (auditLogsStore.length > 0) return;

  const now = Date.now();

  auditLogsStore.push(
    {
      id: 'audit-1',
      project_id: 'ecom-proj-00000000-0000-0000-000000000001',
      actor_id: DEMO_PERSONAS.admin.id,
      actor_name: DEMO_PERSONAS.admin.full_name,
      actor_email: DEMO_PERSONAS.admin.email,
      action: 'ROLE_CHANGE',
      target_entity: 'User: Bob Chen (DEVELOPER → PROJECT_MANAGER)',
      details: { previous_role: 'DEVELOPER', new_role: 'PROJECT_MANAGER', project: 'E-Commerce Platform (ECOM)' },
      ip_address: '192.168.1.104',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      created_at: new Date(now - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'audit-2',
      project_id: 'ecom-proj-00000000-0000-0000-000000000001',
      actor_id: DEMO_PERSONAS.pm.id,
      actor_name: DEMO_PERSONAS.pm.full_name,
      actor_email: DEMO_PERSONAS.pm.email,
      action: 'EXPORT_DATA',
      target_entity: 'Project Dataset Export (ECOM CSV)',
      details: { format: 'CSV', row_count: 142, download_size: '64.2 KB' },
      ip_address: '10.0.4.18',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      created_at: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'audit-3',
      project_id: 'ecom-proj-00000000-0000-0000-000000000001',
      actor_id: DEMO_PERSONAS.admin.id,
      actor_name: DEMO_PERSONAS.admin.full_name,
      actor_email: DEMO_PERSONAS.admin.email,
      action: 'WEBHOOK_CREATE',
      target_entity: 'Webhook: https://api.datadog.com/v1/events',
      details: { events: ['issue.created', 'issue.resolved'], secret_configured: true },
      ip_address: '192.168.1.104',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      created_at: new Date(now - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'audit-4',
      actor_id: DEMO_PERSONAS.dev.id,
      actor_name: DEMO_PERSONAS.dev.full_name,
      actor_email: DEMO_PERSONAS.dev.email,
      action: 'AUTH_LOGIN',
      target_entity: 'Session: JWT Authentication (Bearer demo_dev)',
      details: { auth_provider: 'Supabase Auth / Demo Persona', mfa_verified: true },
      ip_address: '172.16.0.42',
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64)',
      created_at: new Date(now - 6 * 3600 * 1000).toISOString(),
    },
    {
      id: 'audit-5',
      project_id: 'ecom-proj-00000000-0000-0000-000000000001',
      actor_id: DEMO_PERSONAS.admin.id,
      actor_name: DEMO_PERSONAS.admin.full_name,
      actor_email: DEMO_PERSONAS.admin.email,
      action: 'SETTINGS_UPDATE',
      target_entity: 'Project RBAC Policy & Workflow Strict Transitions',
      details: { enforce_qa_verification: true, block_unresolved_merges: true },
      ip_address: '192.168.1.104',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      created_at: new Date(now - 14 * 3600 * 1000).toISOString(),
    }
  );
}

initSeedAuditLogs();

export class AuditService {
  /**
   * Log an immutable security audit event
   */
  static recordEvent(data: {
    project_id?: string;
    actor_id: string;
    actor_name: string;
    actor_email: string;
    action: AuditActionType;
    target_entity: string;
    details?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
  }): AuditLogItem {
    const log: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: data.project_id,
      actor_id: data.actor_id,
      actor_name: data.actor_name,
      actor_email: data.actor_email,
      action: data.action,
      target_entity: data.target_entity,
      details: data.details || {},
      ip_address: data.ip_address || '127.0.0.1',
      user_agent: data.user_agent || 'BugForge Internal Service',
      created_at: new Date().toISOString(),
    };

    auditLogsStore.unshift(log);
    logger.info(`🛡️ [AUDIT] ${data.action}: ${data.target_entity} by ${data.actor_email}`);
    return log;
  }

  /**
   * Query security audit logs with filtering and search
   */
  static listLogs(params: {
    action?: string;
    actor?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): { logs: AuditLogItem[]; total: number } {
    let filtered = [...auditLogsStore];

    if (params.action && params.action !== 'ALL') {
      filtered = filtered.filter((l) => l.action === params.action);
    }

    if (params.actor) {
      const q = params.actor.toLowerCase();
      filtered = filtered.filter(
        (l) => l.actor_name.toLowerCase().includes(q) || l.actor_email.toLowerCase().includes(q)
      );
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.target_entity.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.actor_name.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const offset = params.offset || 0;
    const limit = params.limit || 50;

    return {
      logs: filtered.slice(offset, offset + limit),
      total,
    };
  }

  /**
   * Export audit log trail to CSV format for SOC2 / ISO compliance
   */
  static exportAuditCSV(): string {
    const headers = ['ID', 'Timestamp', 'Actor Name', 'Actor Email', 'Action', 'Target Entity', 'IP Address', 'User Agent'];
    const rows = auditLogsStore.map((l) => [
      l.id,
      l.created_at,
      `"${l.actor_name}"`,
      `"${l.actor_email}"`,
      l.action,
      `"${l.target_entity.replace(/"/g, '""')}"`,
      l.ip_address,
      `"${l.user_agent.replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
