import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Shield, Settings as SettingsIcon, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const PRIVACY_NOTICE_VERSION = '2026.04.1';
const STORAGE_KEY = `uhuru_safi_consent_${PRIVACY_NOTICE_VERSION}`;

interface ConsentChoices {
  essential: boolean; // always true
  analytics: boolean;
  notifications: boolean;
  research: boolean;
}

const DEFAULT_CHOICES: ConsentChoices = {
  essential: true,
  analytics: false,
  notifications: false,
  research: false,
};

/**
 * GDPR/Kenya DPA 2019 compliant consent banner.
 * - Granular, opt-in consent (no pre-checked boxes for optional)
 * - Versioned privacy notice tracking
 * - Records lawful basis per consent type
 * - Withdrawable at any time via /settings/privacy
 */
export const ConsentBanner: React.FC = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>(DEFAULT_CHOICES);

  useEffect(() => {
    const recorded = localStorage.getItem(STORAGE_KEY);
    if (!recorded) setVisible(true);
  }, []);

  const persistConsent = async (next: ConsentChoices) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...next, recorded_at: new Date().toISOString() })
    );

    // Persist to DB only when authenticated (RLS requires user_id = auth.uid())
    if (user?.id) {
      const records = (Object.entries(next) as [keyof ConsentChoices, boolean][]).map(
        ([type, granted]) => ({
          user_id: user.id,
          consent_type: type,
          granted,
          lawful_basis: type === 'essential' ? 'contract' : 'consent',
          privacy_notice_version: PRIVACY_NOTICE_VERSION,
          user_agent: navigator.userAgent.slice(0, 500),
        })
      );
      try {
        await supabase.from('consent_records').insert(records);
      } catch (err) {
        // Non-blocking — local consent is the source of truth for UX
        console.warn('Could not persist consent records:', err);
      }
    }
  };

  const acceptAll = async () => {
    const all: ConsentChoices = {
      essential: true,
      analytics: true,
      notifications: true,
      research: true,
    };
    setChoices(all);
    await persistConsent(all);
    setVisible(false);
    setShowCustomize(false);
  };

  const rejectOptional = async () => {
    await persistConsent(DEFAULT_CHOICES);
    setVisible(false);
    setShowCustomize(false);
  };

  const saveChoices = async () => {
    await persistConsent(choices);
    setVisible(false);
    setShowCustomize(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] p-3 sm:p-4 pointer-events-none"
        role="dialog"
        aria-label="Privacy consent"
      >
        <Card className="max-w-3xl mx-auto pointer-events-auto shadow-2xl border-primary/30 backdrop-blur-md bg-background/95">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="hidden sm:flex p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base mb-1">
                  Your privacy, your choice
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Uhuru Safi processes your data under the{' '}
                  <strong>Kenya Data Protection Act, 2019</strong>. Essential data is required
                  to operate the platform. Optional data uses (analytics, notifications,
                  research) require your consent and can be withdrawn anytime in{' '}
                  <Link to="/settings" className="underline text-primary">
                    Settings
                  </Link>
                  .
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={acceptAll} className="gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Accept all
                  </Button>
                  <Button size="sm" variant="outline" onClick={rejectOptional} className="gap-1">
                    <X className="h-3.5 w-3.5" />
                    Essential only
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCustomize(true)}
                    className="gap-1"
                  >
                    <SettingsIcon className="h-3.5 w-3.5" />
                    Customize
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/privacy" className="text-xs">
                      Privacy policy
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Customize your privacy choices
            </DialogTitle>
            <DialogDescription>
              Granular controls compliant with Kenya Data Protection Act, 2019.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <ConsentRow
              title="Essential (required)"
              description="Authentication, security, fraud prevention, and core service operation. Required to use the platform."
              basis="Lawful basis: Contract / Legal obligation"
              checked
              disabled
              onChange={() => {}}
            />
            <ConsentRow
              title="Platform analytics"
              description="Anonymized usage data to help us improve features and fix bugs."
              basis="Lawful basis: Consent"
              checked={choices.analytics}
              onChange={(v) => setChoices({ ...choices, analytics: v })}
            />
            <ConsentRow
              title="Notifications"
              description="Email/SMS updates about projects, payments, and reports in your area."
              basis="Lawful basis: Consent"
              checked={choices.notifications}
              onChange={(v) => setChoices({ ...choices, notifications: v })}
            />
            <ConsentRow
              title="Civic research"
              description="Anonymized, aggregated data shared with civil society for governance research."
              basis="Lawful basis: Consent"
              checked={choices.research}
              onChange={(v) => setChoices({ ...choices, research: v })}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={rejectOptional}>
              Reject all optional
            </Button>
            <Button onClick={saveChoices}>Save my choices</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ConsentRow: React.FC<{
  title: string;
  description: string;
  basis: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}> = ({ title, description, basis, checked, disabled, onChange }) => (
  <div className="flex items-start justify-between gap-3 p-3 rounded-md border">
    <div className="flex-1 min-w-0">
      <Label className="font-medium text-sm">{title}</Label>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wide">
        {basis}
      </p>
    </div>
    <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
  </div>
);

export default ConsentBanner;
