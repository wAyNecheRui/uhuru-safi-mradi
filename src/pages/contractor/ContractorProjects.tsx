import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Clock, DollarSign, MapPin, Calendar, Award, Loader2, Briefcase, 
  Camera, CheckCircle, AlertCircle, Target, Upload, Wallet, Lock, Info, Users, Settings
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ProgressUpdateForm from '@/components/contractor/ProgressUpdateForm';
import MilestoneManagement from '@/components/contractor/MilestoneManagement';
import ProjectLifecycleTracker from '@/components/workflow/ProjectLifecycleTracker';
import WorkforceHiringPanel from '@/components/contractor/WorkforceHiringPanel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EscrowWorkflowService, ProjectEscrowStatus } from '@/services/EscrowWorkflowService';
import { useRealtimeSubscription, REALTIME_PRESETS } from '@/hooks/useRealtimeSubscription';
import { calculateProjectProgress } from '@/utils/progressCalculation';

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

      const activeRaw = projects?.filter(p => 
        p.status === 'in_progress' || p.status === 'planning' || p.status === 'active'
      ) || [];
      
      const completedRaw = projects?.filter(p => p.status === 'completed') || [];

      // Fetch progress, milestones, and escrow for active projects
      const activeWithProgress: ProjectWithExtras[] = [];
      for (const project of activeRaw) {
        const { data: milestones } = await supabase
          .from('project_milestones')
          .select('id, title, description, milestone_number, status, payment_percentage, evidence_urls, submitted_at')
          .eq('project_id', project.id)
          .order('milestone_number', { ascending: true });
        
        // Fetch escrow info
        const { data: escrow } = await supabase
          .from('escrow_accounts')
          .select('*')
          .eq('project_id', project.id)
          .single();

        // Check if contractor can work
        const workStatus = await EscrowWorkflowService.canContractorWork(project.id);
        
        // Calculate progress from milestones using the unified utility
        const calculatedProgress = calculateProjectProgress(milestones || []);
        
        activeWithProgress.push({
          ...project,
          progress: calculatedProgress,
          milestones: milestones || [],
          escrow: escrow || null,
          canWork: workStatus.allowed,
          workBlockedReason: workStatus.allowed ? undefined : workStatus.reason
        } as ProjectWithExtras);
      }

      // Fetch ratings for completed projects and build typed array
      const completedWithRating: ProjectWithExtras[] = [];
      for (const project of completedRaw) {
        const { data: ratings } = await supabase
          .from('contractor_ratings')
          .select('rating')
          .eq('project_id', project.id);
        
        const avgRating = ratings && ratings.length > 0 
          ? ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / ratings.length 
          : 0;
        
        completedWithRating.push({
          ...project,
          rating: avgRating
        } as ProjectWithExtras);
      }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Check if contractor can update progress based on milestone workflow
  const canUpdateProgress = (project: ProjectWithExtras): { allowed: boolean; reason?: string } => {
    // First check if escrow is funded
    if (!project.canWork) {
      return { allowed: false, reason: project.workBlockedReason || 'Awaiting escrow funding' };
    }

    // Check if milestones are configured
    if (!project.milestones || project.milestones.length === 0) {
      return { allowed: false, reason: 'Configure milestones first' };
    }

    // Check milestone statuses - enforce sequential completion
    const milestones = project.milestones.sort((a, b) => a.milestone_number - b.milestone_number);
    
    // Find milestones that are in progress or submitted (awaiting verification/payment)
    const pendingMilestone = milestones.find(m => 
      m.status === 'submitted' || m.status === 'verified' || m.status === 'in_progress'
    );

    if (pendingMilestone) {
      if (pendingMilestone.status === 'submitted') {
        return { 
          allowed: false, 
          reason: `Milestone "${pendingMilestone.title}" is awaiting citizen verification` 
        };
      }
      if (pendingMilestone.status === 'verified') {
        return { 
          allowed: false, 
          reason: `Milestone "${pendingMilestone.title}" is awaiting payment release` 
        };
      }
      if (pendingMilestone.status === 'in_progress') {
        // Allow updating the in_progress milestone
        return { allowed: true };
      }
    }

    // Check if all milestones are completed (paid)
    const allCompleted = milestones.every(m => m.status === 'paid');
    if (allCompleted) {
      return { allowed: false, reason: 'All milestones completed' };
    }

    // Find the next pending milestone to work on
    const nextPending = milestones.find(m => m.status === 'pending');
    if (nextPending) {
      return { allowed: true };
    }

    return { allowed: true };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading projects...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
          <p className="text-gray-600">Track and manage your active and completed government projects.</p>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
            <TabsTrigger value="active" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Active Projects ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Completed Projects ({completedProjects.length})
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
              activeProjects.map((project) => (
                <div key={project.id} className="space-y-4">
                  {/* Project Lifecycle Tracker */}
                  <ProjectLifecycleTracker projectId={project.id} compact />
                  
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

                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                        <p className="text-gray-600">{project.description}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {project.problem_reports?.location || 'Location not specified'}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Started: {new Date(project.created_at || '').toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {formatCurrency(project.budget || 0)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {project.id.slice(0, 8)}
                        </Badge>
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
                      <div className="border rounded-lg p-4 bg-slate-50">
                        <h4 className="font-medium mb-3 flex items-center">
                          <Target className="h-4 w-4 mr-2 text-primary" />
                          Project Milestones
                        </h4>
                        <div className="space-y-3">
                          {project.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  milestone.status === 'paid' ? 'bg-green-100 text-green-700' :
                                  milestone.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                                  milestone.status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                                  milestone.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {milestone.milestone_number}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{milestone.title}</p>
                                  <p className="text-xs text-muted-foreground">{milestone.payment_percentage}% of budget</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    <Camera className="h-3 w-3 mr-1" />
                                    {milestone.evidence_urls.length} photos
                                  </Badge>
                                )}
                                <Badge className={`text-xs ${
                                  milestone.status === 'paid' ? 'bg-green-100 text-green-800' :
                                  milestone.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                                  milestone.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                                  milestone.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
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
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertTitle className="text-orange-800">Milestones Required</AlertTitle>
                        <AlertDescription className="text-orange-700">
                          Configure your project milestones to define payment schedules and track progress.
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-4 border-orange-400 text-orange-700 hover:bg-orange-100"
                            onClick={() => handleConfigureMilestones(project)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Configure Milestones
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Milestone Progress Block Alert */}
                    {(() => {
                      const progressStatus = canUpdateProgress(project);
                      if (!progressStatus.allowed && progressStatus.reason && project.canWork && project.milestones && project.milestones.length > 0) {
                        return (
                          <Alert className="border-blue-300 bg-blue-50">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800">Progress Update Blocked</AlertTitle>
                            <AlertDescription className="text-blue-700">
                              {progressStatus.reason}. Complete the current milestone cycle before updating the next one.
                            </AlertDescription>
                          </Alert>
                        );
                      }
                      return null;
                    })()}

                    {/* Actions Bar */}
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        Last updated: {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {project.status}
                        </Badge>
                        {project.milestones && project.milestones.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConfigureMilestones(project)}
                            disabled={!canUpdateProgress(project).allowed}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Milestones
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateProgress(project)}
                          className="bg-primary"
                          disabled={!canUpdateProgress(project).allowed}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Update Progress
                        </Button>
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
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {completedProjects.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="p-8 text-center">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Projects</h3>
                  <p className="text-gray-600">You haven't completed any projects yet. Keep working on your active projects!</p>
                </CardContent>
              </Card>
            ) : (
              completedProjects.map((project) => (
                <Card key={project.id} className="shadow-lg">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                        <p className="text-gray-600">{project.description}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {project.problem_reports?.location || 'Location not specified'}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Completed: {new Date(project.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {formatCurrency(project.budget || 0)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {project.id.slice(0, 8)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="font-medium">Rating: {project.rating?.toFixed(1) || 'N/A'}/5.0</span>
                        {project.rating > 0 && (
                          <div className="flex ml-2">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(project.rating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      </div>
                    </div>
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
    </div>
  );
};

export default ContractorProjects;