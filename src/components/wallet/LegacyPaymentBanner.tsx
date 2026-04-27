import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowRight } from 'lucide-react';

interface LegacyPaymentBannerProps {
  /** Short label describing what the legacy page used to do */
  feature: string;
  /** Plain-language explanation of where the work now happens */
  replacement: string;
  /** Optional: hide the CTA (e.g., on read-only audit pages) */
  showCta?: boolean;
}

/**
 * Phase 1.5 — Surfaces a clear deprecation notice on legacy escrow / payment
 * pages now that the in-house Coin Wallet is the system of record.
 *
 * Pages remain accessible for historical context but new actions should
 * happen in /wallet to avoid contradictory dual-source-of-truth bugs.
 */
const LegacyPaymentBanner: React.FC<LegacyPaymentBannerProps> = ({
  feature,
  replacement,
  showCta = true,
}) => {
  return (
    <Alert className="mb-6 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
      <Wallet className="h-4 w-4 text-amber-700 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-200">
        {feature} has moved to the Coin Wallet
      </AlertTitle>
      <AlertDescription className="mt-2 text-amber-800 dark:text-amber-300">
        <p className="mb-3">{replacement}</p>
        {showCta && (
          <Button asChild size="sm" variant="outline" className="border-amber-400">
            <Link to="/wallet">
              Open Wallet <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default LegacyPaymentBanner;
