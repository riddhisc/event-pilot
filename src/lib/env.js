export const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function assertBrowserEnv() {
  if (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('The service-role key must not be exposed with a VITE_ variable.');
  }
}
