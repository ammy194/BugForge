import { getSupabaseAdminClient } from './supabase';
import { AuthenticatedUser, GlobalRole } from '../types/auth';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Pre-seeded demo personas for instant demo/judging evaluation
export const DEMO_PERSONAS: Record<string, AuthenticatedUser> = {
  admin: {
    id: '11111111-1111-4111-a111-111111111111',
    email: 'admin@bugforge.dev',
    full_name: 'Alex Martin (Admin)',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    global_role: 'ADMIN',
    created_at: new Date('2026-01-01').toISOString(),
  },
  pm: {
    id: '22222222-2222-4222-a222-222222222222',
    email: 'pm@bugforge.dev',
    full_name: 'Sarah Connor (Project Manager)',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    global_role: 'PROJECT_MANAGER',
    created_at: new Date('2026-01-02').toISOString(),
  },
  dev: {
    id: '33333333-3333-4333-a333-333333333333',
    email: 'bob.dev@bugforge.dev',
    full_name: 'Bob Chen (Senior Developer)',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    global_role: 'DEVELOPER',
    created_at: new Date('2026-01-03').toISOString(),
  },
  reporter: {
    id: '44444444-4444-4444-a444-444444444444',
    email: 'qa.reporter@bugforge.dev',
    full_name: 'Elena Rostova (QA Reporter)',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    global_role: 'REPORTER',
    created_at: new Date('2026-01-04').toISOString(),
  },
};

// In-memory profiles store for dev/testing resilience
const inMemoryProfiles = new Map<string, AuthenticatedUser>();
Object.values(DEMO_PERSONAS).forEach((u) => inMemoryProfiles.set(u.id, u));

export class UserService {
  /**
   * Sync or upsert a user profile in Supabase and local cache
   */
  static async syncProfile(data: {
    id?: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    global_role?: GlobalRole;
  }): Promise<AuthenticatedUser> {
    const id = data.id || Object.values(DEMO_PERSONAS).find(p => p.email === data.email)?.id || `user-${Date.now()}`;
    const profile: AuthenticatedUser = {
      id,
      email: data.email,
      full_name: data.full_name,
      avatar_url: data.avatar_url || undefined,
      global_role: data.global_role || 'DEVELOPER',
      created_at: new Date().toISOString(),
    };

    // Store in local memory cache
    inMemoryProfiles.set(id, profile);

    // If connected to Supabase, upsert into `profiles` table
    const isPlaceholder = !env.SUPABASE_URL || env.SUPABASE_URL.includes('placeholder');
    if (!isPlaceholder) {
      try {
        const client = getSupabaseAdminClient();
        await client.from('profiles').upsert({
          id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          global_role: profile.global_role,
          updated_at: new Date().toISOString(),
        });
      } catch (err: any) {
        logger.warn('Failed to upsert profile in Supabase DB, kept in-memory fallback:', err?.message);
      }
    }

    return profile;
  }

  /**
   * Fetch profile by user ID
   */
  static async getProfileById(userId: string): Promise<AuthenticatedUser | null> {
    // Check in-memory store first
    if (inMemoryProfiles.has(userId)) {
      return inMemoryProfiles.get(userId)!;
    }

    const isPlaceholder = !env.SUPABASE_URL || env.SUPABASE_URL.includes('placeholder');
    if (!isPlaceholder) {
      try {
        const client = getSupabaseAdminClient();
        const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
        if (data && !error) {
          const profile: AuthenticatedUser = {
            id: data.id,
            email: data.email,
            full_name: data.full_name,
            avatar_url: data.avatar_url,
            global_role: data.global_role as GlobalRole,
            created_at: data.created_at,
          };
          inMemoryProfiles.set(userId, profile);
          return profile;
        }
      } catch (err: any) {
        logger.warn('Error querying profile from Supabase:', err?.message);
      }
    }

    return null;
  }

  /**
   * Update profile fields
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Pick<AuthenticatedUser, 'full_name' | 'avatar_url' | 'global_role'>>
  ): Promise<AuthenticatedUser | null> {
    const existing = await this.getProfileById(userId);
    if (!existing) return null;

    const updated: AuthenticatedUser = {
      ...existing,
      ...updates,
    };

    inMemoryProfiles.set(userId, updated);

    const isPlaceholder = !env.SUPABASE_URL || env.SUPABASE_URL.includes('placeholder');
    if (!isPlaceholder) {
      try {
        const client = getSupabaseAdminClient();
        await client.from('profiles').update({
          full_name: updated.full_name,
          avatar_url: updated.avatar_url,
          global_role: updated.global_role,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      } catch (err: any) {
        logger.warn('Failed to update profile in Supabase DB:', err?.message);
      }
    }

    return updated;
  }

  /**
   * List all users for mentions, assignment, and team management
   */
  static async listUsers(search?: string): Promise<AuthenticatedUser[]> {
    let users = Array.from(inMemoryProfiles.values());

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    return users;
  }
}
