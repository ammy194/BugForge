import { getSupabaseAdminClient } from './supabase';
import { AuthenticatedUser, GlobalRole } from '../types/auth';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Pre-seeded demo personas for instant demo/judging evaluation. These are
// intentionally NOT backed by real Supabase Auth / profiles rows -- they
// authenticate via the `demo_*` bearer-token shortcut in authMiddleware and
// live entirely in server memory. `is_demo: true` is hardcoded here and is
// never derived from anything a client sends.
export const DEMO_PERSONAS: Record<string, AuthenticatedUser> = {
  admin: {
    id: '11111111-1111-4111-a111-111111111111',
    email: 'admin@bugforge.dev',
    full_name: 'Alex Martin (Admin)',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    global_role: 'ADMIN',
    primary_role: 'ADMIN',
    is_demo: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  pm: {
    id: '22222222-2222-4222-a222-222222222222',
    email: 'pm@bugforge.dev',
    full_name: 'Sarah Connor (Project Manager)',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    global_role: 'PROJECT_MANAGER',
    primary_role: 'PROJECT_MANAGER',
    is_demo: true,
    created_at: new Date('2026-01-02').toISOString(),
  },
  dev: {
    id: '33333333-3333-4333-a333-333333333333',
    email: 'bob.dev@bugforge.dev',
    full_name: 'Bob Chen (Senior Developer)',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    global_role: 'DEVELOPER',
    primary_role: 'DEVELOPER',
    is_demo: true,
    created_at: new Date('2026-01-03').toISOString(),
  },
  reporter: {
    id: '44444444-4444-4444-a444-444444444444',
    email: 'qa.reporter@bugforge.dev',
    full_name: 'Elena Rostova (QA Reporter)',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    global_role: 'REPORTER',
    primary_role: 'REPORTER',
    is_demo: true,
    created_at: new Date('2026-01-04').toISOString(),
  },
};

const isDemoPersonaId = (id: string) => Object.values(DEMO_PERSONAS).some((p) => p.id === id);

const isSupabasePlaceholder = () =>
  !env.SUPABASE_URL ||
  env.SUPABASE_URL.includes('placeholder') ||
  !env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

// Pure offline/local-dev fallback store, used ONLY when Supabase credentials
// are not configured at all. When Supabase *is* configured, the `profiles`
// table is always the source of truth for real (non-demo) users -- this is
// what makes registration/login persist across refreshes, logout/login, and
// server restarts (Requirement 1 & 18).
const offlineProfiles = new Map<string, AuthenticatedUser>();

const rowToProfile = (row: any): AuthenticatedUser => ({
  id: row.id,
  email: row.email,
  full_name: row.full_name,
  avatar_url: row.avatar_url || undefined,
  global_role: row.global_role as GlobalRole,
  primary_role: (row.primary_role as GlobalRole) || 'DEVELOPER',
  is_demo: false,
  created_at: row.created_at,
});

export class UserService {
  /**
   * Create or update a user's profile.
   *
   * SECURITY: `id` must always be the caller's own verified identity (from
   * the Supabase JWT). `global_role` must always be a server-derived value
   * (never taken from an arbitrary request body) -- callers that need to
   * preserve an existing profile's global_role should pass it explicitly
   * from a value they already trust (e.g. the previously loaded profile),
   * never from raw client input.
   */
  static async syncProfile(data: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    global_role?: GlobalRole;
    primary_role?: GlobalRole;
  }): Promise<AuthenticatedUser> {
    // Demo personas are never written through this path.
    if (isDemoPersonaId(data.id)) {
      return DEMO_PERSONAS[Object.keys(DEMO_PERSONAS).find((k) => DEMO_PERSONAS[k].id === data.id)!];
    }

    const profile: AuthenticatedUser = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      avatar_url: data.avatar_url || undefined,
      global_role: data.global_role || 'DEVELOPER',
      primary_role: data.primary_role || data.global_role || 'DEVELOPER',
      is_demo: false,
      created_at: new Date().toISOString(),
    };

    if (isSupabasePlaceholder()) {
      offlineProfiles.set(data.id, profile);
      return profile;
    }

    try {
      const client = getSupabaseAdminClient();
      const { data: row, error } = await client
        .from('profiles')
        .upsert(
          {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            global_role: profile.global_role,
            primary_role: profile.primary_role,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();

      if (error || !row) {
        logger.warn('Failed to upsert profile in Supabase, using in-memory fallback:', error?.message);
        offlineProfiles.set(data.id, profile);
        return profile;
      }

      return rowToProfile(row);
    } catch (err: any) {
      logger.warn('Error syncing profile to Supabase, using in-memory fallback:', err?.message);
      offlineProfiles.set(data.id, profile);
      return profile;
    }
  }

  static async getProfileById(userId: string): Promise<AuthenticatedUser | null> {
    if (isDemoPersonaId(userId)) {
      return Object.values(DEMO_PERSONAS).find((p) => p.id === userId) || null;
    }

    if (isSupabasePlaceholder()) {
      return offlineProfiles.get(userId) || null;
    }

    try {
      const client = getSupabaseAdminClient();
      const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
      if (data && !error) {
        return rowToProfile(data);
      }
    } catch (err: any) {
      logger.warn('Error querying profile from Supabase:', err?.message);
    }

    // Fall back to any cached offline copy (covers a Supabase hiccup for a
    // profile that was created while credentials were briefly unavailable).
    return offlineProfiles.get(userId) || null;
  }

  /**
   * Look up a profile by email. Used to resolve project-invitation
   * recipients (Requirement 9). Never exposes more than what's needed by
   * the invitation flow.
   */
  static async getProfileByEmail(email: string): Promise<AuthenticatedUser | null> {
    const normalized = email.trim().toLowerCase();
    const demoMatch = Object.values(DEMO_PERSONAS).find((p) => p.email.toLowerCase() === normalized);
    if (demoMatch) return demoMatch;

    if (isSupabasePlaceholder()) {
      return (
        Array.from(offlineProfiles.values()).find((p) => p.email.toLowerCase() === normalized) || null
      );
    }

    try {
      const client = getSupabaseAdminClient();
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .ilike('email', normalized)
        .maybeSingle();
      if (data && !error) {
        return rowToProfile(data);
      }
    } catch (err: any) {
      logger.warn('Error querying profile by email from Supabase:', err?.message);
    }

    return null;
  }

  /**
   * Update the caller's own editable profile fields. `global_role` is
   * intentionally not updatable through this method -- there is no
   * self-service path to change platform-wide privilege.
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Pick<AuthenticatedUser, 'full_name' | 'avatar_url' | 'primary_role'>>
  ): Promise<AuthenticatedUser | null> {
    if (isDemoPersonaId(userId)) {
      // Demo personas are fixed for the duration of the process; profile
      // edits don't apply to them.
      return this.getProfileById(userId);
    }

    const existing = await this.getProfileById(userId);
    if (!existing) return null;

    const updated: AuthenticatedUser = {
      ...existing,
      ...updates,
    };

    if (isSupabasePlaceholder()) {
      offlineProfiles.set(userId, updated);
      return updated;
    }

    try {
      const client = getSupabaseAdminClient();
      const { data, error } = await client
        .from('profiles')
        .update({
          full_name: updated.full_name,
          avatar_url: updated.avatar_url,
          primary_role: updated.primary_role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('*')
        .single();

      if (error || !data) {
        logger.warn('Failed to update profile in Supabase DB:', error?.message);
        offlineProfiles.set(userId, updated);
        return updated;
      }

      return rowToProfile(data);
    } catch (err: any) {
      logger.warn('Failed to update profile in Supabase DB:', err?.message);
      offlineProfiles.set(userId, updated);
      return updated;
    }
  }

  /**
   * List users for mentions, assignment, and team management. Demo personas
   * are always included so the demo experience keeps working; real users
   * come from Supabase when configured.
   */
  static async listUsers(search?: string): Promise<AuthenticatedUser[]> {
    let users: AuthenticatedUser[] = [...Object.values(DEMO_PERSONAS)];

    if (isSupabasePlaceholder()) {
      users = users.concat(Array.from(offlineProfiles.values()));
    } else {
      try {
        const client = getSupabaseAdminClient();
        let query = client.from('profiles').select('*').order('created_at', { ascending: false }).limit(200);
        if (search) {
          query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }
        const { data, error } = await query;
        if (!error && data) {
          users = users.concat(data.map(rowToProfile));
        }
      } catch (err: any) {
        logger.warn('Error listing profiles from Supabase:', err?.message);
      }
    }

    if (search && isSupabasePlaceholder()) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    } else if (search) {
      // Demo personas still need to be filtered client-side even when the DB
      // query above already filtered the Supabase-backed rows.
      const q = search.toLowerCase();
      users = [
        ...Object.values(DEMO_PERSONAS).filter(
          (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        ),
        ...users.filter((u) => !u.is_demo),
      ];
    }

    return users;
  }
}
