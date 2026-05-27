import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper to check if it's a valid URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Initialize only if credentials are valid
export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      // Mock client to prevent crashes
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        upsert: () => Promise.resolve({ error: null }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      }
    };

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
  console.warn('Supabase credentials missing or invalid. Falling back to local mode.');
}
