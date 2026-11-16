import { createClient } from '@supabase/supabase-js';
import { assertBrowserEnv, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './env';

assertBrowserEnv();

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
