import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import MilestonePaymentProgress from '@/components/government/MilestonePaymentProgress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Eye, Loader2, Building2, CheckCircle, Clock, Zap, Camera, Video, FileText, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectWithProgress {
  id: string;
  title: string;
  description: string;
  status: string | null;
  overallProgress: number;
  totalMilestones: number;
  pendingMilestones: number;
  inProgressMilestones: number;
  submittedMilestones: number;
  verifiedMilestones: number;
  paidMilestones: number;
  totalUpdates: number;
  latestUpdate?: {
    description: string;
    created_at: string;
    has_photos: boolean;
    has_videos: boolean;
  };
}

const GovernmentPaymentRelease = () => {
  const [projects, setProjects] = useState<ProjectWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectWithProgress | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Milestone Progress' }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .in('status', ['in_progress', 'active'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch milestone and progress data for each project
      const projectsWithDetails = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Get milestones with their statuses
          const { data: milestones } = await supabase
            .from('project_milestones')
            .select('status, payment_percentage')
            .eq('project_id', project.id);

          // Get progress updates count and latest update
          const { data: progressUpdates } = await supabase
            .from('project_progress')
            .select('update_description, created_at, photo_urls, video_urls')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const { count: totalUpdates } = await supabase
            .from('project_progress')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          // Calculate milestone counts by status
          const pendingMilestones = milestones?.filter(m => m.status === 'pending').length || 0;
          const inProgressMilestones = milestones?.filter(m => m.status === 'in_progress').length || 0;
          const submittedMilestones = milestones?.filter(m => m.status === 'submitted').length || 0;
          const verifiedMilestones = milestones?.filter(m => m.status === 'verified').length || 0;
          const paidMilestones = milestones?.filter(m => m.status === 'paid').length || 0;
          const totalMilestones = milestones?.length || 0;

          // Calculate overall progress based on milestone statuses
          let overallProgress = 0;
          if (totalMilestones > 0) {
            const completedWeight = (paidMilestones * 100 + verifiedMilestones * 80 + submittedMilestones * 60 + inProgressMilestones * 30) / totalMilestones;
            overallProgress = Math.round(completedWeight);
          }

          const latestUpdate = progressUpdates?.[0] ? {
            description: progressUpdates[0].update_description,
            created_at: progressUpdates[0].created_at,
            has_photos: (progressUpdates[0].photo_urls?.length || 0) > 0,
            has_videos: (progressUpdates[0].video_urls?.length || 0) > 0
          } : undefined;

          return {
            id: project.id,
            title: project.title,
            description: project.description,
            status: project.status,
            overallProgress,
            totalMilestones,
            pendingMilestones,
            inProgressMilestones,
            submittedMilestones,
            verifiedMilestones,
            paidMilestones,
            totalUpdates: totalUpdates || 0,
            latestUpdate
          };
        })
      );

      setProjects(projectsWithDetails);
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
  };

  const handleViewProgress = (project: ProjectWithProgress) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const getStatusColor = (project: ProjectWithProgress) => {
    if (project.paidMilestones === project.totalMilestones && project.totalMilestones > 0) {
      return 'border-l-green-600';
    }
    if (project.submittedMilestones > 0 || project.verifiedMilestones > 0) {
      return 'border-l-blue-600';
    }
    if (project.inProgressMilestones > 0) {
      return 'border-l-yellow-600';
    }
    return 'border-l-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              Milestone Progress Monitoring
            </h1>
            <p className="text-gray-600">View contractor progress updates, photos, videos, and automated payment workflow status.</p>
          </div>

          {/* Workflow Info */}
          <Card className="bg-blue-50 border-blue-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Automated Milestone Verification & Payment</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Contractors submit progress with <strong>photos & videos</strong>. Citizens verify milestones with ratings. 
                    When <strong>2+ citizens verify with 3+ star rating</strong>, payment is automatically released from escrow.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading projects...</p>
              </CardContent>
            </Card>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Projects</h3>
                <p className="text-gray-600">There are no active projects with milestones to monitor.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => {
                const isFullyPaid = project.paidMilestones === project.totalMilestones && project.totalMilestones > 0;
                const hasActiveWork = project.inProgressMilestones > 0 || project.submittedMilestones > 0;
                const hasPendingVerification = project.submittedMilestones > 0 || project.verifiedMilestones > 0;

                return (
                  <Card key={project.id} className={`shadow-lg hover:shadow-xl transition-shadow border-l-4 ${getStatusColor(project)}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{project.title}</h3>
                            {isFullyPaid && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                          
                          {/* Milestone Status Summary */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.pendingMilestones > 0 && (
                              <Badge variant="outline" className="text-gray-600">
                                {project.pendingMilestones} Pending
                              </Badge>
                            )}
                            {project.inProgressMilestones > 0 && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                {project.inProgressMilestones} In Progress
                              </Badge>
                            )}
                            {project.submittedMilestones > 0 && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <FileText className="h-3 w-3 mr-1" />
                                {project.submittedMilestones} Submitted
                              </Badge>
                            )}
                            {project.verifiedMilestones > 0 && (
                              <Badge className="bg-purple-100 text-purple-800">
                                <Zap className="h-3 w-3 mr-1" />
                                {project.verifiedMilestones} Verified - Payment Processing
                              </Badge>
                            )}
                            {project.paidMilestones > 0 && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {project.paidMilestones} Paid
                              </Badge>
                            )}
                          </div>

                          {/* Overall Progress */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Overall Progress</span>
                              <span className="font-medium">{project.overallProgress}%</span>
                            </div>
                            <Progress value={project.overallProgress} className="h-2" />
                          </div>

                          {/* Latest Update Preview */}
                          {project.latestUpdate && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                <span>Latest Update: {formatDate(project.latestUpdate.created_at)}</span>
                                {project.latestUpdate.has_photos && (
                                  <Badge variant="outline" className="text-xs py-0">
                                    <Camera className="h-3 w-3 mr-1" />
                                    Photos
                                  </Badge>
                                )}
                                {project.latestUpdate.has_videos && (
                                  <Badge variant="outline" className="text-xs py-0">
                                    <Video className="h-3 w-3 mr-1" />
                                    Videos
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {project.latestUpdate.description}
                              </p>
                            </div>
                          )}

                          {/* Updates Count */}
                          <div className="mt-3 text-sm text-gray-500">
                            {project.totalUpdates} progress update{project.totalUpdates !== 1 ? 's' : ''} from contractor
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleViewProgress(project)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Progress
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ResponsiveContainer>
      </main>

      {/* Milestone Progress Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedProject && (
          <MilestonePaymentProgress
            projectId={selectedProject.id}
            projectTitle={selectedProject.title}
            onClose={() => {
              setDialogOpen(false);
              fetchProjects();
            }}
          />
        )}
      </Dialog>
    </div>
  );
};

export default GovernmentPaymentRelease;
