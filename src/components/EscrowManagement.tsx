
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DollarSign, Shield, Clock, Users, CheckCircle, AlertTriangle, Smartphone, Link, Loader2 } from 'lucide-react';
import { useEscrowManagement } from '@/hooks/useEscrowManagement';

const EscrowManagement = () => {
  const [releaseConfirmation, setReleaseConfirmation] = useState<number | null>(null);
  const { escrowProjects, blockchainTransactions, loading, handleReleaseFunds } = useEscrowManagement();

  // Show demo data message if no real data
  const hasRealData = escrowProjects.length > 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading escrow data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'verified': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'verified': return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {!hasRealData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Demo Mode</p>
                <p className="text-sm text-blue-700">Showing sample data. Real escrow projects will appear here once projects are created with escrow accounts.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="shadow-xl border-t-4 border-t-green-600">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <Shield className="h-6 w-6 mr-3 text-green-600" />
            Escrow Fund Management System
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Secure, transparent, and milestone-based fund release system with blockchain audit trail.
          </p>
        </CardHeader>
      </Card>

      {escrowProjects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No escrow projects yet. Projects with approved budgets will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Active Escrow Projects ({escrowProjects.length})</h3>
          {escrowProjects.map((project: any) => (
            <Card key={project.id} className="shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-semibold">{project.projects?.title || 'Untitled Project'}</h4>
                      <p className="text-sm text-gray-600">{project.projects?.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatAmount(project.total_amount)}
                      </div>
                      <div className="text-sm text-gray-600">Total Budget</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm text-gray-600">Status</div>
                      <Badge className={getPhaseStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Released</div>
                      <div className="font-semibold">{formatAmount(project.released_amount)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Held in Escrow</div>
                      <div className="font-semibold">{formatAmount(project.held_amount)}</div>
                    </div>
                  </div>

                  {project.project_milestones && project.project_milestones.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-medium">Milestones</h5>
                      {project.project_milestones.map((milestone: any) => (
                        <div key={milestone.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getPhaseStatusIcon(milestone.status)}
                                <span className="font-medium">{milestone.title}</span>
                                <Badge className={getPhaseStatusColor(milestone.status)}>
                                  {milestone.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{milestone.description}</p>
                              <div className="text-lg font-semibold text-green-600">
                                {formatAmount((project.total_amount * milestone.payment_percentage) / 100)}
                              </div>
                            </div>
                            
                            {milestone.status === 'pending' && (
                              <Button
                                onClick={() => handleReleaseFunds(project.id, milestone.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Release Funds
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {blockchainTransactions.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link className="h-5 w-5 mr-2 text-blue-600" />
              Blockchain Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockchainTransactions.map((tx: any) => (
                <div key={tx.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{tx.escrow_accounts?.projects?.title || 'Project'}</div>
                      <div className="text-sm text-gray-600">
                        {tx.project_milestones?.title || 'Milestone Payment'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">{formatAmount(tx.amount)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EscrowManagement;
