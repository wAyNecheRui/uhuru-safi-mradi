import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, Shield, Activity, AlertTriangle, CheckCircle,
  Clock, Eye, Lock, Search, Loader2, Server, Database,
  Wifi, Key, UserCheck, History
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const GovernmentUserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const systemMetrics = {
    apiResponseTime: '145ms',
    databasePerformance: '98.5%',
    userLoadStats: '1,234 active',
    failedLogins: 3,
    suspiciousActivity: 1,
    blockchainSync: 'Connected'
  };

  const roles = [
    { name: 'Super Admin', description: 'Full system access', users: 2, color: 'bg-red-100 text-red-800' },
    { name: 'Fund Manager', description: 'Can release payments', users: 5, color: 'bg-green-100 text-green-800' },
    { name: 'Approver', description: 'Can approve projects', users: 12, color: 'bg-blue-100 text-blue-800' },
    { name: 'Monitor', description: 'View-only access', users: 25, color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [usersRes, logsRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_type', 'government')
          .limit(20),
        supabase
          .from('worker_access_audit')
          .select('*')
          .order('access_timestamp', { ascending: false })
          .limit(50)
      ]);

      setUsers(usersRes.data || []);
      setAuditLogs(logsRes.data || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'User & System Management' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8 space-y-6">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Security & Administration</h1>
            <p className="text-gray-600">User access management and system monitoring</p>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">User Access</TabsTrigger>
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              <TabsTrigger value="system">System Health</TabsTrigger>
            </TabsList>

            {/* User Access Management */}
            <TabsContent value="users" className="space-y-6">
              {/* Role Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {roles.map((role) => (
                  <Card key={role.name} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={role.color}>{role.name}</Badge>
                        <span className="text-2xl font-bold">{role.users}</span>
                      </div>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Government Users
                    </CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No government users found</p>
                  ) : (
                    <div className="space-y-3">
                      {users.filter(u => 
                        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{user.full_name || 'Unknown User'}</p>
                              <p className="text-sm text-gray-500">{user.county || 'No location'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Government</Badge>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Logs */}
            <TabsContent value="audit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Activity Audit Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {auditLogs.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No audit logs available</p>
                  ) : (
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              log.access_type === 'view' ? 'bg-blue-100' :
                              log.access_type === 'update' ? 'bg-yellow-100' :
                              'bg-gray-100'
                            }`}>
                              {log.access_type === 'view' ? 
                                <Eye className="h-4 w-4 text-blue-600" /> :
                                <Key className="h-4 w-4 text-yellow-600" />
                              }
                            </div>
                            <div>
                              <p className="font-medium capitalize">{log.access_type} Action</p>
                              <p className="text-sm text-gray-500">
                                {log.accessed_fields?.join(', ') || 'General access'}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(log.access_timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Health */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-t-4 border-t-green-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Activity className="h-5 w-5 text-green-600" />
                      <span className="font-medium">API Response Time</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{systemMetrics.apiResponseTime}</p>
                    <p className="text-xs text-gray-500 mt-1">Average response time</p>
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-t-blue-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Database className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Database Performance</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{systemMetrics.databasePerformance}</p>
                    <p className="text-xs text-gray-500 mt-1">Query efficiency</p>
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-t-purple-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">User Load</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{systemMetrics.userLoadStats}</p>
                    <p className="text-xs text-gray-500 mt-1">Currently online</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-800">Failed Login Attempts</span>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <p className="text-2xl font-bold text-red-600">{systemMetrics.failedLogins}</p>
                      <p className="text-xs text-red-700 mt-1">Last 24 hours</p>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-yellow-800">Suspicious Activity</span>
                        <Eye className="h-5 w-5 text-yellow-600" />
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">{systemMetrics.suspiciousActivity}</p>
                      <p className="text-xs text-yellow-700 mt-1">Flagged for review</p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">Blockchain Sync</span>
                        <Wifi className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{systemMetrics.blockchainSync}</p>
                      <p className="text-xs text-green-700 mt-1">Real-time verification</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentUserManagement;
