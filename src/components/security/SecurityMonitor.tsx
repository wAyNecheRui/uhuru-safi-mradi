import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Eye, Clock, FileText, CheckCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLogEntry {
  id: string;
  table_name: string;
  action: string;
  record_id: string | null;
  performed_by: string | null;
  performed_at: string;
  old_data: any;
  new_data: any;
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
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [securityStats, setSecurityStats] = useState({
    totalAuditEvents: 0,
    recentApprovals: 0,
    recentPayments: 0,
    recentBidActions: 0
  });
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

      // Fetch REAL audit logs from the database
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(50);

      if (auditError) {
        console.error('Error fetching audit logs:', auditError);
      } else {
        setAuditLogs(auditData || []);
        
        // Calculate real security stats from audit data
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentLogs = (auditData || []).filter(
          log => new Date(log.performed_at) > last24Hours
        );
        
        setSecurityStats({
          totalAuditEvents: (auditData || []).length,
          recentApprovals: recentLogs.filter(l => 
            l.action === 'UPDATE' && 
            (l.table_name === 'problem_reports' || l.table_name === 'project_approval_audit')
          ).length,
          recentPayments: recentLogs.filter(l => 
            l.table_name === 'payment_transactions' || l.table_name === 'escrow_accounts'
          ).length,
          recentBidActions: recentLogs.filter(l => 
            l.table_name === 'contractor_bids'
          ).length
        });
      }

      // Fetch worker access logs if table exists
      const { data: workerLogs, error: workerError } = await supabase
        .from('worker_access_audit')
        .select('*')
        .order('access_timestamp', { ascending: false })
        .limit(50);

      if (!workerError) {
        setAccessLogs(workerLogs || []);
      }
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
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          setAuditLogs(prev => [payload.new as AuditLogEntry, ...prev.slice(0, 49)]);
        }
      )
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

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'UPDATE': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'DELETE': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const formatTableName = (tableName: string) => {
    return tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
      {/* Security Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{securityStats.totalAuditEvents}</p>
            <p className="text-xs text-muted-foreground">Total Audit Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{securityStats.recentApprovals}</p>
            <p className="text-xs text-muted-foreground">Approvals (24h)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{securityStats.recentPayments}</p>
            <p className="text-xs text-muted-foreground">Payment Events (24h)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{securityStats.recentBidActions}</p>
            <p className="text-xs text-muted-foreground">Bid Actions (24h)</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Database Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No audit events recorded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Audit logs are created when data modifications occur in the system
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 hover:bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <Badge className={getActionBadge(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium">
                        {formatTableName(log.table_name)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.performed_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {log.record_id && (
                    <div className="text-xs text-muted-foreground">
                      Record: {log.record_id.substring(0, 8)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Worker Access Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Worker Data Access Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accessLogs.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No worker data access logs</p>
              <p className="text-sm text-muted-foreground mt-1">
                Access logs are recorded when government officials view sensitive worker information
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
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