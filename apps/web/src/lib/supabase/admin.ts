import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getOptionalAdminEnv } from '@/lib/config/env';
import type { Database } from '@/lib/supabase/database.types';

export function createAdminClient() {
  const env = getOptionalAdminEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for administrative Supabase operations.');
  }

  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
