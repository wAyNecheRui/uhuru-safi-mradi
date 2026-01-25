import { useState, useEffect, useCallback } from 'react';

interface NetworkState {
  isOnline: boolean;
  wasOffline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

/**
 * Hook for monitoring network connectivity status
 */
export function useOnlineStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
  }));

  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        isOnline: true,
        wasOffline: !prev.isOnline, // Track if we just came back online
      }));
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOnline: false,
        wasOffline: prev.wasOffline,
      }));
    };

    // Get connection info if available
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    if (connection) {
      const updateConnectionInfo = () => {
        setState(prev => ({
          ...prev,
          connectionType: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        }));
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', () => {});
      }
    };
  }, []);

  return state;
}

/**
 * Hook for detecting slow connections
 */
export function useSlowConnection(threshold: number = 1): boolean {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    if (!connection) return;

    const checkSpeed = () => {
      // downlink is in Mbps
      setIsSlow(connection.downlink < threshold || connection.effectiveType === '2g');
    };

    checkSpeed();
    connection.addEventListener('change', checkSpeed);

    return () => connection.removeEventListener('change', checkSpeed);
  }, [threshold]);

  return isSlow;
}

/**
 * Hook for saving data mode detection
 */
export function useSaveData(): boolean {
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      setSaveData(connection.saveData === true);
    }
  }, []);

  return saveData;
}