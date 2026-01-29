import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import MilestonePaymentProgress from '@/components/government/MilestonePaymentProgress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, Loader2, Building2, CheckCircle, Clock, Zap, Camera, Video, 
  FileText, Activity, Search, DollarSign, TrendingUp, AlertTriangle, MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateProjectProgress } from '@/utils/progressCalculation';

interface ProjectWithProgress {
  id: string;
  title: string;
  description: string;
  status: string | null;
  budget: number | null;
  location: string | null;
  priority: string | null;
  overallProgress: number;
  totalMilestones: number;
  pendingMilestones: number;
  inProgressMilestones: number;
  submittedMilestones: number;
  verifiedMilestones: number;
  paidMilestones: number;
  totalUpdates: number;
  escrowFunded: number;
  escrowReleased: number;
  latestUpdate?: {
    description: string;
    created_at: string;
    has_photos: boolean;
    has_videos: boolean;
  };
}

const GovernmentPortfolio = () => {
  const [projects, setProjects] = useState<ProjectWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectWithProgress | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalActive: 0,
    totalBudget: 0,
    totalCompleted: 0,
    awaitingVerification: 0
  });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Project Portfolio' }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          *,
          problem_reports(location, priority)
        `)
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

          // Get escrow data
          const { data: escrowData } = await supabase
            .from('escrow_accounts')
            .select('held_amount, released_amount')
            .eq('project_id', project.id)
            .maybeSingle();

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

          // Calculate overall progress using unified utility
          const overallProgress = calculateProjectProgress(milestones || []);

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
            budget: project.budget,
            location: project.problem_reports?.location || null,
            priority: project.problem_reports?.priority || null,
            overallProgress,
            totalMilestones,
            pendingMilestones,
            inProgressMilestones,
            submittedMilestones,
            verifiedMilestones,
            paidMilestones,
            totalUpdates: totalUpdates || 0,
            escrowFunded: (escrowData?.held_amount || 0) + (escrowData?.released_amount || 0),
            escrowReleased: escrowData?.released_amount || 0,
            latestUpdate
          };
        })
      );

      setProjects(projectsWithDetails);

      // Calculate stats
      const active = projectsWithDetails.filter(p => ['in_progress', 'active'].includes(p.status || ''));
      const completed = projectsWithDetails.filter(p => p.paidMilestones === p.totalMilestones && p.totalMilestones > 0);
      const awaitingVerification = projectsWithDetails.filter(p => p.submittedMilestones > 0 || p.verifiedMilestones > 0);
      const totalBudget = projectsWithDetails.reduce((sum, p) => sum + (p.budget || 0), 0);

      setStats({
        totalActive: active.length,
        totalBudget,
        totalCompleted: completed.length,
        awaitingVerification: awaitingVerification.length
      });
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(amount);
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
              Project Portfolio Overview
            </h1>
            <p className="text-gray-600">Monitor all projects, contractor progress, and automated payment workflow status.</p>
          </div>

          {/* Quick Stats Panel */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Projects</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalActive}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Budget</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalBudget)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Awaiting Verification</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.awaitingVerification}</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-emerald-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.totalCompleted}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>
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

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search projects by name or location..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
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
          ) : filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No projects match your search criteria.' : 'There are no projects to display.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredProjects.map((project) => {
                const isFullyPaid = project.paidMilestones === project.totalMilestones && project.totalMilestones > 0;

                return (
                  <Card key={project.id} className={`shadow-lg hover:shadow-xl transition-shadow border-l-4 ${getStatusColor(project)}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold">{project.title}</h3>
                            {isFullyPaid && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </Badge>
                            )}
                            {project.priority && (
                              <Badge className={getPriorityColor(project.priority)}>
                                {project.priority}
                              </Badge>
                            )}
                          </div>
                          
                          {project.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                              <MapPin className="h-4 w-4" />
                              {project.location}
                            </div>
                          )}
                          
                          <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                          
                          {/* Budget & Escrow Info */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                            <div className="text-center p-2 bg-blue-50 rounded-lg">
                              <p className="text-lg font-bold text-blue-600">{formatCurrency(project.budget || 0)}</p>
                              <p className="text-xs text-blue-700">Budget</p>
                            </div>
                            <div className="text-center p-2 bg-yellow-50 rounded-lg">
                              <p className="text-lg font-bold text-yellow-600">{formatCurrency(project.escrowFunded)}</p>
                              <p className="text-xs text-yellow-700">Funded</p>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded-lg">
                              <p className="text-lg font-bold text-green-600">{formatCurrency(project.escrowReleased)}</p>
                              <p className="text-xs text-green-700">Released</p>
                            </div>
                          </div>
                          
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

export default GovernmentPortfolio;
