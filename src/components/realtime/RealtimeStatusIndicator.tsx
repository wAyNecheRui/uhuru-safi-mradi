import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRealtimeContext } from '@/contexts/RealtimeContext';
import { cn } from '@/lib/utils';

interface RealtimeStatusIndicatorProps {
  showLabel?: boolean;
  className?: string;
}

/**
 * Displays the current real-time connection status
 * Shows a visual indicator for connected, connecting, or disconnected states
 */
const RealtimeStatusIndicator: React.FC<RealtimeStatusIndicatorProps> = ({ 
  showLabel = false,
  className 
}) => {
  const { connectionStatus, isConnected, lastUpdate } = useRealtimeContext();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <Wifi className="h-3 w-3" />,
          label: 'Live',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-300 dark:border-green-700',
          tooltip: 'Real-time updates active'
        };
      case 'connecting':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          label: 'Connecting',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-300 dark:border-yellow-700',
          tooltip: 'Establishing connection...'
        };
      case 'error':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          label: 'Error',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          borderColor: 'border-red-300 dark:border-red-700',
          tooltip: 'Connection error - updates may be delayed'
        };
      default:
        return {
          icon: <WifiOff className="h-3 w-3" />,
          label: 'Offline',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-muted',
          tooltip: 'Not connected - please log in for live updates'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            'text-xs cursor-help transition-colors',
            config.color,
            config.bgColor,
            config.borderColor,
            className
          )}
        >
          {config.icon}
          {showLabel && <span className="ml-1">{config.label}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.tooltip}</p>
        {lastUpdate && connectionStatus === 'connected' && (
          <p className="text-xs text-muted-foreground mt-1">
            Last update: {lastUpdate.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default RealtimeStatusIndicator;
