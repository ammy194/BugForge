import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
};

export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdminClient;
};

export const checkSupabaseConnection = async (): Promise<{
  connected: boolean;
  latencyMs?: number;
  message?: string;
}> => {
  const isPlaceholder =
    !env.SUPABASE_URL ||
    env.SUPABASE_URL.includes('placeholder') ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

  if (isPlaceholder) {
    return {
      connected: false,
      message: 'Supabase credentials are using placeholder values. Local dev fallback active.',
    };
  }

  const start = Date.now();
  try {
    const client = getSupabaseAdminClient();
    
    const queryPromise = client.from('profiles').select('count', { count: 'exact', head: true });
    const timeoutPromise = new Promise<{ error: any }>((_, reject) => {
      setTimeout(() => reject(new Error('Supabase connection timed out')), 3000);
    });
    
    const { error } = await Promise.race([queryPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;

    if (error && error.code !== 'PGRST116') {
      return {
        connected: false,
        latencyMs,
        message: error.message,
      };
    }

    return {
      connected: true,
      latencyMs,
      message: 'Successfully connected to Supabase PostgreSQL',
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      message: err?.message || 'Failed to connect to Supabase',
    };
  }
};
