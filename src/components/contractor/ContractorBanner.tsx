import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building, ShieldCheck } from 'lucide-react';

interface ContractorBannerProps {
  contractorId: string | null;
  compact?: boolean;
}

interface ContractorInfo {
  companyName: string;
  avatarUrl: string | null;
  verified: boolean;
  specialization: string[] | null;
}

const ContractorBanner: React.FC<ContractorBannerProps> = ({ contractorId, compact = false }) => {
  const [contractor, setContractor] = useState<ContractorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractorId) {
      setLoading(false);
      return;
    }

    const fetchContractor = async () => {
      try {
        // Fetch contractor profile and user profile in parallel
        const [profileRes, avatarRes] = await Promise.all([
          supabase
            .from('contractor_profiles')
            .select('company_name, verified, specialization')
            .eq('user_id', contractorId)
            .maybeSingle(),
          supabase
            .from('user_profiles')
            .select('avatar_url, full_name')
            .eq('user_id', contractorId)
            .maybeSingle()
        ]);

        if (profileRes.data) {
          setContractor({
            companyName: profileRes.data.company_name,
            avatarUrl: avatarRes.data?.avatar_url || null,
            verified: profileRes.data.verified || false,
            specialization: profileRes.data.specialization,
          });
        } else if (avatarRes.data) {
          // Fallback if no contractor_profiles entry yet
          setContractor({
            companyName: avatarRes.data.full_name || 'Contractor',
            avatarUrl: avatarRes.data.avatar_url || null,
            verified: false,
            specialization: null,
          });
        }
      } catch (err) {
        console.error('Error fetching contractor info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContractor();
  }, [contractorId]);

  if (!contractorId) {
    return (
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50 mb-3">
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          <Building className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">No Contractor Assigned</p>
          <p className="text-xs text-muted-foreground">Pending bid selection</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30 mb-3 animate-pulse">
        <div className="h-9 w-9 rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 bg-muted rounded" />
          <div className="h-2.5 w-20 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!contractor) return null;

  const initials = contractor.companyName
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-primary/5 border border-primary/10 mb-3">
      <Avatar className={compact ? 'h-8 w-8' : 'h-10 w-10'}>
        {contractor.avatarUrl ? (
          <AvatarImage src={contractor.avatarUrl} alt={contractor.companyName} />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-foreground truncate ${compact ? 'text-xs' : 'text-sm'}`}>
            {contractor.companyName}
          </p>
          {contractor.verified && (
            <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
          )}
        </div>
        {!compact && contractor.specialization && contractor.specialization.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            {contractor.specialization.slice(0, 2).join(' · ')}
          </p>
        )}
      </div>

      {contractor.verified && !compact && (
        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-xs flex-shrink-0">
          Verified
        </Badge>
      )}
    </div>
  );
};

export default ContractorBanner;
