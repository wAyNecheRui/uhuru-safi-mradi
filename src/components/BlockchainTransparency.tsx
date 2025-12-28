import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Shield, Link, CheckCircle, AlertTriangle, Hash, Clock, Users, FileCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BlockchainTransaction {
  id: string;
  transaction_hash: string;
  block_hash: string;
  block_number: number;
  amount: number;
  network_status: string | null;
  created_at: string | null;
  project_id: string | null;
  gas_used: number | null;
  verification_data: any;
  signatures: any;
  project?: { title: string } | null;
}

const BlockchainTransparency = () => {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('blockchain_transactions')
        .select(`
          *,
          project:projects(title)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching blockchain transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-KE');
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-xl border-t-4 border-t-purple-600">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading blockchain data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-purple-600">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center text-2xl">
            <Hash className="h-6 w-6 mr-3 text-purple-600" />
            Blockchain Transparency & Immutable Audit System
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Complete transaction history with cryptographic proof and multi-signature approvals.
          </p>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">{transactions.length}</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {transactions.filter(t => t.network_status === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {transactions.filter(t => t.network_status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {formatAmount(transactions.reduce((sum, t) => sum + t.amount, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
          <TabsTrigger value="transactions">Blockchain Transactions</TabsTrigger>
          <TabsTrigger value="info">About This System</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          {transactions.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                <p className="text-gray-600">
                  Blockchain transactions will appear here when payments are processed through the system.
                </p>
              </CardContent>
            </Card>
          ) : (
            transactions.map((tx) => (
              <Card key={tx.id} className="shadow-lg border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Transaction Header */}
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {tx.project?.title || 'Transaction'}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            Block #{tx.block_number}
                          </Badge>
                          <Badge className={`text-xs ${getStatusBadge(tx.network_status)}`}>
                            {(tx.network_status || 'unknown').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatAmount(tx.amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDateTime(tx.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Blockchain Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-500 uppercase">Transaction Hash</div>
                        <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                          {tx.transaction_hash}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-500 uppercase">Block Hash</div>
                        <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                          {tx.block_hash}
                        </div>
                      </div>
                    </div>

                    {tx.gas_used && (
                      <div className="text-sm text-gray-600">
                        Gas Used: {tx.gas_used.toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-600" />
                How This System Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Immutable Records
                  </h4>
                  <p className="text-sm text-gray-600">
                    All financial transactions are recorded on the blockchain, creating an unalterable audit trail that cannot be modified or deleted.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    Multi-Signature Approval
                  </h4>
                  <p className="text-sm text-gray-600">
                    Payments require approval from multiple authorized signatories, ensuring no single person can release funds without oversight.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <FileCheck className="h-4 w-4 mr-2 text-purple-600" />
                    Citizen Verification
                  </h4>
                  <p className="text-sm text-gray-600">
                    Community members verify project milestones on-site, and their verifications are recorded on the blockchain.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <Hash className="h-4 w-4 mr-2 text-orange-600" />
                    Cryptographic Proof
                  </h4>
                  <p className="text-sm text-gray-600">
                    Each transaction has a unique cryptographic hash that can be independently verified by anyone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockchainTransparency;