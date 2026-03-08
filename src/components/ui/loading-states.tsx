import React from 'react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', text, className = "" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  );
};

export const FullPageLoader = ({ message }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-10 w-10 text-primary animate-spin" />
  </div>
);

export const InlineLoader = ({ message }: { message?: string }) => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 text-primary animate-spin" />
  </div>
);

export const ButtonLoader = ({ loading, children, ...props }: any) => (
  <Button disabled={loading} {...props}>
    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {children}
  </Button>
);

interface ConnectionStatusProps {
  isOnline: boolean;
  onRetry?: () => void;
}

export const ConnectionStatus = ({ isOnline, onRetry }: ConnectionStatusProps) => {
  if (isOnline) return null;

  return (
    <Alert className="border-destructive/50 bg-destructive/10">
      <WifiOff className="h-4 w-4 text-destructive" />
      <AlertDescription className="flex items-center justify-between">
        <span>You're currently offline. Some features may not be available.</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <Wifi className="h-4 w-4 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export const DataLoadingCard = ({ title, isLoading }: { title: string; isLoading: boolean }) => (
  <div className="bg-card rounded-lg border p-6">
    <h3 className="font-semibold mb-4">{title}</h3>
    {isLoading ? (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    ) : (
      <div>Content loaded successfully!</div>
    )}
  </div>
);
