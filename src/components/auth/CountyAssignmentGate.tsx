import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { KENYA_COUNTIES } from '@/constants/kenyaAdministrativeUnits';
import { toast } from 'sonner';

/**
 * Forces citizens to set their permanent home county before they can use the app.
 *
 * Government users are exempt — their jurisdiction is managed via
 * `government_profiles.assigned_counties` in GovernmentJurisdictionSettings
 * (multi-county jurisdiction, not a single home county).
 *
 * Contractors are also exempt — their county is optional.
 *
 * Backfills legacy citizen users who registered before the county-required rule.
 * Once set, the database trigger `enforce_county_lock_and_sync` locks the value
 * to the user's account.
 */
export const CountyAssignmentGate: React.FC = () => {
  const { user } = useAuth();
  const { userProfile, refreshProfiles } = useProfile();
  const [county, setCounty] = useState('');
  const [saving, setSaving] = useState(false);

  const needsCounty = useMemo(() => {
    if (!user || !userProfile) return false;
    // Citizens & government must set a home/jurisdiction county. Contractors optional.
    if (user.user_type !== 'citizen' && user.user_type !== 'government') return false;
    return !userProfile.county?.trim();
  }, [user, userProfile]);

  useEffect(() => {
    if (!needsCounty) setCounty('');
  }, [needsCounty]);

  if (!needsCounty) return null;

  const handleSave = async () => {
    if (!county) {
      toast.error('Please select your county');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ county })
        .eq('user_id', user!.id);

      if (error) throw error;

      toast.success('County set successfully.');
      await refreshProfiles();
    } catch (err: any) {
      console.error('CountyAssignmentGate save failed:', err);
      toast.error(err?.message || 'Failed to save county. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => { /* blocking */ }}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Set Your Home County
          </DialogTitle>
          <DialogDescription>
            Confirm the county where you live. You can only vote on issues in this county,
            though you may report problems from anywhere using GPS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Choose carefully.</strong> Your county determines which local
              issues you can validate and vote on.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label className="text-sm font-medium">County *</label>
            <Select value={county} onValueChange={setCounty} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Select your county" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {KENYA_COUNTIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={!county || saving} className="w-full">
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving permanently…</>
            ) : (
              'Confirm & Lock County'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CountyAssignmentGate;
