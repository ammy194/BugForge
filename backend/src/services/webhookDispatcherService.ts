import { Webhook, WebhookEventType } from '../types/integration';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

const webhooksStore = new Map<string, Webhook>();

// Initialize Seed Outbound Webhooks
function initSeedWebhooks() {
  if (webhooksStore.size > 0) return;

  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';
  const now = new Date().toISOString();

  webhooksStore.set('wh-1', {
    id: 'wh-1',
    project_id: ecomId,
    url: 'https://discord.com/api/webhooks/bugforge-alerts',
    secret: 'sec_ecom_discord_9281',
    events: ['issue.created', 'issue.resolved', 'ci.failed'],
    is_active: true,
    created_at: now,
    updated_at: now,
  });

  webhooksStore.set('wh-2', {
    id: 'wh-2',
    project_id: ecomId,
    url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXX',
    secret: 'sec_slack_channel_8192',
    events: ['issue.created', 'ci.failed'],
    is_active: true,
    created_at: now,
    updated_at: now,
  });
}

initSeedWebhooks();

export class WebhookDispatcherService {
  static async getWebhooks(projectId?: string): Promise<Webhook[]> {
    const list = Array.from(webhooksStore.values());
    if (projectId) return list.filter((w) => w.project_id === projectId);
    return list;
  }

  static async createWebhook(data: {
    project_id: string;
    url: string;
    secret?: string;
    events: WebhookEventType[];
    is_active?: boolean;
  }): Promise<Webhook> {
    const id = `wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const webhook: Webhook = {
      id,
      project_id: data.project_id,
      url: data.url,
      secret: data.secret,
      events: data.events,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: now,
      updated_at: now,
    };

    webhooksStore.set(id, webhook);
    logger.info(`📡 Created outbound webhook for ${data.url}`);

    return webhook;
  }

  static async deleteWebhook(webhookId: string): Promise<void> {
    const exists = webhooksStore.has(webhookId);
    if (!exists) throw AppError.notFound(`Webhook '${webhookId}' not found`);
    webhooksStore.delete(webhookId);
  }

  /**
   * Dispatch event to registered outbound webhooks
   */
  static async dispatchEvent(event: WebhookEventType, payload: any, projectId?: string) {
    const targets = Array.from(webhooksStore.values()).filter(
      (w) => w.is_active && w.events.includes(event) && (!projectId || w.project_id === projectId)
    );

    for (const webhook of targets) {
      logger.info(`🚀 [Webhook Dispatch] -> ${webhook.url} [Event: ${event}]`);
    }

    return { dispatched: targets.length, event };
  }
}
