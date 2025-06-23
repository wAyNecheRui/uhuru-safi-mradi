
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, CheckCircle, Clock, AlertTriangle, Users, DollarSign, FileText, Gavel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GovernmentDashboard = () => {
  const [selectedCounty, setSelectedCounty] = useState('all');
  const { toast } = useToast();

  const pendingApprovals = [
    {
      id: 1,
      title: 'Mombasa Road Pothole Repair',
      location: 'Nairobi County',
      budget: 'KES 2.5M',
      communityVotes: 234,
      supportPercentage: 89,
      selectedContractor: 'Highway Construction Ltd',
      contractorRating: 4.7,
      bidAmount: 'KES 2.3M',
      timeline: '3 weeks',
      urgency: 'High',
      submittedDate: '2024-01-20',
      aiRecommendation: 'APPROVE',
      riskLevel: 'Low'
    },
    {
      id: 2,
      title: 'Kibera Water Pipeline Extension',
      location: 'Nairobi County',
      budget: 'KES 4.8M',
      communityVotes: 456,
      supportPercentage: 94,
      selectedContractor: 'Kenya Water Works Ltd',
      contractorRating: 4.9,
      bidAmount: 'KES 4.2M',
      timeline: '6 weeks',
      urgency: 'Critical',
      submittedDate: '2024-01-18',
      aiRecommendation: 'APPROVE',
      riskLevel: 'Medium'
    },
    {
      id: 3,
      title: 'Kasarani Street Light Installation',
      location: 'Nairobi County',
      budget: 'KES 1.2M',
      communityVotes: 189,
      supportPercentage: 78,
      selectedContractor: 'Solar Solutions Kenya',
      contractorRating: 4.2,
      bidAmount: 'KES 1.1M',
      timeline: '2 weeks',
      urgency: 'Medium',
      submittedDate: '2024-01-22',
      aiRecommendation: 'REVIEW',
      riskLevel: 'Low'
    }
  ];

  const activeProjects = [
    {
      id: 1,
      title: 'Market Road Rehabilitation',
      location: 'Machakos County',
      contractor: 'ABC Construction Ltd',
      budget: 'KES 4.8M',
      progress: 65,
      startDate: '2024-01-10',
      expectedCompletion: '2024-03-15',
      currentPhase: 'Construction',
      nextMilestone: 'Surface laying',
      citizenRating: 4.3,
      issues: 0
    },
    {
      id: 2,
      title: 'School Roof Repair - Mathare Primary',
      location: 'Nairobi County',
      contractor: 'Quality Builders Ltd',
      budget: 'KES 2.1M',
      progress: 85,
      startDate: '2024-01-05',
      expectedCompletion: '2024-02-20',
      currentPhase: 'Finishing',
      nextMilestone: 'Final inspection',
      citizenRating: 4.8,
      issues: 0
    },
    {
      id: 3,
      title: 'Health Center Renovation',
      location: 'Kisumu County',
      contractor: 'Medical Infrastructure Ltd',
      budget: 'KES 6.2M',
      progress: 42,
      startDate: '2024-01-15',
      expectedCompletion: '2024-04-10',
      currentPhase: 'Structural work',
      nextMilestone: 'Electrical installation',
      citizenRating: 4.1,
      issues: 2
    }
  ];

  const budgetOverview = {
    totalAllocated: 'KES 45.2B',
    totalSpent: 'KES 28.7B',
    totalCommitted: 'KES 12.8B',
    available: 'KES 3.7B',
    utilizationRate: 64
  };

  const handleApproval = (projectId: number, action: 'approve' | 'reject' | 'request_more_info') => {
    const actionMessages = {
      approve: 'Project approved! Escrow funds will be released to contractor.',
      reject: 'Project rejected. Community and contractor will be notified.',
      request_more_info: 'Additional information requested from contractor.'
    };

    toast({
      title: `Project ${action.replace('_', ' ')}`,
      description: actionMessages[action],
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'APPROVE': return 'bg-green-100 text-green-800';
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'REJECT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center text-2xl">
                <Shield className="h-6 w-6 mr-3 text-blue-600" />
                Government Administrative Dashboard
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Streamlined project approval, budget oversight, and transparency management.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select County" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  <SelectItem value="nairobi">Nairobi County</SelectItem>
                  <SelectItem value="mombasa">Mombasa County</SelectItem>
                  <SelectItem value="kisumu">Kisumu County</SelectItem>
                  <SelectItem value="nakuru">Nakuru County</SelectItem>
                </SelectContent>
              </Select>
              <Badge className="bg-blue-100 text-blue-800">
                Live Dashboard
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Budget Overview */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Budget Overview - FY 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{budgetOverview.totalAllocated}</div>
              <div className="text-sm text-blue-700">Total Allocated</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{budgetOverview.totalSpent}</div>
              <div className="text-sm text-green-700">Total Spent</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{budgetOverview.totalCommitted}</div>
              <div className="text-sm text-yellow-700">Committed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{budgetOverview.available}</div>
              <div className="text-sm text-purple-700">Available</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
              <span className="text-sm text-gray-600">{budgetOverview.utilizationRate}%</span>
            </div>
            <Progress value={budgetOverview.utilizationRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg">
          <TabsTrigger 
            value="approvals" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Pending Approvals ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Active Projects ({activeProjects.length})
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            Analytics & Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-6">
          <div className="grid gap-6">
            {pendingApprovals.map((project) => (
              <Card key={project.id} className="shadow-lg border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                      <div className="flex gap-2">
                        <Badge className={getUrgencyColor(project.urgency)}>
                          {project.urgency} Priority
                        </Badge>
                        <Badge className={getRiskColor(project.riskLevel)}>
                          {project.riskLevel} Risk
                        </Badge>
                        <Badge className={getRecommendationColor(project.aiRecommendation)}>
                          AI: {project.aiRecommendation}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Location:</span>
                        <div className="text-gray-900">{project.location}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Budget:</span>
                        <div className="text-green-600 font-semibold">{project.budget}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Selected Contractor:</span>
                        <div className="text-gray-900">{project.selectedContractor}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Bid Amount:</span>
                        <div className="text-blue-600 font-semibold">{project.bidAmount}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                        <div className="font-semibold">{project.communityVotes}</div>
                        <div className="text-xs text-gray-600">Community Votes</div>
                        <div className="text-sm font-medium text-green-600">{project.supportPercentage}% Support</div>
                      </div>
                      <div className="text-center">
                        <Shield className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                        <div className="font-semibold">{project.contractorRating}/5.0</div>
                        <div className="text-xs text-gray-600">Contractor Rating</div>
                      </div>
                      <div className="text-center">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                        <div className="font-semibold">{project.timeline}</div>
                        <div className="text-xs text-gray-600">Estimated Timeline</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                      <Button
                        onClick={() => handleApproval(project.id, 'approve')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Project
                      </Button>
                      <Button
                        onClick={() => handleApproval(project.id, 'request_more_info')}
                        variant="outline"
                        className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Request Info
                      </Button>
                      <Button
                        onClick={() => handleApproval(project.id, 'reject')}
                        variant="outline"
                        className="border-red-500 text-red-700 hover:bg-red-50"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className="grid gap-6">
            {activeProjects.map((project) => (
              <Card key={project.id} className="shadow-lg border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                      <div className="flex gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          {project.currentPhase}
                        </Badge>
                        {project.issues > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            {project.issues} Issues
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Location:</span>
                        <div>{project.location}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Contractor:</span>
                        <div>{project.contractor}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Budget:</span>
                        <div className="text-green-600 font-semibold">{project.budget}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Expected Completion:</span>
                        <div>{new Date(project.expectedCompletion).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Project Progress</span>
                        <span className="text-sm text-gray-600">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-3" />
                      <div className="text-sm text-gray-600">
                        Next milestone: {project.nextMilestone}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <span className="text-gray-600">Citizen Rating: </span>
                          <span className="font-semibold text-blue-600">{project.citizenRating}/5.0</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Started: </span>
                          <span>{new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Site Inspection
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">On-time completion rate</span>
                    <span className="font-semibold">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Budget adherence rate</span>
                    <span className="font-semibold">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Citizen satisfaction</span>
                    <span className="font-semibold">4.2/5.0</span>
                  </div>
                  <Progress value={84} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transparency Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1,247</div>
                    <div className="text-xs text-blue-700">Total Projects</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">98.5%</div>
                    <div className="text-xs text-green-700">Data Transparency</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">15,678</div>
                    <div className="text-xs text-purple-700">Citizen Reports</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">234</div>
                    <div className="text-xs text-orange-700">Verified Contractors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>County Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Machakos'].map((county, index) => {
                  const performance = [95, 87, 78, 82, 89][index];
                  return (
                    <div key={county} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{county} County</span>
                        <span className="text-sm text-gray-600">{performance}%</span>
                      </div>
                      <Progress value={performance} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Blockchain Audit Trail */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Blockchain Transparency Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Audit Trail Benefits</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Immutable record of all fund transfers</li>
                <li>• Real-time budget tracking and allocation</li>
                <li>• Automated compliance with EACC regulations</li>
                <li>• Transparent contractor payment milestones</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Integration Status</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Hyperledger Fabric blockchain deployed</li>
                <li>• CBEAC integration for fund releases</li>
                <li>• M-Pesa API for contractor payments</li>
                <li>• SMS notifications via USSD gateway</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GovernmentDashboard;
