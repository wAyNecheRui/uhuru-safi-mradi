import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Eye, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityAlert {
  id: string;
  type: 'suspicious_access' | 'failed_login' | 'rate_limit' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  user_id?: string;
  metadata?: any;
}

interface AccessLog {
  id: string;
  government_user_id: string;
  worker_id: string;
  access_type: string;
  accessed_fields: string[];
  access_timestamp: string;
  justification?: string;
}

export const SecurityMonitor = () => {
  const { user } = useAuth();
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.user_type === 'government') {
      fetchSecurityData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch access logs
      const { data: logs, error: logsError } = await supabase
        .from('worker_access_audit')
        .select('*')
        .order('access_timestamp', { ascending: false })
        .limit(50);

      if (logsError) {
        console.error('Error fetching access logs:', logsError);
      } else {
        setAccessLogs(logs || []);
      }

      // Generate sample security alerts (in a real app, these would come from a monitoring service)
      const sampleAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'suspicious_access',
          severity: 'medium',
          message: 'Multiple worker profiles accessed in rapid succession',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          user_id: user?.id
        },
        {
          id: '2',
          type: 'rate_limit',
          severity: 'low',
          message: 'Rate limit triggered for API endpoint',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        }
      ];

      setSecurityAlerts(sampleAlerts);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('security_monitoring')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'worker_access_audit' },
        (payload) => {
          setAccessLogs(prev => [payload.new as AccessLog, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'suspicious_access': return <Eye className="h-4 w-4" />;
      case 'failed_login': return <Shield className="h-4 w-4" />;
      case 'rate_limit': return <Clock className="h-4 w-4" />;
      case 'data_breach': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (user?.user_type !== 'government') {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading security data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {securityAlerts.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No security alerts at this time
            </div>
          ) : (
            <div className="space-y-3">
              {securityAlerts.map((alert) => (
                <Alert key={alert.id}>
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertDescription className="mb-2">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Worker Data Access Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accessLogs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No access logs available
            </div>
          ) : (
            <div className="space-y-3">
              {accessLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.access_type}</Badge>
                      <span className="text-sm font-medium">
                        Worker ID: {log.worker_id.substring(0, 8)}...
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.access_timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  {log.accessed_fields && log.accessed_fields.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Accessed fields: </span>
                      <span className="text-sm text-muted-foreground">
                        {log.accessed_fields.join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {log.justification && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Justification: </span>
                      {log.justification}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};