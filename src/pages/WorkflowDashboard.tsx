import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import WorkflowProgress from '@/components/workflow/WorkflowProgress';
import CommunityVoting from '@/components/workflow/CommunityVoting';
import ContractorBidding from '@/components/workflow/ContractorBidding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowService } from '@/services/WorkflowService';
import { WorkflowState } from '@/types/workflow';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, DollarSign, Users, Clock } from 'lucide-react';

const WorkflowDashboard = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { user } = useAuth();
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');
  const [report, setReport] = useState<any>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      loadReportData();
    }
  }, [reportId]);

  const loadReportData = async () => {
    try {
      // Load report details and workflow state
      const workflowData = await WorkflowService.getWorkflowState(reportId!);
      setWorkflowState(workflowData);
      // TODO: Load full report details
      setReport({ id: reportId, title: 'Sample Infrastructure Problem' });
    } catch (error) {
      console.error('Error loading workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Header selectedCounty={selectedCounty} onCountyChange={setSelectedCounty} />
        <ResponsiveContainer className="py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header selectedCounty={selectedCounty} onCountyChange={setSelectedCounty} />
      
      <ResponsiveContainer className="py-8">
        <div className="space-y-6">
          {/* Report Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{report?.title}</CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>Nairobi, Kenya</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>KSh 2,500,000</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Reported 3 days ago</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  {workflowState?.currentStep.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Workflow Progress */}
            <div className="lg:col-span-1">
              {workflowState && (
                <WorkflowProgress workflowState={workflowState} />
              )}
            </div>

            {/* Right Column - Active Components */}
            <div className="lg:col-span-2 space-y-6">
              {/* Community Voting */}
              {workflowState?.currentStep === 'community_validation' && (
                <CommunityVoting 
                  reportId={reportId!} 
                  currentUserId={user?.id}
                />
              )}

              {/* Contractor Bidding */}
              {(workflowState?.currentStep === 'contractor_bidding' || 
                workflowState?.completedSteps.includes('contractor_bidding')) && (
                <ContractorBidding 
                  reportId={reportId!}
                  projectBudget={2500000}
                  canSelectBids={true} // TODO: Check user permissions
                />
              )}

              {/* Government Approval Section */}
              {workflowState?.currentStep === 'government_approval' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Government Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      This problem has received sufficient community support and is ready for government review and budget allocation.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default WorkflowDashboard;