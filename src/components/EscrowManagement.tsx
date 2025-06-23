
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DollarSign, Shield, Clock, Users, CheckCircle, AlertTriangle, Smartphone, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EscrowManagement = () => {
  const [releaseConfirmation, setReleaseConfirmation] = useState<number | null>(null);
  const { toast } = useToast();

  const escrowProjects = [
    {
      id: 1,
      title: 'Market Road Rehabilitation',
      contractor: 'ABC Construction Ltd',
      location: 'Machakos County',
      totalBudget: 4800000,
      releasedAmount: 2400000,
      currentPhase: 2,
      totalPhases: 4,
      phases: [
        { id: 1, name: 'Site Preparation', amount: 1200000, status: 'completed', verifiedBy: 45, releaseDate: '2024-01-15' },
        { id: 2, name: 'Foundation & Drainage', amount: 1200000, status: 'completed', verifiedBy: 38, releaseDate: '2024-02-01' },
        { id: 3, name: 'Surface Laying', amount: 1440000, status: 'pending_verification', verifiedBy: 23, requiredVerifications: 30 },
        { id: 4, name: 'Final Finishing', amount: 960000, status: 'locked', verifiedBy: 0, requiredVerifications: 25 }
      ],
      citizenRating: 4.3,
      startDate: '2024-01-10',
      expectedCompletion: '2024-03-15'
    },
    {
      id: 2,
      title: 'School Roof Repair - Mathare Primary',
      contractor: 'Quality Builders Ltd',
      location: 'Nairobi County',
      totalBudget: 2100000,
      releasedAmount: 1575000,
      currentPhase: 3,
      totalPhases: 3,
      phases: [
        { id: 1, name: 'Material Procurement', amount: 630000, status: 'completed', verifiedBy: 52, releaseDate: '2024-01-05' },
        { id: 2, name: 'Roof Removal & Repair', amount: 945000, status: 'completed', verifiedBy: 48, releaseDate: '2024-01-20' },
        { id: 3, name: 'Final Installation & Testing', amount: 525000, status: 'ready_for_release', verifiedBy: 35, requiredVerifications: 30 }
      ],
      citizenRating: 4.8,
      startDate: '2024-01-05',
      expectedCompletion: '2024-02-20'
    },
    {
      id: 3,
      title: 'Kibera Water Pipeline Extension',
      contractor: 'Kenya Water Works Ltd',
      location: 'Nairobi County',
      totalBudget: 4200000,
      releasedAmount: 1260000,
      currentPhase: 1,
      totalPhases: 4,
      phases: [
        { id: 1, name: 'Planning & Permits', amount: 1260000, status: 'completed', verifiedBy: 67, releaseDate: '2024-01-18' },
        { id: 2, name: 'Excavation & Pipe Laying', amount: 1470000, status: 'in_progress', verifiedBy: 12, requiredVerifications: 40 },
        { id: 3, name: 'Connections & Testing', amount: 1050000, status: 'locked', verifiedBy: 0, requiredVerifications: 35 },
        { id: 4, name: 'Final Inspection & Handover', amount: 420000, status: 'locked', verifiedBy: 0, requiredVerifications: 25 }
      ],
      citizenRating: 4.1,
      startDate: '2024-01-18',
      expectedCompletion: '2024-04-25'
    }
  ];

  const blockchainTransactions = [
    {
      id: 1,
      projectTitle: 'Market Road Rehabilitation',
      amount: 1200000,
      phase: 'Foundation & Drainage',
      txHash: '0x1a2b3c4d5e6f7g8h9i0j',
      timestamp: '2024-02-01T10:30:00Z',
      verifications: 38,
      status: 'confirmed'
    },
    {
      id: 2,
      projectTitle: 'School Roof Repair',
      amount: 945000,
      phase: 'Roof Removal & Repair',
      txHash: '0x9i8h7g6f5e4d3c2b1a0j',
      timestamp: '2024-01-20T14:15:00Z',
      verifications: 48,
      status: 'confirmed'
    },
    {
      id: 3,
      projectTitle: 'Kibera Water Pipeline',
      amount: 1260000,
      phase: 'Planning & Permits',
      txHash: '0x5f6g7h8i9j0k1l2m3n4o',
      timestamp: '2024-01-18T09:45:00Z',
      verifications: 67,
      status: 'confirmed'
    }
  ];

  const handleReleaseFunds = (projectId: number, phaseId: number) => {
    toast({
      title: "Funds released successfully!",
      description: `Phase payment has been released to contractor's M-Pesa account. Transaction recorded on blockchain.`,
    });
    setReleaseConfirmation(null);
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'ready_for_release': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'locked': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ready_for_release': return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'pending_verification': return <Users className="h-4 w-4 text-yellow-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'locked': return <Shield className="h-4 w-4 text-gray-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateProgress = (project: any) => {
    return Math.round((project.releasedAmount / project.totalBudget) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-green-600">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <Shield className="h-6 w-6 mr-3 text-green-600" />
            Escrow Fund Management System
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Secure, transparent, and milestone-based fund release system with blockchain audit trail and citizen verification.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
          <TabsTrigger 
            value="projects" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Active Escrow Projects
          </TabsTrigger>
          <TabsTrigger 
            value="blockchain" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Blockchain Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {escrowProjects.map((project) => (
            <Card key={project.id} className="shadow-lg border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Project Header */}
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Contractor: </span>
                          <span className="font-medium">{project.contractor}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Location: </span>
                          <span className="font-medium">{project.location}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Citizen Rating: </span>
                          <span className="font-medium text-blue-600">{project.citizenRating}/5.0</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {formatAmount(project.totalBudget)}
                      </div>
                      <div className="text-sm text-gray-600">Total Budget</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {formatAmount(project.releasedAmount)} Released
                      </div>
                    </div>
                  </div>

                  {/* Progress Overview */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm text-gray-600">{calculateProgress(project)}%</span>
                    </div>
                    <Progress value={calculateProgress(project)} className="h-3 mb-2" />
                    <div className="text-xs text-gray-600">
                      Phase {project.currentPhase} of {project.totalPhases} • 
                      Expected completion: {new Date(project.expectedCompletion).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Phase Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Payment Phases</h4>
                    <div className="grid gap-4">
                      {project.phases.map((phase) => (
                        <div key={phase.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                {getPhaseStatusIcon(phase.status)}
                                <span className="font-medium text-gray-900">{phase.name}</span>
                                <Badge className={getPhaseStatusColor(phase.status)}>
                                  {phase.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                              </div>
                              
                              <div className="text-lg font-semibold text-green-600">
                                {formatAmount(phase.amount)}
                              </div>

                              {phase.status === 'completed' && (
                                <div className="text-sm text-gray-600">
                                  Released on: {new Date(phase.releaseDate!).toLocaleDateString()} • 
                                  Verified by {phase.verifiedBy} citizens
                                </div>
                              )}

                              {(phase.status === 'pending_verification' || phase.status === 'in_progress') && (
                                <div className="space-y-2">
                                  <div className="text-sm text-gray-600">
                                    Citizen verifications: {phase.verifiedBy} of {phase.requiredVerifications} required
                                  </div>
                                  <Progress 
                                    value={(phase.verifiedBy / phase.requiredVerifications!) * 100} 
                                    className="h-2" 
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col space-y-2">
                              {phase.status === 'ready_for_release' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                                      <DollarSign className="h-4 w-4 mr-2" />
                                      Release Funds
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirm Fund Release</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        You are about to release {formatAmount(phase.amount)} to {project.contractor} 
                                        for the "{phase.name}" phase. This action will be recorded on the blockchain 
                                        and cannot be reversed.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleReleaseFunds(project.id, phase.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Release Funds
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                              {phase.status === 'pending_verification' && (
                                <Button variant="outline" disabled>
                                  <Users className="h-4 w-4 mr-2" />
                                  Awaiting Verification
                                </Button>
                              )}

                              {phase.status === 'locked' && (
                                <Button variant="outline" disabled>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Locked
                                </Button>
                              )}

                              {phase.status === 'completed' && (
                                <Button variant="outline" disabled>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Completed
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link className="h-5 w-5 mr-2 text-blue-600" />
                Recent Blockchain Transactions
              </CardTitle>
              <p className="text-sm text-gray-600">
                Immutable record of all fund releases with CBEAC integration and M-Pesa payment confirmations.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blockchainTransactions.map((tx) => (
                  <div key={tx.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">{tx.projectTitle}</h4>
                        <div className="text-sm text-gray-600">Phase: {tx.phase}</div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                            <span className="font-semibold text-green-600">{formatAmount(tx.amount)}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-blue-600" />
                            <span>{tx.verifications} verifications</span>
                          </div>
                          <div className="flex items-center">
                            <Smartphone className="h-4 w-4 mr-1 text-purple-600" />
                            <span>M-Pesa transfer</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <Badge className="bg-green-100 text-green-800">
                          {tx.status.toUpperCase()}
                        </Badge>
                        <div className="text-xs text-gray-600">
                          {new Date(tx.timestamp).toLocaleString()}
                        </div>
                        <div className="text-xs font-mono text-blue-600 cursor-pointer hover:underline">
                          {tx.txHash}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Multi-signature Validation</div>
                    <div className="text-sm text-gray-600">Requires government + citizen verification</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Immutable Audit Trail</div>
                    <div className="text-sm text-gray-600">All transactions permanently recorded</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Real-time Monitoring</div>
                    <div className="text-sm text-gray-600">Live tracking of fund movements</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Smartphone className="h-5 w-5 mr-2 text-blue-600" />
                  Integration Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">M-Pesa Daraja API</div>
                    <div className="text-sm text-gray-600">Direct contractor payments</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">CBEAC Integration</div>
                    <div className="text-sm text-gray-600">Central bank compliance</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">SMS/USSD Notifications</div>
                    <div className="text-sm text-gray-600">Rural area accessibility</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* System Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-green-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Escrow System Benefits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-green-800 mb-2">Transparency</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Public blockchain audit trail</li>
                <li>• Real-time fund tracking</li>
                <li>• Citizen verification required</li>
                <li>• Automated compliance reporting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">Security</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Multi-signature wallets</li>
                <li>• Milestone-based releases</li>
                <li>• Smart contract automation</li>
                <li>• Anti-corruption measures</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">Efficiency</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Instant M-Pesa payments</li>
                <li>• Reduced bureaucracy</li>
                <li>• Automated verifications</li>
                <li>• Mobile accessibility</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EscrowManagement;
