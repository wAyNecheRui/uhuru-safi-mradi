import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Clock, MapPin, Calendar, Award, Loader2, Briefcase, 
  Camera, CheckCircle, AlertCircle, Target, Upload, Wallet, Lock, Info, Users, Settings, Eye
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ProgressUpdateForm from '@/components/contractor/ProgressUpdateForm';
import MilestoneManagement from '@/components/contractor/MilestoneManagement';
import MilestoneEvidenceViewer from '@/components/contractor/MilestoneEvidenceViewer';

import WorkforceHiringPanel from '@/components/contractor/WorkforceHiringPanel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EscrowWorkflowService, ProjectEscrowStatus } from '@/services/EscrowWorkflowService';
import { useRealtimeSubscription, REALTIME_PRESETS } from '@/hooks/useRealtimeSubscription';
import { calculateProjectProgress } from '@/utils/progressCalculation';
import { fetchContractorRatingsFromVerifications } from '@/utils/contractorRatingCalculation';

interface Milestone {
  id: string;
  title: string;
  description: string;
  milestone_number: number;
  status: string;
  payment_percentage: number;
  evidence_urls: string[] | null;
  submitted_at: string | null;
}

interface EscrowInfo {
  id: string;
  total_amount: number;
  held_amount: number;
  released_amount: number;
  status: string;
}

interface ProjectWithExtras {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  contractor_id: string | null;
  report_id: string | null;
  problem_reports?: { title: string; location: string | null; category: string | null } | null;
  progress?: number;
  rating?: number;
  milestones?: Milestone[];
  escrow?: EscrowInfo | null;
  canWork?: boolean;
  workBlockedReason?: string;
}

const ContractorProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeProjects, setActiveProjects] = useState<ProjectWithExtras[]>([]);
  const [completedProjects, setCompletedProjects] = useState<ProjectWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithExtras | null>(null);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'My Projects' }
  ];
  // Memoize fetchProjects for real-time subscription
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch projects assigned to this contractor
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          problem_reports(title, location, category)
        `)
        .eq('contractor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch REAL ratings from milestone verifications
      const contractorRatings = user?.id ? await fetchContractorRatingsFromVerifications([user.id]) : {};
      const myRatings = user?.id ? contractorRatings[user.id] : null;

      // Fetch milestones and escrow for ALL projects first, then categorize
      const allEnriched: ProjectWithExtras[] = [];
      for (const project of (projects || [])) {
        const { data: milestones } = await supabase
          .from('project_milestones')
          .select('id, title, description, milestone_number, status, payment_percentage, evidence_urls, submitted_at')
          .eq('project_id', project.id)
          .order('milestone_number', { ascending: true });

        const { data: escrow } = await supabase
          .from('escrow_accounts')
          .select('*')
          .eq('project_id', project.id)
          .single();

        const workStatus = await EscrowWorkflowService.canContractorWork(project.id);
        const calculatedProgress = calculateProjectProgress(milestones || []);

        // Determine effective completion:
        // A project is complete if DB says 'completed' OR
        // all milestones are paid AND escrow is fully released
        const milestonesArr = milestones || [];
        const allMilestonesPaid = milestonesArr.length > 0 && milestonesArr.every(m => m.status === 'paid');
        const escrowCleared = escrow
          ? (escrow.held_amount === 0 && escrow.released_amount >= escrow.total_amount)
          : false;
        const isEffectivelyCompleted =
          project.status === 'completed' || (allMilestonesPaid && escrowCleared);

        // Per-project ratings
        const projectRatings = myRatings?.ratings.filter(r => r.projectId === project.id) || [];
        const avgRating = projectRatings.length > 0
          ? projectRatings.reduce((acc, r) => acc + r.rating, 0) / projectRatings.length
          : 0;

        allEnriched.push({
          ...project,
          progress: calculatedProgress,
          milestones: milestonesArr,
          escrow: escrow || null,
          canWork: workStatus.allowed,
          workBlockedReason: workStatus.allowed ? undefined : workStatus.reason,
          rating: Math.round(avgRating * 10) / 10,
          // Override status for effectively completed projects
          status: isEffectivelyCompleted ? 'completed' : project.status,
        } as ProjectWithExtras);
      }

      // Now categorize using the effective status
      const activeWithProgress = allEnriched.filter(p =>
        p.status !== 'completed' && p.status !== 'cancelled'
      );
      const completedWithRating = allEnriched.filter(p => p.status === 'completed');

      setActiveProjects(activeWithProgress);
      setCompletedProjects(completedWithRating);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Set up real-time subscriptions for live updates
  useRealtimeSubscription({
    subscriptions: REALTIME_PRESETS.projectTracking,
    onDataChange: fetchProjects,
    channelPrefix: 'contractor-projects',
    enabled: !!user
  });

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);


  const handleUpdateProgress = (project: ProjectWithExtras) => {
    setSelectedProject(project);
    setUpdateModalOpen(true);
  };

  const handleProgressSubmitted = () => {
    setUpdateModalOpen(false);
    setSelectedProject(null);
    fetchProjects();
  };

  const handleConfigureMilestones = (project: ProjectWithExtras) => {
    setSelectedProject(project);
    setMilestoneModalOpen(true);
  };

  const handleMilestonesSaved = () => {
    setMilestoneModalOpen(false);
    setSelectedProject(null);
    fetchProjects();
  };

  const handleViewEvidence = (project: ProjectWithExtras) => {
    setSelectedProject(project);
    setEvidenceModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Check if contractor can update progress based on milestone workflow
  const canUpdateProgress = (
    project: ProjectWithExtras
  ): { allowed: boolean; reason?: string; suggestedAction?: 'configure_milestones' } => {
    // First check if escrow is funded
    if (!project.canWork) {
      return { allowed: false, reason: project.workBlockedReason || 'Awaiting escrow funding' };
    }

    // Check if milestones are configured
    if (!project.milestones || project.milestones.length === 0) {
      return { allowed: false, reason: 'Configure milestones first', suggestedAction: 'configure_milestones' };
    }

    const milestones = [...project.milestones].sort((a, b) => a.milestone_number - b.milestone_number);

    // Find milestones that are in progress or submitted (awaiting verification/payment)
    const pendingMilestone = milestones.find(
      (m) => m.status === 'submitted' || m.status === 'verified' || m.status === 'in_progress'
    );

    if (pendingMilestone) {
      if (pendingMilestone.status === 'submitted') {
        return {
          allowed: false,
          reason: `Milestone "${pendingMilestone.title}" is awaiting citizen verification`,
        };
      }
      if (pendingMilestone.status === 'verified') {
        return {
          allowed: false,
          reason: `Milestone "${pendingMilestone.title}" is awaiting payment release`,
        };
      }
      if (pendingMilestone.status === 'in_progress') {
        // Allow updating the in_progress milestone
        return { allowed: true };
      }
    }

    const allocationSum = milestones.reduce((sum, m) => sum + (m.payment_percentage || 0), 0);
    const escrow = project.escrow;
    const escrowCleared = !!escrow && escrow.held_amount === 0 && escrow.released_amount >= escrow.total_amount;

    // If all milestones are paid but the plan is incomplete / escrow not cleared,
    // do NOT block the contractor from continuing the workflow.
    // Instead, guide them to configure additional milestones.
    const allPaid = milestones.every((m) => m.status === 'paid');
    if (allPaid) {
      if (!escrowCleared || allocationSum < 100) {
        const remaining = escrow ? Math.max(escrow.total_amount - escrow.released_amount, 0) : 0;
        return {
          allowed: false,
          reason: `Milestone configuration is incomplete (${allocationSum}% allocated). Remaining escrow: KES ${remaining.toLocaleString()}. Add milestones to continue`,
          suggestedAction: 'configure_milestones',
        };
      }

      return { allowed: false, reason: 'All milestones completed' };
    }

    // Find the next pending milestone to work on
    const nextPending = milestones.find((m) => m.status === 'pending');
    if (nextPending) {
      return { allowed: true };
    }

    return { allowed: true };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
        <Header />
        <main className="w-full max-w-full overflow-x-hidden px-3 sm:px-4 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            <span className="ml-2 text-sm sm:text-base">Loading projects...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
      <Header />
      
      <main className="w-full max-w-full overflow-x-hidden px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 mx-auto" style={{ maxWidth: 'min(100%, 80rem)' }}>
        <BreadcrumbNav items={breadcrumbItems} />
        
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and manage your active and completed government projects.</p>
        </div>

        <Tabs defaultValue="active" className="space-y-4 sm:space-y-6 w-full max-w-full">
          <TabsList className="w-full bg-white shadow-lg">
            <TabsTrigger value="active" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              Active ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs sm:text-sm">
              Completed ({completedProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeProjects.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="p-8 text-center">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Projects</h3>
                  <p className="text-gray-600 mb-4">You don't have any active projects yet. Browse available projects and submit bids to get started.</p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <a href="/contractor/bidding">Browse Projects</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
               activeProjects.map((project) => {
                 const progressStatus = canUpdateProgress(project);
                 const updateButtonEnabled =
                   progressStatus.allowed || progressStatus.suggestedAction === 'configure_milestones';

                 return (
                 <div key={project.id} className="space-y-4">
                   
                   <Card className="shadow-lg">
                   {/* Escrow Status Alert */}
                   {!project.canWork && (
                     <Alert className="m-4 mb-0 border-yellow-300 bg-yellow-50">
                       <Lock className="h-4 w-4 text-yellow-600" />
                       <AlertTitle className="text-yellow-800">Awaiting Escrow Funding</AlertTitle>
                       <AlertDescription className="text-yellow-700">
                         {project.workBlockedReason || 'Government must fund the escrow before work can begin.'}
                       </AlertDescription>
                     </Alert>
                   )}
                   
                   {/* Escrow Funding Progress */}
                   {project.escrow && (
                     <div className="mx-4 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-sm font-medium flex items-center gap-1">
                           <Wallet className="h-4 w-4" />
                           Escrow Funding
                         </span>
                         <Badge className={project.escrow.held_amount >= project.escrow.total_amount ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                           {project.escrow.held_amount >= project.escrow.total_amount ? 'Fully Funded' : `${Math.round((project.escrow.held_amount / project.escrow.total_amount) * 100)}% Funded`}
                         </Badge>
                       </div>
                       <Progress value={(project.escrow.held_amount / project.escrow.total_amount) * 100} className="h-2" />
                       <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                         <span>Held: KES {project.escrow.held_amount.toLocaleString()}</span>
                         <span>Total: KES {project.escrow.total_amount.toLocaleString()}</span>
                       </div>
                     </div>
                   )}

                   <CardHeader className="p-3 sm:p-4 lg:p-6">
                     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                       <div className="min-w-0 flex-1">
                         <CardTitle className="text-base sm:text-lg lg:text-xl mb-2 break-words">{project.title}</CardTitle>
                         <p className="text-sm text-gray-600 break-words">{project.description}</p>
                         <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 mt-2 gap-2 sm:gap-4">
                           <div className="flex items-center min-w-0">
                             <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                             <span className="truncate">{project.problem_reports?.location || 'Location not specified'}</span>
                           </div>
                           <div className="flex items-center">
                             <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                             <span className="whitespace-nowrap">Started: {new Date(project.created_at || '').toLocaleDateString()}</span>
                           </div>
                         </div>
                       </div>
                       <div className="text-left sm:text-right flex-shrink-0">
                         <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mb-1">
                           {formatCurrency(project.budget || 0)}
                         </div>
                        </div>
                     </div>
                   </CardHeader>
                   
                   <CardContent className="space-y-4">
                     {/* Progress Bar */}
                     <div>
                       <div className="flex justify-between text-sm mb-2">
                         <span className="font-medium">Project Progress</span>
                         <span className="font-bold">{project.progress || 0}%</span>
                       </div>
                       <div className="w-full bg-gray-200 rounded-full h-3">
                         <div 
                           className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                           style={{ width: `${project.progress || 0}%` }}
                         ></div>
                       </div>
                     </div>

                     {/* Milestones Section */}
                     {project.milestones && project.milestones.length > 0 ? (
                       <div className="border rounded-lg p-3 sm:p-4 bg-muted/50 overflow-hidden">
                         <div className="flex items-center justify-between mb-3">
                           <h4 className="font-medium flex items-center text-sm sm:text-base">
                             <Target className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                             Project Milestones
                           </h4>
                           {project.milestones.some(m => m.evidence_urls && m.evidence_urls.length > 0) && (
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleViewEvidence(project)}
                               className="text-xs"
                             >
                               <Eye className="h-3 w-3 mr-1" />
                               View Evidence
                             </Button>
                           )}
                         </div>
                         <div className="space-y-2 sm:space-y-3">
                           {project.milestones.map((milestone) => (
                             <div key={milestone.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 bg-background rounded border">
                               <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                 <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 ${
                                   milestone.status === 'paid' ? 'bg-green-100 text-green-700' :
                                   milestone.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                                   milestone.status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                                   milestone.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                                   'bg-muted text-muted-foreground'
                                 }`}>
                                   {milestone.milestone_number}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                   <p className="font-medium text-xs sm:text-sm truncate">{milestone.title}</p>
                                   <p className="text-xs text-muted-foreground">{milestone.payment_percentage}% of budget</p>
                                 </div>
                               </div>
                               <div className="flex items-center gap-2 flex-wrap pl-8 sm:pl-0">
                                 {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                                   <Badge variant="outline" className="text-xs">
                                     <Camera className="h-3 w-3 mr-1" />
                                     {milestone.evidence_urls.length}
                                   </Badge>
                                 )}
                                 <Badge className={`text-xs ${
                                   milestone.status === 'paid' ? 'bg-green-100 text-green-800' :
                                   milestone.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                                   milestone.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                                   milestone.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                                   'bg-muted text-muted-foreground'
                                 }`}>
                                   {milestone.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                                   {milestone.status}
                                 </Badge>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     ) : (
                       /* No Milestones - Show Configure Button */
                       <Alert className="border-orange-300 bg-orange-50">
                         <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                         <div className="flex-1 min-w-0">
                           <AlertTitle className="text-orange-800 text-sm sm:text-base">Milestones Required</AlertTitle>
                           <AlertDescription className="text-orange-700 text-xs sm:text-sm">
                             <span className="block mb-2">Configure your project milestones to define payment schedules and track progress.</span>
                             <Button
                               size="sm"
                               variant="outline"
                               className="border-orange-400 text-orange-700 hover:bg-orange-100 w-full sm:w-auto text-xs sm:text-sm"
                               onClick={() => handleConfigureMilestones(project)}
                             >
                               <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                               Configure Milestones
                             </Button>
                           </AlertDescription>
                         </div>
                       </Alert>
                     )}
                     
                     {/* Milestone Progress Block Alert */}
                     {(() => {
                       if (!progressStatus.allowed && progressStatus.reason && project.canWork && project.milestones && project.milestones.length > 0) {
                         return (
                           <Alert className="border-blue-300 bg-blue-50">
                             <Info className="h-4 w-4 text-blue-600" />
                             <AlertTitle className="text-blue-800">Progress Update Blocked</AlertTitle>
                              <AlertDescription className="text-blue-700">
                                {progressStatus.reason}
                                {progressStatus.suggestedAction !== 'configure_milestones' && (
                                  <>. Complete the current milestone cycle before updating the next one.</>
                                )}
                              </AlertDescription>
                           </Alert>
                         );
                       }
                       return null;
                     })()}

                     {/* Actions Bar - Mobile Responsive */}
                     <div className="flex flex-col gap-3 pt-3 border-t">
                       <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                         <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                         <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-2 w-full">
                         <Badge variant="secondary" className="w-fit">
                           {project.status}
                         </Badge>
                         <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto w-full sm:w-auto">
                           {project.milestones && project.milestones.length > 0 && (
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleConfigureMilestones(project)}
                               className="w-full sm:w-auto text-xs sm:text-sm"
                             >
                               <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                               <span className="sm:inline">Edit Milestones</span>
                             </Button>
                           )}
                           <Button 
                             size="sm" 
                             onClick={() => {
                               if (progressStatus.allowed) {
                                 handleUpdateProgress(project);
                                 return;
                               }

                               if (progressStatus.suggestedAction === 'configure_milestones') {
                                 toast({
                                   title: 'Milestones Required',
                                   description: progressStatus.reason || 'Please configure milestones to continue.',
                                 });
                                 handleConfigureMilestones(project);
                               }
                             }}
                             className="bg-primary w-full sm:w-auto text-xs sm:text-sm"
                             disabled={!updateButtonEnabled}
                           >
                             <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                             <span>Update Progress</span>
                           </Button>
                         </div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
                 
                 {/* Workforce Hiring Panel - only show when work can start */}
                 {project.canWork && (
                   <WorkforceHiringPanel 
                     projectId={project.id} 
                     projectLocation={project.problem_reports?.location || undefined}
                   />
                 )}
                 </div>
                 );
               })
             )}
           </TabsContent>

          <TabsContent value="completed" className="space-y-4 sm:space-y-6">
            {completedProjects.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="p-6 sm:p-8 text-center">
                  <Award className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No Completed Projects</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">You haven't completed any projects yet. Keep working on your active projects!</p>
                </CardContent>
              </Card>
            ) : (
              completedProjects.map((project) => (
                <Card key={project.id} className="shadow-lg">
                  <CardHeader className="p-3 sm:p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg lg:text-xl mb-2 break-words">{project.title}</CardTitle>
                        <p className="text-sm text-muted-foreground break-words">{project.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-muted-foreground mt-2 gap-2 sm:gap-4">
                          <div className="flex items-center min-w-0">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{project.problem_reports?.location || 'Location not specified'}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                            <span className="whitespace-nowrap">Completed: {new Date(project.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mb-1">
                          {formatCurrency(project.budget || 0)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {project.id.slice(0, 8)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-4">
                    {/* Rating Section */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex items-center flex-wrap gap-2">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                        <span className="font-medium text-sm sm:text-base">Rating: {project.rating?.toFixed(1) || 'N/A'}/5.0</span>
                        {project.rating > 0 && (
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                  i < Math.floor(project.rating)
                                    ? 'text-yellow-400'
                                    : 'text-muted-foreground/30'
                                }`}
                              >
                                ★
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge className="bg-green-100 text-green-800 w-fit">
                        Completed
                      </Badge>
                    </div>

                    {/* Milestones Summary for Completed Projects */}
                    {project.milestones && project.milestones.length > 0 && (
                      <div className="border rounded-lg p-3 sm:p-4 bg-muted/50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center text-sm sm:text-base">
                            <Target className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                            Completed Milestones ({project.milestones.length})
                          </h4>
                          {project.milestones.some(m => m.evidence_urls && m.evidence_urls.length > 0) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewEvidence(project)}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Evidence
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {project.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                              <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                                <CheckCircle className="h-3 w-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs truncate">{milestone.title}</p>
                                <p className="text-xs text-muted-foreground">{milestone.payment_percentage}%</p>
                              </div>
                              {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  <Camera className="h-2.5 w-2.5 mr-0.5" />
                                  {milestone.evidence_urls.length}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Update Progress Modal */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        {selectedProject && (
          <ProgressUpdateForm
            projectId={selectedProject.id}
            projectTitle={selectedProject.title}
            milestones={selectedProject.milestones || []}
            onClose={() => setUpdateModalOpen(false)}
            onSubmitted={handleProgressSubmitted}
          />
        )}
      </Dialog>

      {/* Milestone Configuration Modal */}
      <Dialog open={milestoneModalOpen} onOpenChange={setMilestoneModalOpen}>
        {selectedProject && (
          <MilestoneManagement
            project={{
              id: selectedProject.id,
              title: selectedProject.title,
              budget: selectedProject.budget,
              contractor_id: selectedProject.contractor_id
            }}
            onClose={() => setMilestoneModalOpen(false)}
            onSaved={handleMilestonesSaved}
          />
        )}
      </Dialog>

      {/* Milestone Evidence Viewer Modal */}
      {selectedProject && (
        <MilestoneEvidenceViewer
          milestones={selectedProject.milestones || []}
          projectTitle={selectedProject.title}
          open={evidenceModalOpen}
          onClose={() => setEvidenceModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ContractorProjects;