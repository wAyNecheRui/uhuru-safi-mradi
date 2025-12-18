import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, CheckCircle, Clock, AlertTriangle, Users, DollarSign, FileText, 
  Gavel, Loader2, Eye, CreditCard, Wallet, Briefcase, BarChart3, 
  ClipboardCheck, UserCog, Building2, Scale, Globe, Lock, FolderOpen, Image
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useGovernmentDashboard } from '@/hooks/useGovernmentDashboard';
import { SecurityMonitor } from '@/components/security/SecurityMonitor';
import GovernmentJurisdictionSettings from '@/components/government/GovernmentJurisdictionSettings';

const GovernmentDashboard = () => {
  const [selectedCounty, setSelectedCounty] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { pendingApprovals, activeProjects, budgetOverview, loading, handleApproval } = useGovernmentDashboard();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-xl border-t-4 border-t-blue-600">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading dashboard data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const quickActions = [
    { label: 'Project Portfolio', icon: FolderOpen, path: '/government/portfolio', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Report Approvals', icon: ClipboardCheck, path: '/government/approvals', color: 'bg-orange-600 hover:bg-orange-700' },
    { label: 'Bid Approval', icon: Gavel, path: '/government/bid-approval', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Contractor Management', icon: Building2, path: '/government/contractors', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Analytics & Reports', icon: BarChart3, path: '/government/analytics', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'Compliance', icon: Scale, path: '/government/compliance', color: 'bg-teal-600 hover:bg-teal-700' },
  ];

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

      {/* Quick Navigation Grid */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Globe className="h-5 w-5 mr-2 text-blue-600" />
            Management Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`${action.color} text-white h-auto py-4 flex flex-col items-center gap-2`}
              >
                <action.icon className="h-6 w-6" />
                <span className="text-xs text-center">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - M-Pesa Payment Management */}
      <Card className="shadow-lg border-l-4 border-l-green-600">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">M-Pesa Payment Management</h3>
                <p className="text-sm text-gray-600">Fund escrow accounts and release contractor payments</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/government/escrow')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Escrow & Payments
              </Button>
              <Button 
                onClick={() => navigate('/government/payments')}
                variant="outline"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Payment Transparency
              </Button>
            </div>
          </div>
        </CardContent>
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

      {/* Jurisdiction Settings */}
      <GovernmentJurisdictionSettings />

      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg">
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
            value="security" 
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            <Eye className="h-4 w-4 mr-1" />
            Security Monitor
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
                        <Badge className={getUrgencyColor(project.priority || 'medium')}>
                          {(project.priority || 'medium').toUpperCase()} Priority
                        </Badge>
                        <Badge className={getRiskColor('low')}>
                          Low Risk
                        </Badge>
                        <Badge className={getRecommendationColor('approve')}>
                          AI: APPROVE
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Location:</span>
                        <div className="text-gray-900">{project.location || 'Not specified'}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Budget:</span>
                        <div className="text-green-600 font-semibold">
                          {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(project.budget_allocated || 0)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Selected Contractor:</span>
                        <div className="text-gray-900">
                          {project.contractor_bids?.[0] ? 'Contractor Selected' : 'No bids yet'}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Bid Amount:</span>
                        <div className="text-blue-600 font-semibold">
                          {project.contractor_bids?.[0] ? 
                            new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(project.contractor_bids[0].bid_amount) : 
                            'N/A'
                          }
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                        <div className="font-semibold">{project.priority_score || 0}</div>
                        <div className="text-xs text-gray-600">Community Votes</div>
                      </div>
                      <div className="text-center">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                        <div className="font-semibold">{project.affected_population || 0}</div>
                        <div className="text-xs text-gray-600">Affected Population</div>
                      </div>
                      <div className="text-center">
                        <Image className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                        <div className="font-semibold">{(project.photo_urls?.length || 0) + (project.video_urls?.length || 0)}</div>
                        <div className="text-xs text-gray-600">Uploaded Files</div>
                      </div>
                    </div>

                    {/* Show photos if available */}
                    {project.photo_urls && project.photo_urls.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-700">Evidence Photos:</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {project.photo_urls.slice(0, 4).map((url: string, index: number) => (
                            <a 
                              key={index} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block aspect-square rounded-lg overflow-hidden border hover:shadow-lg transition-shadow"
                            >
                              <img 
                                src={url} 
                                alt={`Evidence ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                        {project.photo_urls.length > 4 && (
                          <p className="text-sm text-gray-500">+ {project.photo_urls.length - 4} more photos</p>
                        )}
                      </div>
                    )}

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
                          {project.status}
                        </Badge>
                        {(project.issues || 0) > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            {project.issues} Issues
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Location:</span>
                        <div>{project.problem_reports?.location || 'Not specified'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Contractor:</span>
                        <div>Contractor assigned</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Budget:</span>
                        <div className="text-green-600 font-semibold">
                          {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(project.budget || 0)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Expected Completion:</span>
                        <div>{new Date(project.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Project Status</span>
                        <Badge className="bg-blue-100 text-blue-800">{project.status}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Started: {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
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

        <TabsContent value="security" className="space-y-6">
          <SecurityMonitor />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{activeProjects.length}</div>
                  <div className="text-xs text-blue-700">Active Projects</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{pendingApprovals.length}</div>
                  <div className="text-xs text-orange-700">Pending Approvals</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                View detailed analytics in the Analytics & Reporting module.
              </p>
              <Button 
                onClick={() => navigate('/government/analytics-dashboard')}
                className="w-full"
                variant="outline"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Full Analytics
              </Button>
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
