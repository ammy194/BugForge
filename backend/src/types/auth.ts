export type GlobalRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'REPORTER';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  /**
   * Platform-wide privilege level. SECURITY-SENSITIVE: this must only ever be
   * populated from the verified Supabase JWT -> profiles row, or from the
   * hardcoded DEMO_PERSONAS map. It must never be derived from a client
   * request body (signup payload, /sync-profile body, etc).
   */
  global_role: GlobalRole;
  /**
   * Cosmetic "preferred role" selected at signup (e.g. "Developer",
   * "System Administrator"). Purely informational -- carries no privilege.
   * Real authorization always comes from global_role (platform) and
   * project_members.role (per-project).
   */
  primary_role?: GlobalRole;
  /**
   * True only for the four hardcoded demo personas. Always computed
   * server-side (never accepted from a client payload) so a normal user can
   * never flip themselves into "demo" status.
   */
  is_demo: boolean;
  created_at?: string;
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
