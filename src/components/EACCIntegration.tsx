
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, CheckCircle, XCircle, Search, FileText, Clock, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useEACCIntegration } from '@/hooks/useEACCIntegration';

const EACCIntegration = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { eaccVerifications, realTimeAlerts, systemMetrics, loading, handleEACCVerification } = useEACCIntegration();
  const [verificationInProgress, setVerificationInProgress] = useState<string | null>(null);

  const handleVerify = async (contractorId: string) => {
    setVerificationInProgress(contractorId);
    await handleEACCVerification(contractorId);
    setVerificationInProgress(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cleared':
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'under_review':
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'blacklisted':
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const filteredContractors = (eaccVerifications as any[]).filter((contractor: any) =>
    contractor.contractorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contractor.kraPin?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-red-600">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="flex items-center text-2xl">
            <Shield className="h-6 w-6 mr-3 text-red-600" />
            EACC Integration & Real-Time Integrity Monitoring
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Automated contractor verification with Ethics and Anti-Corruption Commission database for real-time integrity checks.
          </p>
        </CardHeader>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(systemMetrics as any[]).map((metric: any, index: number) => (
          <Card key={index} className="shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-600 mb-2">{metric.metric}</div>
              <Badge className={`text-xs ${metric.change === 'Alert' ? 'bg-red-100 text-red-800' : metric.change === 'Clear' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {metric.change}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="contractors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
          <TabsTrigger value="contractors">Contractor Verification</TabsTrigger>
          <TabsTrigger value="alerts">Real-Time Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="contractors" className="space-y-6">
          {/* Search Bar */}
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by contractor name or KRA PIN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredContractors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No EACC verification records found</p>
                <p className="text-sm mt-1">Contractor EACC verifications will appear here once submitted through the verification system.</p>
              </CardContent>
            </Card>
          ) : (
            filteredContractors.map((contractor: any) => (
              <Card key={contractor.contractorId} className="shadow-lg border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">{contractor.contractorName}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {contractor.kraPin && <div>KRA PIN: <span className="font-medium">{contractor.kraPin}</span></div>}
                          {contractor.ncaNumber && <div>NCA Number: <span className="font-medium">{contractor.ncaNumber}</span></div>}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getStatusColor(contractor.eaccStatus)}>
                          {(contractor.eaccStatus || 'pending').replace('_', ' ').toUpperCase()}
                        </Badge>
                        {contractor.lastVerified && (
                          <div className="text-sm text-gray-600">
                            Last verified: {new Date(contractor.lastVerified).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1" style={{ color: contractor.integrityScore >= 80 ? '#059669' : contractor.integrityScore >= 60 ? '#d97706' : '#dc2626' }}>
                          {contractor.integrityScore}%
                        </div>
                        <div className="text-sm text-gray-600">Integrity Score</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold mb-1 ${getRiskColor(contractor.riskLevel)}`}>
                          {(contractor.riskLevel || 'unknown').toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-600">Risk Level</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {contractor.investigations?.active || 0}/{contractor.investigations?.total || 0}
                        </div>
                        <div className="text-sm text-gray-600">Active/Total Cases</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Financial Health & Compliance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <span className="text-sm">Credit Rating</span>
                          <Badge variant="outline">{contractor.financialHealth?.creditRating || '—'}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <span className="text-sm">Tax Compliance</span>
                          <Badge className={contractor.financialHealth?.taxCompliance === 'current' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {contractor.financialHealth?.taxCompliance || 'unknown'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <span className="text-sm">Audit Status</span>
                          <Badge className={contractor.financialHealth?.auditStatus === 'clean' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {contractor.financialHealth?.auditStatus || 'unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {contractor.complianceHistory?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Recent Compliance History</h4>
                        <div className="space-y-2">
                          {contractor.complianceHistory.slice(0, 3).map((entry: any, index: number) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                              {entry.status === 'positive' ? (
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              ) : entry.status === 'negative' ? (
                                <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="text-sm font-medium">{entry.action}</div>
                                <div className="text-xs text-gray-600">
                                  {new Date(entry.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Button 
                        size="sm" 
                        onClick={() => handleVerify(contractor.contractorId)}
                        disabled={verificationInProgress === contractor.contractorId}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {verificationInProgress === contractor.contractorId ? 'Verifying...' : 'Re-verify with EACC'}
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        Full Report
                      </Button>
                      {contractor.eaccStatus === 'blacklisted' && (
                        <Button size="sm" variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Block Contractor
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {(realTimeAlerts as any[]).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p className="font-medium">No active alerts</p>
                  <p className="text-sm mt-1">All contractors are in good standing. Alerts will appear here when issues are detected.</p>
                </CardContent>
              </Card>
            ) : (
              (realTimeAlerts as any[]).map((alert: any, index: number) => (
                <Card key={index} className={`shadow-lg border-l-4 ${getAlertColor(alert.type || 'medium')}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {(alert.type || 'INFO').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{alert.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EACCIntegration;
