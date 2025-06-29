
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Shield, Link, CheckCircle, AlertTriangle, Hash, Clock, Users, FileCheck } from 'lucide-react';

const BlockchainTransparency = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  const blockchainTransactions = [
    {
      id: 'TX-2024-001',
      projectTitle: 'Machakos Market Road Rehabilitation',
      blockHash: '0x3a7b4f9c2e8d6a1b5f3e9c7a2d4b8f6e3a9c5d7b1f4e8a6c3d9b7f2e5a8c6d4b',
      transactionHash: '0x9f2e5a8c6d4b1f4e8a6c3d9b7f2e5a8c6d4b3a7b4f9c2e8d6a1b5f3e9c7a2d4b',
      timestamp: '2024-02-01T14:30:00Z',
      amount: 1200000,
      milestone: 'Foundation & Drainage Complete',
      signatures: [
        { role: 'County Engineer', address: '0x742d35Cc...8C4f', status: 'signed', timestamp: '2024-02-01T14:25:00Z' },
        { role: 'Treasury Officer', address: '0x8ba1f109...7A3e', status: 'signed', timestamp: '2024-02-01T14:28:00Z' },
        { role: 'Citizen Oversight', address: '0x4f9c2e8d...6D1b', status: 'pending', timestamp: null }
      ],
      verification: {
        citizenConfirmations: 38,
        requiredConfirmations: 30,
        gpsCoordinates: '-1.0232, 37.0913',
        photoHashes: ['0xa7b4f9c2...', '0xe8d6a1b5...', '0xf3e9c7a2...'],
        workCompletionScore: 94
      },
      explorerUrl: 'https://blockchain.uhurusafi.go.ke/tx/0x9f2e5a8c6d4b1f4e8a6c3d9b7f2e5a8c6d4b3a7b4f9c2e8d6a1b5f3e9c7a2d4b',
      gasUsed: '21,000',
      blockNumber: 15847392,
      networkStatus: 'confirmed'
    },
    {
      id: 'TX-2024-002',
      projectTitle: 'Kibera Water Pipeline Extension',
      blockHash: '0x5d7b1f4e8a6c3d9b7f2e5a8c6d4b9f2e5a8c6d4b3a7b4f9c2e8d6a1b5f3e9c7a',
      transactionHash: '0x2d4b8f6e3a9c5d7b1f4e8a6c3d9b7f2e5a8c6d4b9f2e5a8c6d4b3a7b4f9c2e8d',
      timestamp: '2024-01-18T09:45:00Z',
      amount: 1260000,
      milestone: 'Planning & Permits Approved',
      signatures: [
        { role: 'County Engineer', address: '0x742d35Cc...8C4f', status: 'signed', timestamp: '2024-01-18T09:40:00Z' },
        { role: 'Treasury Officer', address: '0x8ba1f109...7A3e', status: 'signed', timestamp: '2024-01-18T09:42:00Z' },
        { role: 'Citizen Oversight', address: '0x4f9c2e8d...6D1b', status: 'signed', timestamp: '2024-01-18T09:44:00Z' }
      ],
      verification: {
        citizenConfirmations: 67,
        requiredConfirmations: 30,
        gpsCoordinates: '-1.3131, 36.7964',
        photoHashes: ['0xb8c5f0d3...', '0xf9e6b2a7...'],
        workCompletionScore: 88
      },
      explorerUrl: 'https://blockchain.uhurusafi.go.ke/tx/0x2d4b8f6e3a9c5d7b1f4e8a6c3d9b7f2e5a8c6d4b9f2e5a8c6d4b3a7b4f9c2e8d',
      gasUsed: '18,500',
      blockNumber: 15838721,
      networkStatus: 'confirmed'
    }
  ];

  const auditTrail = [
    {
      action: 'Project Registration',
      timestamp: '2024-01-15T10:00:00Z',
      actor: 'County Government',
      hash: '0xa1b2c3d4e5f6...',
      details: 'Project registered with initial budget allocation'
    },
    {
      action: 'Contractor Selection',
      timestamp: '2024-01-16T15:30:00Z',
      actor: 'Procurement Committee',
      hash: '0xf6e5d4c3b2a1...',
      details: 'Contractor selected through transparent bidding'
    },
    {
      action: 'Citizen Verification Request',
      timestamp: '2024-02-01T12:00:00Z',
      actor: 'Community Oversight',
      hash: '0x9z8y7x6w5v4u...',
      details: '38 citizens verified milestone completion'
    },
    {
      action: 'Payment Release',
      timestamp: '2024-02-01T14:30:00Z',
      actor: 'Smart Contract',
      hash: '0x3a7b4f9c2e8d...',
      details: 'KES 1.2M released after multi-sig approval'
    }
  ];

  const networkStats = [
    { metric: 'Total Transactions', value: '2,847', change: '+12%' },
    { metric: 'Active Nodes', value: '47', change: 'Stable' },
    { metric: 'Average Block Time', value: '2.3s', change: '-5%' },
    { metric: 'Network Integrity', value: '99.97%', change: '+0.02%' }
  ];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE');
  };

  const getSignatureStatus = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-purple-600">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center text-2xl">
            <Hash className="h-6 w-6 mr-3 text-purple-600" />
            Blockchain Transparency & Immutable Audit System
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Complete transaction history with cryptographic proof, multi-signature approvals, and citizen verification.
          </p>
        </CardHeader>
      </Card>

      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {networkStats.map((stat, index) => (
          <Card key={index} className="shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-2">{stat.metric}</div>
              <Badge className={`text-xs ${stat.change.includes('+') ? 'bg-green-100 text-green-800' : stat.change.includes('-') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                {stat.change}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
          <TabsTrigger value="transactions">Blockchain Transactions</TabsTrigger>
          <TabsTrigger value="audit">Immutable Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          {blockchainTransactions.map((tx) => (
            <Card key={tx.id} className="shadow-lg border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Transaction Header */}
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">{tx.projectTitle}</h3>
                      <div className="text-sm text-gray-600">
                        Milestone: <span className="font-medium">{tx.milestone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          Block #{tx.blockNumber}
                        </Badge>
                        <Badge className="text-xs bg-green-100 text-green-800">
                          {tx.networkStatus.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatAmount(tx.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDateTime(tx.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-500 uppercase">Transaction Hash</div>
                      <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                        {tx.transactionHash}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-500 uppercase">Block Hash</div>
                      <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                        {tx.blockHash}
                      </div>
                    </div>
                  </div>

                  {/* Multi-Signature Status */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Multi-Signature Approvals
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {tx.signatures.map((sig, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                          {sig.status === 'signed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : sig.status === 'pending' ? (
                            <Clock className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium">{sig.role}</div>
                            <div className="text-xs text-gray-600 font-mono">{sig.address}</div>
                            {sig.timestamp && (
                              <div className="text-xs text-gray-500">
                                {formatDateTime(sig.timestamp)}
                              </div>
                            )}
                          </div>
                          <Badge className={getSignatureStatus(sig.status)}>
                            {sig.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Citizen Verification */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Citizen Verification Status
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Community Confirmations</span>
                          <span>{tx.verification.citizenConfirmations} of {tx.verification.requiredConfirmations} required</span>
                        </div>
                        <Progress 
                          value={(tx.verification.citizenConfirmations / tx.verification.requiredConfirmations) * 100} 
                          className="h-3" 
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Work Completion Score</span>
                          <span>{tx.verification.workCompletionScore}%</span>
                        </div>
                        <Progress value={tx.verification.workCompletionScore} className="h-3" />
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      GPS Verified: {tx.verification.gpsCoordinates} | 
                      Photo Evidence: {tx.verification.photoHashes.length} verified images
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline" onClick={() => window.open(tx.explorerUrl, '_blank')}>
                      <Link className="h-3 w-3 mr-1" />
                      View on Explorer
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileCheck className="h-3 w-3 mr-1" />
                      Download Certificate
                    </Button>
                    <Button size="sm" variant="outline">
                      Verify Signatures
                    </Button>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      Audit Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileCheck className="h-5 w-5 mr-2" />
                Immutable Audit Trail
              </CardTitle>
              <p className="text-sm text-gray-600">
                Complete chronological record of all project actions with cryptographic proof
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditTrail.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{entry.action}</div>
                          <div className="text-sm text-gray-600">by {entry.actor}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {formatDateTime(entry.timestamp)}
                          </div>
                          <div className="text-xs font-mono text-gray-500">
                            Hash: {entry.hash}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">{entry.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockchainTransparency;
