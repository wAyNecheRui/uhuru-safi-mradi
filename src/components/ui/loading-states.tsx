
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
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {text && <span className="text-gray-600">{text}</span>}
    </div>
  );
};

export const FullPageLoader = ({ message = "Loading..." }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

export const InlineLoader = ({ message }: { message?: string }) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner text={message} />
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
    <Alert className="border-red-200 bg-red-50">
      <WifiOff className="h-4 w-4 text-red-600" />
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
  <div className="bg-white rounded-lg border p-6">
    <h3 className="font-semibold mb-4">{title}</h3>
    {isLoading ? (
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-4/6"></div>
      </div>
    ) : (
      <div>Content loaded successfully!</div>
    )}
  </div>
);
