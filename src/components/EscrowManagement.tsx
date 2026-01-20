import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Shield, Clock, CheckCircle, AlertTriangle, Link, Loader2, Wallet, ArrowRight, Users, Smartphone } from 'lucide-react';
import { useEscrowManagement } from '@/hooks/useEscrowManagement';

const EscrowManagement = () => {
  const [fundingAmount, setFundingAmount] = useState<string>('');
  const [fundingProjectId, setFundingProjectId] = useState<string | null>(null);
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  
  const { 
    escrowProjects, 
    readyForEscrowProjects,
    blockchainTransactions, 
    loading, 
    processingPayment,
    createEscrowForProject,
    handleFundEscrow,
    handleReleaseFunds 
  } = useEscrowManagement();

  const hasRealData = escrowProjects.length > 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading escrow data...</p>
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="h-4 w-4 text-green-600" /> };
      case 'verified':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Users className="h-4 w-4 text-blue-600" /> };
      case 'submitted':
      case 'in_progress':
        return { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock className="h-4 w-4 text-amber-600" /> };
      case 'pending':
        return { color: 'bg-slate-100 text-slate-800 border-slate-200', icon: <Clock className="h-4 w-4 text-slate-600" /> };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <AlertTriangle className="h-4 w-4 text-gray-600" /> };
    }
  };

  const handleFundProject = async () => {
    if (!fundingProjectId || !fundingAmount) return;
    
    try {
      await handleFundEscrow(fundingProjectId, parseFloat(fundingAmount));
      setFundDialogOpen(false);
      setFundingAmount('');
      setFundingProjectId(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const openFundDialog = (projectId: string) => {
    setFundingProjectId(projectId);
    setFundDialogOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Workflow Overview */}
      <Card className="shadow-xl border-t-4 border-t-green-600">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <Shield className="h-6 w-6 mr-3 text-green-600" />
            M-Pesa Escrow Payment System
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Secure milestone-based payments following the project workflow with M-Pesa integration.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {/* Workflow Visualization */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-1 text-slate-600">
              <span className="font-medium">Citizen Reports</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center gap-1 text-slate-600">
              <span className="font-medium">Gov Approves</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center gap-1 text-green-600 font-semibold">
              <Wallet className="h-4 w-4" />
              <span>Treasury C2B</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center gap-1 text-slate-600">
              <span className="font-medium">Contractor Works</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center gap-1 text-slate-600">
              <Users className="h-4 w-4" />
              <span className="font-medium">Citizens Verify</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center gap-1 text-slate-600">
              <span className="font-medium">Gov Approves</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center gap-1 text-blue-600 font-semibold">
              <Smartphone className="h-4 w-4" />
              <span>Contractor B2C</span>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Projects Ready for Escrow Setup */}
      {readyForEscrowProjects && readyForEscrowProjects.length > 0 && (
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Wallet className="h-5 w-5 mr-2 text-blue-600" />
              Projects Ready for Escrow Setup ({readyForEscrowProjects.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">These projects have a contractor selected and need escrow accounts created.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {readyForEscrowProjects.map((project: any) => (
              <div key={project.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{project.title}</h4>
                  <p className="text-sm text-muted-foreground">Budget: {formatAmount(project.budget || 0)}</p>
                </div>
                <Button
                  onClick={() => createEscrowForProject(project.id, project.budget || 0)}
                  disabled={processingPayment === project.id}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {processingPayment === project.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Create Escrow
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {escrowProjects.length === 0 && (!readyForEscrowProjects || readyForEscrowProjects.length === 0) ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Escrow Projects Yet</p>
            <p className="text-sm mt-2">Projects with selected contractors will appear here for escrow setup and fund management.</p>
          </CardContent>
        </Card>
      ) : escrowProjects.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Active Escrow Projects ({escrowProjects.length})</h3>
          {escrowProjects.map((project: any) => {
            const statusConfig = getStatusConfig(project.status);
            const isProcessing = processingPayment === project.id;
            const isFullyFunded = project.held_amount >= project.total_amount;
            const needsFunding = !isFullyFunded && project.held_amount < project.total_amount;
            
            return (
              <Card key={project.id} className="shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-semibold">{project.projects?.title || 'Untitled Project'}</h4>
                        <p className="text-sm text-muted-foreground">{project.projects?.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatAmount(project.total_amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Budget</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <Badge className={statusConfig.color}>
                          {project.status}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Held in Escrow</div>
                        <div className="font-semibold text-amber-600">{formatAmount(project.held_amount)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Released to Contractor</div>
                        <div className="font-semibold text-green-600">{formatAmount(project.released_amount)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Remaining</div>
                        <div className="font-semibold">{formatAmount(project.total_amount - project.released_amount)}</div>
                      </div>
                    </div>

                    {/* Fund Escrow Status */}
                    {isFullyFunded ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Escrow Fully Funded</p>
                            <p className="text-sm text-green-700">
                              This project's escrow is fully funded. Contractor payments will proceed automatically after milestone verification.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : needsFunding && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Wallet className="h-5 w-5 text-amber-600" />
                            <div>
                              <p className="font-medium text-amber-900">Escrow Needs Funding</p>
                              <p className="text-sm text-amber-700">
                                Fund this escrow account via M-Pesa C2B to enable contractor payments. 
                                Remaining: {formatAmount(project.total_amount - project.held_amount)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => openFundDialog(project.projects?.id)}
                            className="bg-amber-500 hover:bg-amber-600"
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Wallet className="h-4 w-4 mr-2" />
                            )}
                            Fund via M-Pesa C2B
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Milestones */}
                    {project.project_milestones && project.project_milestones.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium">Project Milestones</h5>
                        {project.project_milestones.map((milestone: any) => {
                          const milestoneStatus = getStatusConfig(milestone.status);
                          const milestoneAmount = (project.total_amount * milestone.payment_percentage) / 100;
                          const canRelease = milestone.status === 'verified' || milestone.status === 'submitted';
                          const isProcessingMilestone = processingPayment === milestone.id;
                          
                          return (
                            <div key={milestone.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    {milestoneStatus.icon}
                                    <span className="font-medium">{milestone.title}</span>
                                    <Badge className={milestoneStatus.color}>
                                      {milestone.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                  <div className="flex items-center gap-4">
                                    <div className="text-lg font-semibold text-green-600">
                                      {formatAmount(milestoneAmount)}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      ({milestone.payment_percentage}% of budget)
                                    </span>
                                  </div>
                                </div>
                                
                                {canRelease && project.held_amount >= milestoneAmount && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={isProcessingMilestone}
                                      >
                                        {isProcessingMilestone ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                          <Smartphone className="h-4 w-4 mr-2" />
                                        )}
                                        Pay Contractor (B2C)
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm M-Pesa B2C Payment</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will release <strong>{formatAmount(milestoneAmount)}</strong> to the contractor 
                                          via M-Pesa B2C for milestone: <strong>{milestone.title}</strong>.
                                          <br /><br />
                                          This action is recorded on the blockchain for transparency.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleReleaseFunds(project.id, milestone.id)}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          Confirm Payment
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                
                                {milestone.status === 'paid' && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Paid
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Blockchain Transaction History */}
      {blockchainTransactions.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link className="h-5 w-5 mr-2 text-blue-600" />
              M-Pesa Blockchain Transparency Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockchainTransactions.map((tx: any) => {
                const verificationData = tx.verification_data as Record<string, any> || {};
                const isC2B = verificationData.type === 'c2b_treasury_deposit';
                
                return (
                  <div key={tx.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={isC2B ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
                            {isC2B ? 'C2B Treasury Deposit' : 'B2C Contractor Payment'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {verificationData.milestone_title || verificationData.treasury_reference || 'Payment Transaction'}
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          Hash: {tx.transaction_hash?.slice(0, 24)}...
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{formatAmount(tx.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          Block #{tx.block_number}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fund Escrow Dialog */}
      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-600" />
              Fund Escrow via M-Pesa C2B
            </DialogTitle>
            <DialogDescription>
              Simulate Treasury funding the escrow account. This triggers an M-Pesa C2B transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount to fund"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFundDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFundProject}
              className="bg-amber-500 hover:bg-amber-600"
              disabled={!fundingAmount || parseFloat(fundingAmount) <= 0}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Fund Escrow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EscrowManagement;
