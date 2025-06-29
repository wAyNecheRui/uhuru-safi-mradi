
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, CheckCircle, XCircle, Search, FileText, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EACCIntegration = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationInProgress, setVerificationInProgress] = useState<string | null>(null);
  const { toast } = useToast();

  const eaccVerifications = [
    {
      contractorId: 'CON-2024-001',
      contractorName: 'ABC Construction Ltd',
      kraPin: 'P051234567X',
      ncaNumber: 'NCA/DB/8765/2023',
      eaccStatus: 'cleared',
      integrityScore: 92,
      lastVerified: '2024-02-01T10:00:00Z',
      riskLevel: 'low',
      investigations: {
        active: 0,
        closed: 1,
        total: 1
      },
      clearanceCertificate: 'EACC/CLR/2024/0123',
      validUntil: '2024-08-01',
      blacklistStatus: 'not_blacklisted',
      complianceHistory: [
        { date: '2023-12-15', action: 'Cleared for public procurement', status: 'positive' },
        { date: '2023-06-20', action: 'Investigation concluded - no wrongdoing', status: 'positive' },
        { date: '2023-03-10', action: 'Under investigation for tender irregularities', status: 'neutral' }
      ],
      financialHealth: {
        creditRating: 'A-',
        taxCompliance: 'current',
        auditStatus: 'clean'
      }
    },
    {
      contractorId: 'CON-2024-002',
      contractorName: 'Quality Builders Ltd',
      kraPin: 'P051987654Y',
      ncaNumber: 'NCA/DB/5432/2023',
      eaccStatus: 'under_review',
      integrityScore: 67,
      lastVerified: '2024-01-25T14:30:00Z',
      riskLevel: 'medium',
      investigations: {
        active: 1,
        closed: 2,
        total: 3
      },
      clearanceCertificate: 'EACC/CLR/2024/0089',
      validUntil: 'pending',
      blacklistStatus: 'not_blacklisted',
      complianceHistory: [
        { date: '2024-01-20', action: 'New investigation opened - procurement irregularities', status: 'negative' },
        { date: '2023-09-15', action: 'Previous case closed - minor penalty imposed', status: 'neutral' },
        { date: '2023-03-05', action: 'Investigation concluded - warning issued', status: 'neutral' }
      ],
      financialHealth: {
        creditRating: 'B+',
        taxCompliance: 'current',
        auditStatus: 'pending'
      }
    },
    {
      contractorId: 'CON-2024-003',
      contractorName: 'Blacklisted Contractors Ltd',
      kraPin: 'P051555666Z',
      ncaNumber: 'NCA/DB/1111/2023',
      eaccStatus: 'blacklisted',
      integrityScore: 23,
      lastVerified: '2024-01-30T16:45:00Z',
      riskLevel: 'high',
      investigations: {
        active: 3,
        closed: 5,
        total: 8
      },
      clearanceCertificate: 'REVOKED',
      validUntil: 'N/A',
      blacklistStatus: 'blacklisted',
      complianceHistory: [
        { date: '2024-01-15', action: 'Added to procurement blacklist', status: 'negative' },
        { date: '2023-11-30', action: 'Found guilty of corruption - KES 2.5M fine', status: 'negative' },
        { date: '2023-08-10', action: 'Investigation concluded - fraud confirmed', status: 'negative' }
      ],
      financialHealth: {
        creditRating: 'D',
        taxCompliance: 'non-compliant',
        auditStatus: 'adverse'
      }
    }
  ];

  const realTimeAlerts = [
    {
      id: 'ALERT-001',
      severity: 'high',
      contractorName: 'XYZ Infrastructure Ltd',
      message: 'New EACC investigation opened - tender manipulation',
      timestamp: '2024-02-01T12:30:00Z',
      actionRequired: 'Suspend ongoing bidding eligibility'
    },
    {
      id: 'ALERT-002',
      severity: 'medium',
      contractorName: 'Regional Roads Ltd',
      message: 'Integrity score dropped below threshold (68%)',
      timestamp: '2024-02-01T09:15:00Z',
      actionRequired: 'Enhanced monitoring required'
    },
    {
      id: 'ALERT-003',
      severity: 'low',
      contractorName: 'City Builders Co.',
      message: 'Clearance certificate expiring in 30 days',
      timestamp: '2024-02-01T08:00:00Z',
      actionRequired: 'Request renewal documentation'
    }
  ];

  const systemMetrics = [
    { metric: 'Contractors Monitored', value: '847', change: '+23' },
    { metric: 'Active Investigations', value: '12', change: '-3' },
    { metric: 'Blacklisted Entities', value: '34', change: '+2' },
    { metric: 'System Uptime', value: '99.8%', change: 'Stable' }
  ];

  const handleEACCVerification = async (contractorId: string) => {
    setVerificationInProgress(contractorId);
    
    // Simulate API call to EACC
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    toast({
      title: "EACC Verification Complete",
      description: `Real-time integrity check completed for contractor ${contractorId}`,
    });
    
    setVerificationInProgress(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cleared': return 'bg-green-100 text-green-800 border-green-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'blacklisted': return 'bg-red-100 text-red-800 border-red-200';
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

  const filteredContractors = eaccVerifications.filter(contractor =>
    contractor.contractorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contractor.kraPin.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {systemMetrics.map((metric, index) => (
          <Card key={index} className="shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-600 mb-2">{metric.metric}</div>
              <Badge className={`text-xs ${metric.change.includes('+') ? 'bg-red-100 text-red-800' : metric.change.includes('-') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
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
                <Button className="bg-red-600 hover:bg-red-700">
                  <Search className="h-4 w-4 mr-2" />
                  Verify All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contractor Verification Results */}
          {filteredContractors.map((contractor) => (
            <Card key={contractor.contractorId} className="shadow-lg border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">{contractor.contractorName}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>KRA PIN: <span className="font-medium">{contractor.kraPin}</span></div>
                        <div>NCA Number: <span className="font-medium">{contractor.ncaNumber}</span></div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={getStatusColor(contractor.eaccStatus)}>
                        {contractor.eaccStatus.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        Last verified: {new Date(contractor.lastVerified).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Integrity Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: contractor.integrityScore >= 80 ? '#059669' : contractor.integrityScore >= 60 ? '#d97706' : '#dc2626' }}>
                        {contractor.integrityScore}%
                      </div>
                      <div className="text-sm text-gray-600">Integrity Score</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-1 ${getRiskColor(contractor.riskLevel)}`}>
                        {contractor.riskLevel.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600">Risk Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {contractor.investigations.active}/{contractor.investigations.total}
                      </div>
                      <div className="text-sm text-gray-600">Active/Total Cases</div>
                    </div>
                  </div>

                  {/* Financial Health */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Financial Health & Compliance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm">Credit Rating</span>
                        <Badge variant="outline">{contractor.financialHealth.creditRating}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm">Tax Compliance</span>
                        <Badge className={contractor.financialHealth.taxCompliance === 'current' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {contractor.financialHealth.taxCompliance}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm">Audit Status</span>
                        <Badge className={contractor.financialHealth.auditStatus === 'clean' ? 'bg-green-100 text-green-800' : contractor.financialHealth.auditStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                          {contractor.financialHealth.auditStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Compliance History */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Recent Compliance History</h4>
                    <div className="space-y-2">
                      {contractor.complianceHistory.slice(0, 3).map((entry, index) => (
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

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button 
                      size="sm" 
                      onClick={() => handleEACCVerification(contractor.contractorId)}
                      disabled={verificationInProgress === contractor.contractorId}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {verificationInProgress === contractor.contractorId ? 'Verifying...' : 'Re-verify with EACC'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      Full Report
                    </Button>
                    <Button size="sm" variant="outline">
                      View Certificate
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
          ))}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {realTimeAlerts.map((alert) => (
              <Card key={alert.id} className={`shadow-lg border-l-4 ${getAlertColor(alert.severity)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {alert.severity === 'high' ? (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        ) : alert.severity === 'medium' ? (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-600" />
                        )}
                        <Badge className={alert.severity === 'high' ? 'bg-red-100 text-red-800' : alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>
                          {alert.severity.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900">{alert.contractorName}</h3>
                      <p className="text-sm text-gray-700">{alert.message}</p>
                      <p className="text-xs text-gray-600">
                        Action Required: {alert.actionRequired}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-xs text-gray-600">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                      <Button size="sm" variant="outline">
                        Take Action
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EACCIntegration;
