import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ContractorInfo {
  company_name: string;
  verified: boolean;
}

/**
 * Fetches contractor company names + verification status for a list of user IDs.
 * Returns a lookup map keyed by contractor user_id. Re-runs only when the set of IDs changes.
 */
export const useContractorNames = (contractorIds: (string | null | undefined)[]) => {
  const [lookup, setLookup] = useState<Record<string, ContractorInfo>>({});
  const idsKey = Array.from(new Set(contractorIds.filter(Boolean) as string[])).sort().join(',');

  useEffect(() => {
    if (!idsKey) {
      setLookup({});
      return;
    }
    const ids = idsKey.split(',');
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('contractor_profiles')
        .select('user_id, company_name, verified')
        .in('user_id', ids);
      if (!active) return;
      const map: Record<string, ContractorInfo> = {};
      (data || []).forEach((c: any) => {
        map[c.user_id] = { company_name: c.company_name, verified: !!c.verified };
      });
      // Fallback to user_profiles.full_name for any missing
      const missing = ids.filter(id => !map[id]);
      if (missing.length) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, full_name')
          .in('user_id', missing);
        (profiles || []).forEach((p: any) => {
          map[p.user_id] = { company_name: p.full_name || 'Contractor', verified: false };
        });
      }
      if (active) setLookup(map);
    })();
    return () => { active = false; };
  }, [idsKey]);

  return lookup;
};
