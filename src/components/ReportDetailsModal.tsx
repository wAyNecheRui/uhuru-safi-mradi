import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, FileText, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { calculateProjectProgress } from '@/utils/progressCalculation';

interface ReportDetailsProps {
  report: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    location: string;
    created_at: string;
    photo_urls?: string[];
    category?: string;
    estimated_cost?: number;
    affected_population?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

interface ProjectData {
  id: string;
  status: string;
  contractor_id: string | null;
  budget: number | null;
  created_at: string;
  contractor_name?: string;
  milestones: Array<{
    id: string;
    status: string;
    payment_percentage: number;
    title: string;
  }>;
  escrow_status?: string;
  escrow_funded_percentage?: number;
}

interface LifecycleStep {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  active: boolean;
  timestamp?: string;
}

const ReportDetailsModal = ({ report, isOpen, onClose }: ReportDetailsProps) => {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && report.id) {
      fetchProjectData();
    }
  }, [isOpen, report.id]);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      // Fetch linked project with milestones
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          status,
          contractor_id,
          budget,
          created_at,
          project_milestones (
            id,
            status,
            payment_percentage,
            title
          )
        `)
        .eq('report_id', report.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        setProjectData(null);
        return;
      }

      if (project) {
        // Fetch contractor name if assigned
        let contractorName: string | undefined;
        if (project.contractor_id) {
          const { data: contractor } = await supabase
            .from('contractor_profiles')
            .select('company_name')
            .eq('user_id', project.contractor_id)
            .single();
          contractorName = contractor?.company_name;
        }

        // Fetch escrow status
        const { data: escrow } = await supabase
          .from('escrow_accounts')
          .select('status, held_amount, released_amount, total_amount')
          .eq('project_id', project.id)
          .is('deleted_at', null)
          .maybeSingle();

        let escrowFundedPercentage = 0;
        if (escrow && project.budget && project.budget > 0) {
          const totalFunded = (escrow.held_amount || 0) + (escrow.released_amount || 0);
          escrowFundedPercentage = Math.min(100, Math.round((totalFunded / project.budget) * 100));
        }

        setProjectData({
          ...project,
          milestones: project.project_milestones || [],
          contractor_name: contractorName,
          escrow_status: escrow?.status,
          escrow_funded_percentage: escrowFundedPercentage
        });
      } else {
        setProjectData(null);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      setProjectData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'contractor_selected': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'bidding_open': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Calculate the lifecycle steps based on actual data
  const getLifecycleSteps = (): LifecycleStep[] => {
    const reportStatus = report.status.toLowerCase();
    const projectStatus = projectData?.status?.toLowerCase();
    
    // Check if project is effectively completed
    const isProjectCompleted = projectStatus === 'completed' || 
      (projectData?.milestones && projectData.milestones.length > 0 && 
       projectData.milestones.every(m => ['paid', 'verified', 'completed'].includes(m.status.toLowerCase())));

    // Check escrow funding status
    const isEscrowFunded = projectData?.escrow_funded_percentage === 100 || 
      projectData?.escrow_status === 'completed';

    // Calculate project progress
    const progress = projectData?.milestones ? calculateProjectProgress(projectData.milestones) : 0;

    const steps: LifecycleStep[] = [
      {
        key: 'submitted',
        label: 'Report Submitted',
        description: 'Your report has been submitted to the system',
        completed: true, // Always completed if we have a report
        active: reportStatus === 'pending',
        timestamp: report.created_at
      },
      {
        key: 'under_review',
        label: 'Community Validation',
        description: 'Report received sufficient community votes',
        completed: ['under_review', 'approved', 'bidding_open', 'contractor_selected', 'in_progress', 'completed'].includes(reportStatus) || !!projectData,
        active: reportStatus === 'under_review'
      },
      {
        key: 'approved',
        label: 'Government Approved',
        description: 'Report approved by government officials',
        completed: ['approved', 'bidding_open', 'contractor_selected', 'in_progress', 'completed'].includes(reportStatus) || !!projectData,
        active: reportStatus === 'approved'
      },
      {
        key: 'bidding',
        label: 'Contractor Bidding',
        description: 'Contractors submitted bids for the project',
        completed: ['contractor_selected', 'in_progress', 'completed'].includes(reportStatus) || (!!projectData && projectData.contractor_id !== null),
        active: reportStatus === 'bidding_open'
      },
      {
        key: 'contractor_selected',
        label: 'Contractor Assigned',
        description: projectData?.contractor_name ? `Assigned to: ${projectData.contractor_name}` : 'A contractor has been selected',
        completed: !!projectData?.contractor_id || ['contractor_selected', 'in_progress', 'completed'].includes(reportStatus) || isProjectCompleted,
        active: reportStatus === 'contractor_selected' && !isEscrowFunded
      },
      {
        key: 'escrow_funded',
        label: 'Escrow Funded',
        description: isEscrowFunded ? 'Project fully funded in escrow' : `${projectData?.escrow_funded_percentage || 0}% funded`,
        completed: isEscrowFunded || isProjectCompleted,
        active: !!projectData?.contractor_id && !isEscrowFunded && !isProjectCompleted
      },
      {
        key: 'in_progress',
        label: 'Work In Progress',
        description: progress > 0 ? `${progress}% complete` : 'Contractor is executing the work',
        completed: projectStatus === 'in_progress' || isProjectCompleted || progress > 0,
        active: projectStatus === 'in_progress' && !isProjectCompleted
      },
      {
        key: 'completed',
        label: 'Project Completed',
        description: 'All milestones verified and payments released',
        completed: isProjectCompleted,
        active: false
      }
    ];

    return steps;
  };

  const lifecycleSteps = getLifecycleSteps();
  const overallProgress = projectData?.milestones ? calculateProjectProgress(projectData.milestones) : 0;
  const effectiveStatus = projectData?.status === 'completed' || overallProgress === 100 
    ? 'completed' 
    : projectData?.status || report.status;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold pr-8">
            {report.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor(effectiveStatus)}>
              {effectiveStatus.replace(/_/g, ' ').toUpperCase()}
            </Badge>
            <Badge className={getPriorityColor(report.priority)}>
              {report.priority.toUpperCase()} PRIORITY
            </Badge>
            {report.category && (
              <Badge variant="outline">
                {report.category.toUpperCase()}
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-xs">
              ID: {report.id.substring(0, 8)}
            </Badge>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-blue-600" />
              <span><strong>Location:</strong> {report.location}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-green-600" />
              <span><strong>Reported:</strong> {formatDate(report.created_at)}</span>
            </div>
          </div>

          {/* Project Progress Summary */}
          {projectData && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Project Progress</span>
                <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              {projectData.contractor_name && (
                <p className="text-sm text-muted-foreground mt-2">
                  Contractor: <span className="font-medium">{projectData.contractor_name}</span>
                </p>
              )}
              {projectData.milestones.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {projectData.milestones.filter(m => ['paid', 'verified', 'completed'].includes(m.status.toLowerCase())).length} of {projectData.milestones.length} milestones completed
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Description
            </h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
              {report.description}
            </p>
          </div>

          {/* Additional Details */}
          {(report.estimated_cost || report.affected_population) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.estimated_cost && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-1">Estimated Cost</h4>
                  <p className="text-blue-700 text-lg font-bold">
                    {formatCurrency(report.estimated_cost)}
                  </p>
                </div>
              )}
              {report.affected_population && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-1">Affected Population</h4>
                  <p className="text-orange-700 text-lg font-bold">
                    {report.affected_population.toLocaleString()} people
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Photos */}
          {report.photo_urls && report.photo_urls.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Evidence Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {report.photo_urls.map((url, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={url}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Timeline - Dynamic based on actual data */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Project Lifecycle</h3>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading project status...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {lifecycleSteps.map((step, index) => (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600 fill-green-100" />
                      ) : step.active ? (
                        <div className="h-5 w-5 rounded-full border-2 border-blue-500 bg-blue-100 animate-pulse" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                      {index < lifecycleSteps.length - 1 && (
                        <div className={`w-0.5 h-6 mt-1 ${step.completed ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${step.completed ? 'text-green-700' : step.active ? 'text-blue-700' : 'text-gray-500'}`}>
                          {step.label}
                        </span>
                        {step.active && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Current</Badge>
                        )}
                      </div>
                      <p className={`text-sm ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                        {step.description}
                      </p>
                      {step.timestamp && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(step.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDetailsModal;
