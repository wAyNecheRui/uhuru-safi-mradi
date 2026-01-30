import React, { useState, useEffect } from 'react';
import { calculateProjectProgress } from '@/utils/progressCalculation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Search, 
  Clock, 
  DollarSign, 
  CheckCircle,
  AlertTriangle,
  Eye,
  Camera,
  QrCode,
  Star,
  TrendingUp,
  ArrowLeft,
  Wallet,
  Target,
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import ProjectMapModal from '@/components/citizen/ProjectMapModal';
import ProjectProgressViewer from '@/components/citizen/ProjectProgressViewer';
import ProjectLifecycleTracker from '@/components/workflow/ProjectLifecycleTracker';
import MilestoneVerificationCard from '@/components/citizen/MilestoneVerificationCard';
import QualityRatingModal from '@/components/citizen/QualityRatingModal';
import ProjectIssueReportModal from '@/components/citizen/ProjectIssueReportModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  contractor_id: string | null;
  created_at: string;
  report_id: string | null;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: string;
  payment_percentage: number;
  milestone_number: number;
  target_completion_date: string | null;
  evidence_urls: string[] | null;
}

interface EscrowInfo {
  held_amount: number;
  released_amount: number;
  total_amount: number;
  status: string;
}

const CitizenProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<{ [key: string]: Milestone[] }>({});
  const [escrowInfo, setEscrowInfo] = useState<{ [key: string]: EscrowInfo }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedProjectForProgress, setSelectedProjectForProgress] = useState<Project | null>(null);
  const [selectedProjectForLifecycle, setSelectedProjectForLifecycle] = useState<Project | null>(null);
  const [selectedProjectForRating, setSelectedProjectForRating] = useState<Project | null>(null);
  const [selectedProjectForIssue, setSelectedProjectForIssue] = useState<Project | null>(null);
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Project Monitoring' }
  ];

  useEffect(() => {
    fetchProjects();
    
    // Subscribe to real-time updates for escrow accounts and milestones
    const escrowChannel = supabase
      .channel('citizen-escrow-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'escrow_accounts' },
        () => {
          console.log('Escrow updated, refreshing data...');
          fetchProjects();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_milestones' },
        () => {
          console.log('Milestone updated, refreshing data...');
          fetchProjects();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_transactions' },
        () => {
          console.log('Payment transaction updated, refreshing data...');
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(escrowChannel);
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);

      // Fetch milestones and escrow info for each project
      for (const project of data || []) {
        const { data: milestonesData } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', project.id)
          .order('milestone_number', { ascending: true });

        // Deduplicate milestones by milestone_number - keep only the first one for each number
        // This prevents showing duplicates when milestones were accidentally created multiple times
        const uniqueMilestones = (milestonesData || []).reduce((acc, milestone) => {
          const existingIndex = acc.findIndex((m: Milestone) => m.milestone_number === milestone.milestone_number);
          if (existingIndex === -1) {
            // No milestone with this number yet, add it
            acc.push(milestone);
          } else {
            // Keep the one with more recent updates or verified/paid status
            const existing = acc[existingIndex];
            const existingPriority = ['paid', 'verified', 'submitted', 'in_progress', 'pending'].indexOf(existing.status);
            const newPriority = ['paid', 'verified', 'submitted', 'in_progress', 'pending'].indexOf(milestone.status);
            if (newPriority < existingPriority || (newPriority === existingPriority && milestone.evidence_urls?.length > 0)) {
              acc[existingIndex] = milestone;
            }
          }
          return acc;
        }, [] as Milestone[]);

        setMilestones(prev => ({
          ...prev,
          [project.id]: uniqueMilestones
        }));

        // Fetch escrow info
        const { data: escrowData } = await supabase
          .from('escrow_accounts')
          .select('*')
          .eq('project_id', project.id)
          .single();

        if (escrowData) {
          setEscrowInfo(prev => ({
            ...prev,
            [project.id]: escrowData
          }));
        }
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMilestone = async (milestoneId: string, rating: number) => {
    if (!user) {
      toast.error('Please log in to verify milestones');
      return;
    }

    try {
      const { error } = await supabase
        .from('milestone_verifications')
        .insert({
          milestone_id: milestoneId,
          verifier_id: user.id,
          verification_status: 'approved',
          verification_notes: `Citizen verification with rating: ${rating}/5`
        });

      if (error) throw error;
      toast.success('Milestone verified successfully!');
    } catch (error: any) {
      console.error('Error verifying milestone:', error);
      toast.error('Failed to verify milestone');
    }
  };

  const handleReportIssue = async (projectId: string, issueType: string) => {
    if (!user) {
      toast.error('Please log in to report issues');
      return;
    }
    
    toast.success(`Quality ${issueType} report submitted for project. Government officials will review this.`);
  };

  const handlePhotoEvidence = (projectId: string) => {
    toast.info('Photo evidence viewer coming soon. Project milestones contain evidence uploads.');
  };

  const handleQRCheckin = async (projectId: string) => {
    if (!user) {
      toast.error('Please log in to check in');
      return;
    }
    
    try {
      await supabase.from('project_progress').insert({
        project_id: projectId,
        updated_by: user.id,
        update_description: 'Citizen site check-in via QR verification',
        progress_percentage: null,
        citizen_verified: true
      });
      toast.success('Site check-in recorded successfully!');
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to record check-in');
    }
  };

  const handleRateQuality = (project: Project) => {
    if (!user) {
      toast.error('Please log in to rate quality');
      return;
    }
    setSelectedProjectForRating(project);
  };

  const handleReportProjectIssue = (project: Project) => {
    if (!user) {
      toast.error('Please log in to report issues');
      return;
    }
    setSelectedProjectForIssue(project);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'submitted': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'in_progress': return <TrendingUp className="h-5 w-5 text-orange-600" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const calculateProgress = (projectMilestones: Milestone[]) => {
    return calculateProjectProgress(projectMilestones);
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Project Tracker</h1>
            <p className="text-gray-600">Monitor active infrastructure projects, verify milestones, and track community investments.</p>
          </div>

          {/* Search Only - No Filter Dropdowns */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search projects by name or description..."
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
                <div className="animate-pulse">Loading projects...</div>
              </CardContent>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
                <p className="text-gray-600">No active projects match your search criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredProjects.map((project) => {
                const projectMilestones = milestones[project.id] || [];
                const projectEscrow = escrowInfo[project.id];
                const progress = calculateProgress(projectMilestones);
                const photosCount = projectMilestones.reduce((sum, m) => sum + (m.evidence_urls?.length || 0), 0);

                return (
                  <Card key={project.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                          <p className="text-gray-600 mb-3">{project.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-blue-600">
                              <DollarSign className="h-3 w-3 mr-1" />
                              KES {(project.budget || 0).toLocaleString()}
                            </Badge>
                            {photosCount > 0 && (
                              <Badge variant="outline" className="text-purple-600">
                                <Camera className="h-3 w-3 mr-1" />
                                {photosCount} photos
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{progress}%</div>
                          <div className="text-sm text-gray-600">Complete</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Escrow & Funding Status */}
                      {projectEscrow && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium flex items-center gap-1">
                              <Wallet className="h-4 w-4" />
                              Escrow Status
                            </span>
                            <Badge className={projectEscrow.held_amount >= projectEscrow.total_amount ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {projectEscrow.held_amount >= projectEscrow.total_amount ? 'Fully Funded' : 'Partial'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Total Budget</span>
                              <p className="font-medium">KES {projectEscrow.total_amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Held</span>
                              <p className="font-medium text-blue-600">KES {projectEscrow.held_amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Released</span>
                              <p className="font-medium text-green-600">KES {projectEscrow.released_amount.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Project Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>

                      {/* Milestones with Verification Cards */}
                      {projectMilestones.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              <Target className="h-5 w-5 text-primary" />
                              Milestones - Verify to Release Payments
                            </h4>
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              {projectMilestones.filter(m => m.status === 'paid').length}/{projectMilestones.length} Paid
                            </Badge>
                          </div>
                          
                          {/* How It Works Info Box */}
                          <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-700">
                            <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              How Citizen Verification Works
                            </h5>
                            <ol className="text-sm text-green-700 dark:text-green-300 space-y-1 list-decimal list-inside">
                              <li>Contractor submits milestone with photo evidence</li>
                              <li><strong>2+ citizens</strong> must verify the work quality</li>
                              <li>Average rating must be <strong>3+ stars</strong></li>
                              <li><strong>Payment automatically releases</strong> from escrow to contractor</li>
                            </ol>
                          </div>

                          <div className="space-y-3">
                            {projectMilestones.map((milestone) => (
                              <MilestoneVerificationCard
                                key={milestone.id}
                                milestone={{
                                  ...milestone,
                                  completion_criteria: null
                                }}
                                projectId={project.id}
                                onVerified={fetchProjects}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Verification Actions */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-primary"
                          onClick={() => setSelectedProjectForLifecycle(
                            selectedProjectForLifecycle?.id === project.id ? null : project
                          )}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Full Lifecycle
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-blue-600"
                          onClick={() => setSelectedProjectForProgress(project)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Photo Evidence
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-600"
                          onClick={() => handleQRCheckin(project.id)}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Check-in
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-orange-600"
                          onClick={() => handleRateQuality(project)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Rate Quality
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleReportProjectIssue(project)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Report Issue
                        </Button>
                      </div>
                      
                      {/* Lifecycle Tracker (Expandable) */}
                      {selectedProjectForLifecycle?.id === project.id && (
                        <div className="mt-6">
                          <ProjectLifecycleTracker projectId={project.id} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ResponsiveContainer>
      </main>

      {/* Map Modal */}
      <ProjectMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        projects={filteredProjects}
      />

      {/* Progress Viewer Modal */}
      {selectedProjectForProgress && (
        <ProjectProgressViewer
          projectId={selectedProjectForProgress.id}
          projectTitle={selectedProjectForProgress.title}
          isOpen={!!selectedProjectForProgress}
          onClose={() => setSelectedProjectForProgress(null)}
        />
      )}

      {/* Quality Rating Modal */}
      {selectedProjectForRating && (
        <QualityRatingModal
          isOpen={!!selectedProjectForRating}
          onClose={() => setSelectedProjectForRating(null)}
          projectId={selectedProjectForRating.id}
          projectTitle={selectedProjectForRating.title}
          onRatingSubmitted={fetchProjects}
        />
      )}

      {/* Project Issue Report Modal */}
      {selectedProjectForIssue && (
        <ProjectIssueReportModal
          isOpen={!!selectedProjectForIssue}
          onClose={() => setSelectedProjectForIssue(null)}
          projectId={selectedProjectForIssue.id}
          projectTitle={selectedProjectForIssue.title}
          onIssueSubmitted={fetchProjects}
        />
      )}
    </div>
  );
};

export default CitizenProjects;
