import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileX, Lock, AlertCircle, RefreshCw } from 'lucide-react';

interface AccessAwareEmptyProps {
  /** Whether the query returned an error (potential access issue) */
  hasError?: boolean;
  /** The actual error object if available */
  error?: Error | null;
  /** Whether data is still loading */
  isLoading?: boolean;
  /** The data array to check */
  data?: unknown[] | null;
  /** Title for empty state */
  emptyTitle?: string;
  /** Description for empty state */
  emptyDescription?: string;
  /** Title for access restricted state */
  restrictedTitle?: string;
  /** Description for access restricted state */
  restrictedDescription?: string;
  /** Action button for empty state */
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  /** Retry function for errors */
  onRetry?: () => void;
  className?: string;
}

/**
 * A component that intelligently distinguishes between:
 * 1. No data available (user has access, just empty)
 * 2. Access restricted (RLS denied or permission error)
 * 3. Network/other errors
 */
export const AccessAwareEmpty: React.FC<AccessAwareEmptyProps> = ({
  hasError = false,
  error = null,
  isLoading = false,
  data,
  emptyTitle = "No Data Found",
  emptyDescription = "There's no data to display at the moment.",
  restrictedTitle = "Access Restricted",
  restrictedDescription = "You don't have permission to view this content. Contact an administrator if you believe this is an error.",
  emptyAction,
  onRetry,
  className = "",
}) => {
  // Don't render if loading or has data
  if (isLoading || (data && data.length > 0)) {
    return null;
  }

  // Determine the state
  const isAccessError = hasError && error && (
    error.message?.toLowerCase().includes('permission') ||
    error.message?.toLowerCase().includes('denied') ||
    error.message?.toLowerCase().includes('policy') ||
    error.message?.toLowerCase().includes('rls') ||
    error.message?.toLowerCase().includes('unauthorized') ||
    error.message?.includes('42501') || // PostgreSQL permission denied
    error.message?.includes('PGRST') // PostgREST errors
  );

  const isNetworkError = hasError && error && (
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('fetch') ||
    error.message?.toLowerCase().includes('timeout') ||
    error.message?.toLowerCase().includes('connection')
  );

  // Access Restricted State
  if (isAccessError) {
    return (
      <Card className={`border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-4 mb-4">
            <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
            {restrictedTitle}
          </h3>
          <p className="text-sm text-amber-600 dark:text-amber-400 max-w-md">
            {restrictedDescription}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Network/Server Error State
  if (isNetworkError || (hasError && error)) {
    return (
      <Card className={`border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Something Went Wrong
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 max-w-md mb-4">
            {error?.message || "Unable to load data. Please try again."}
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Empty Data State (user has access, just no data)
  return (
    <Card className={`border-muted ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {emptyTitle}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {emptyDescription}
        </p>
        {emptyAction && (
          <Button className="mt-4" onClick={emptyAction.onClick}>
            {emptyAction.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessAwareEmpty;
