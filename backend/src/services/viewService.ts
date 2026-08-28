import { SavedView, SavedViewFilters } from '../types/view';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

const viewsStore = new Map<string, SavedView>();

// Initialize Seed Saved Views
function initSeedSavedViews() {
  if (viewsStore.size > 0) return;

  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';
  const now = new Date().toISOString();

  const presets: SavedView[] = [
    {
      id: 'view-all-open',
      user_id: 'system',
      project_id: ecomId,
      name: 'All Open Defects',
      icon: 'bug',
      query_filters: { status: 'OPEN' },
      is_shared: true,
      is_system: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'view-critical-checkout',
      user_id: 'system',
      project_id: ecomId,
      name: 'Critical Checkout Bugs',
      icon: 'flame',
      query_filters: { component_id: 'c1', priority: 'P0_CRITICAL' },
      is_shared: true,
      is_system: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'view-in-progress',
      user_id: 'system',
      project_id: ecomId,
      name: 'In Progress & Triaged',
      icon: 'play',
      query_filters: { status: 'IN_PROGRESS' },
      is_shared: true,
      is_system: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'view-release-blockers',
      user_id: 'system',
      project_id: ecomId,
      name: 'Release Blockers (v2.4.0)',
      icon: 'alert-triangle',
      query_filters: { severity: 'BLOCKER', version_id: 'v1' },
      is_shared: true,
      is_system: true,
      created_at: now,
      updated_at: now,
    },
  ];

  presets.forEach((v) => viewsStore.set(v.id, v));
}

initSeedSavedViews();

export class ViewService {
  /**
   * Get all saved views accessible by user (system presets + shared + personal)
   */
  static async getSavedViews(userId: string, projectId?: string): Promise<SavedView[]> {
    return Array.from(viewsStore.values()).filter((v) => {
      if (projectId && v.project_id && v.project_id !== projectId) return false;
      return v.is_system || v.is_shared || v.user_id === userId;
    });
  }

  /**
   * Create a new custom saved view
   */
  static async createSavedView(
    data: {
      project_id?: string | null;
      name: string;
      icon?: string;
      query_filters: SavedViewFilters;
      is_shared?: boolean;
    },
    userId: string
  ): Promise<SavedView> {
    const id = `view-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const view: SavedView = {
      id,
      user_id: userId,
      project_id: data.project_id || null,
      name: data.name,
      icon: data.icon || 'filter',
      query_filters: data.query_filters,
      is_shared: Boolean(data.is_shared),
      created_at: now,
      updated_at: now,
    };

    viewsStore.set(id, view);
    logger.info(`💾 Saved view created: "${view.name}" by user ${userId}`);

    return view;
  }

  /**
   * Delete custom saved view
   */
  static async deleteSavedView(viewId: string, userId: string): Promise<void> {
    const view = viewsStore.get(viewId);
    if (!view) throw AppError.notFound(`Saved view '${viewId}' not found`);

    if (view.is_system) {
      throw AppError.badRequest('Cannot delete system preset views.');
    }

    if (view.user_id !== userId) {
      throw AppError.forbidden('You can only delete your own saved views.');
    }

    viewsStore.delete(viewId);
  }
}
