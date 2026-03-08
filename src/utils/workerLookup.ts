/**
 * Centralized worker lookup utilities.
 * 
 * IMPORTANT: In our system, `user.id` from AuthContext is the auth UUID,
 * which maps to `citizen_workers.user_id`, NOT `citizen_workers.id`.
 * 
 * This module ensures all lookups use the correct column, preventing
 * the class of bugs where auth UUIDs are compared against table PKs.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Look up a citizen_workers record using the auth user ID.
 * Always use this instead of querying citizen_workers directly with an auth ID.
 */
export async function getWorkerByAuthId(authUserId: string) {
  const { data, error } = await supabase
    .from('citizen_workers')
    .select('*')
    .eq('user_id', authUserId)
    .single();

  if (error) {
    console.error('Worker lookup by auth ID failed:', error);
    return null;
  }
  return data;
}

/**
 * Look up a citizen_workers record using the table primary key (citizen_workers.id).
 * Only use this when you actually have a citizen_workers PK, not an auth user ID.
 */
export async function getWorkerByPrimaryKey(workerPk: string) {
  const { data, error } = await supabase
    .from('citizen_workers')
    .select('*')
    .eq('id', workerPk)
    .single();

  if (error) {
    console.error('Worker lookup by PK failed:', error);
    return null;
  }
  return data;
}
