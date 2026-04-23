import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, WifiOff, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorType: 'module' | 'network' | 'general';
}

// Detect if this is a module loading error (happens when app is updated)
const isModuleLoadError = (error: Error): boolean => {
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    message.includes('dynamically imported module')
  );
};

// Detect network-related errors
const isNetworkError = (error: Error): boolean => {
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('offline') ||
    message.includes('connection')
  );
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorType: 'general' };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    let errorType: 'module' | 'network' | 'general' = 'general';
    
    if (isModuleLoadError(error)) {
      errorType = 'module';
    } else if (isNetworkError(error)) {
      errorType = 'network';
    }
    
    return { hasError: true, error, errorType };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary', 'Caught render error', error, errorInfo.componentStack);
    this.setState({ error, errorInfo });
  }

  // Soft retry - just reset state
  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorType: 'general' });
  };

  // Hard refresh - clear cache and reload
  handleHardRefresh = () => {
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    // Force reload from server
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  getUserFriendlyMessage = () => {
    const { errorType } = this.state;
    
    switch (errorType) {
      case 'module':
        return {
          title: 'Page Update Required',
          description: 'The app has been updated since you last visited. Please refresh to get the latest version.',
          icon: RotateCcw,
          primaryAction: 'Refresh Now',
          primaryHandler: this.handleHardRefresh
        };
      case 'network':
        return {
          title: 'Connection Problem',
          description: 'We couldn\'t load part of the page. Please check your internet connection and try again.',
          icon: WifiOff,
          primaryAction: 'Try Again',
          primaryHandler: this.handleRetry
        };
      default:
        return {
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred. You can try refreshing the page or go back to the home page.',
          icon: AlertTriangle,
          primaryAction: 'Try Again',
          primaryHandler: this.handleRetry
        };
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, description, icon: Icon, primaryAction, primaryHandler } = this.getUserFriendlyMessage();

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full shadow-lg border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                {description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={primaryHandler}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {primaryAction}
                </Button>
                <Button 
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {this.state.errorType === 'module' && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  This happens when we release updates. Refreshing will fix it!
                </p>
              )}
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded text-xs">
                  <summary className="cursor-pointer font-medium text-muted-foreground">Technical Details (Dev Only)</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-muted-foreground overflow-auto max-h-40">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
