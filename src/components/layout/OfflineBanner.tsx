import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Show "back online" toast when reconnecting
  React.useEffect(() => {
    if (isOnline && wasOffline) {
      toast.success('You\'re back online!', {
        description: 'Your connection has been restored.',
      });
    }
  }, [isOnline, wasOffline]);

  if (isOnline) return null;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[100]',
        'bg-destructive text-destructive-foreground',
        'px-4 py-2 safe-top',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            You're offline. Some features may be unavailable.
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRetry}
          className="shrink-0"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  );
}