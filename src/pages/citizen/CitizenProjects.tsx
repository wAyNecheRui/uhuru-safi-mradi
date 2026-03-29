import React, { useState, useEffect, useMemo } from 'react';
import { calculateProjectProgress } from '@/utils/progressCalculation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, Clock, Wallet, CheckCircle, AlertTriangle, Camera, TrendingUp,
  ArrowLeft, Target, ImageOff
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import ProjectMapModal from '@/components/citizen/ProjectMapModal';
import ProjectProgressViewer from '@/components/citizen/ProjectProgressViewer';
import MilestoneVerificationCard from '@/components/citizen/MilestoneVerificationCard';
import QualityRatingModal from '@/components/citizen/QualityRatingModal';
import ProjectIssueReportModal from '@/components/citizen/ProjectIssueReportModal';
import ProjectBrowser from '@/components/projects/ProjectBrowser';
import ContractorBanner from '@/components/contractor/ContractorBanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ProjectCardData } from '@/components/projects/ProjectCard';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  contractor_id: string | null;
  created_at: string;
  report_id: string | null;
  category: string | null;
  photo_urls: string[] | null;
  location: string | null;
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
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedProjectForProgress, setSelectedProjectForProgress] = useState<Project | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [selectedProjectForRating, setSelectedProjectForRating] = useState<Project | null>(null);
  const [selectedProjectForIssue, setSelectedProjectForIssue] = useState<Project | null>(null);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Project Monitoring' }
  ];

  useEffect(() => {
    fetchProjects();
    const channel = supabase
      .channel('citizen-project-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escrow_accounts' }, () => fetchProjects())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_milestones' }, () => fetchProjects())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_transactions' }, () => fetchProjects())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, problem_reports!projects_report_id_fkey(category, photo_urls, location)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projectsWithCategory = (data || []).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status || 'planning',
        budget: p.budget || 0,
        contractor_id: p.contractor_id,
        created_at: p.created_at,
        report_id: p.report_id,
        category: (p.problem_reports as any)?.category || null,
        photo_urls: (p.problem_reports as any)?.photo_urls || null,
        location: (p.problem_reports as any)?.location || null,
      }));
      setProjects(projectsWithCategory);

      for (const project of data || []) {
        const { data: milestonesData } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', project.id)
          .order('milestone_number', { ascending: true });

        const uniqueMilestones = (milestonesData || []).reduce((acc, milestone) => {
          const existingIndex = acc.findIndex((m: Milestone) => m.milestone_number === milestone.milestone_number);
          if (existingIndex === -1) {
            acc.push(milestone);
          } else {
            const existing = acc[existingIndex];
            const existingPriority = ['paid', 'verified', 'submitted', 'in_progress', 'pending'].indexOf(existing.status);
            const newPriority = ['paid', 'verified', 'submitted', 'in_progress', 'pending'].indexOf(milestone.status);
            if (newPriority < existingPriority || (newPriority === existingPriority && milestone.evidence_urls?.length > 0)) {
              acc[existingIndex] = milestone;
            }
          }
          return acc;
        }, [] as Milestone[]);

        setMilestones(prev => ({ ...prev, [project.id]: uniqueMilestones }));

        const { data: escrowData } = await supabase
          .from('escrow_accounts')
          .select('*')
          .eq('project_id', project.id)
          .single();

        if (escrowData) {
          setEscrowInfo(prev => ({ ...prev, [project.id]: escrowData }));
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
    if (!user) { toast.error('Please log in to verify milestones'); return; }
    try {
      const { error } = await supabase.from('milestone_verifications').insert({
        milestone_id: milestoneId,
        verifier_id: user.id,
        verification_status: 'approved',
        verification_notes: `Citizen verification with rating: ${rating}/5`
      });
      if (error) throw error;
      toast.success('Milestone verified successfully!');
    } catch (error: any) {
      toast.error('Failed to verify milestone');
    }
  };

  const handleReportProjectIssue = (project: Project) => {
    if (!user) { toast.error('Please log in to report issues'); return; }
    setSelectedProjectForIssue(project);
  };

  const calculateProgress = (projectMilestones: Milestone[]) => calculateProjectProgress(projectMilestones);

  // Transform to ProjectCardData for the browser
  const cardData: ProjectCardData[] = useMemo(() =>
    projects.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      budget: p.budget,
      progress: calculateProgress(milestones[p.id] || []),
      photo_url: p.photo_urls?.[0] || null,
      location: p.location,
      category: p.category,
      contractor_id: p.contractor_id,
      created_at: p.created_at,
    })),
    [projects, milestones]
  );

  // When a project is selected from browser, show detail
  const handleSelectProject = (projectId: string) => {
    setExpandedProjectId(projectId);
    setTimeout(() => {
      document.getElementById(`project-detail-${projectId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const expandedProject = expandedProjectId ? projects.find(p => p.id === expandedProjectId) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />

          {/* Project Browser */}
          <div className="mt-4">
            <ProjectBrowser
              projects={cardData}
              onSelectProject={handleSelectProject}
              loading={loading}
              title="Live Project Tracker"
              subtitle="Monitor active infrastructure projects, verify milestones, and track community investments."
            />
          </div>

          {/* Expanded Project Detail */}
          {expandedProject && (
            <div id={`project-detail-${expandedProject.id}`} className="mt-6 animate-fade-in">
              <Card className="overflow-hidden border-primary/20 shadow-card-hover">
                {/* Hero */}
                {expandedProject.photo_urls?.[0] && (
                  <div className="w-full h-[200px] sm:h-[280px] overflow-hidden">
                    <img src={expandedProject.photo_urls[0]} alt={expandedProject.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Button variant="ghost" size="sm" onClick={() => setExpandedProjectId(null)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back to list
                    </Button>
                  </div>
                  <ContractorBanner contractorId={expandedProject.contractor_id} />
                  <CardTitle className="text-xl">{expandedProject.title}</CardTitle>
                  <p className="text-muted-foreground text-sm">{expandedProject.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline"><Wallet className="h-3 w-3 mr-1" />KES {(expandedProject.budget || 0).toLocaleString()}</Badge>
                    {expandedProject.location && (
                      <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{expandedProject.location}</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Escrow */}
                  {escrowInfo[expandedProject.id] && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          <Wallet className="h-4 w-4 text-primary" /> Escrow Status
                        </span>
                        <Badge variant={escrowInfo[expandedProject.id].held_amount >= escrowInfo[expandedProject.id].total_amount ? 'success' : 'warning'}>
                          {escrowInfo[expandedProject.id].held_amount >= escrowInfo[expandedProject.id].total_amount ? 'Fully Funded' : 'Partial'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div><span className="text-muted-foreground">Budget</span><p className="font-medium">KES {escrowInfo[expandedProject.id].total_amount.toLocaleString()}</p></div>
                        <div><span className="text-muted-foreground">Held</span><p className="font-medium text-primary">KES {escrowInfo[expandedProject.id].held_amount.toLocaleString()}</p></div>
                        <div><span className="text-muted-foreground">Released</span><p className="font-medium text-green-700">KES {escrowInfo[expandedProject.id].released_amount.toLocaleString()}</p></div>
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Project Progress</span>
                      <span className="font-semibold text-foreground">{calculateProgress(milestones[expandedProject.id] || [])}%</span>
                    </div>
                    <Progress value={calculateProgress(milestones[expandedProject.id] || [])} className="h-2" />
                  </div>

                  {/* Milestones */}
                  {(milestones[expandedProject.id] || []).length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" /> Milestones
                        </h4>
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          {(milestones[expandedProject.id] || []).filter(m => m.status === 'paid').length}/{(milestones[expandedProject.id] || []).length} Paid
                        </Badge>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 mb-4">
                        <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4" /> How Citizen Verification Works
                        </h5>
                        <ol className="text-xs text-green-700 dark:text-green-300 space-y-1 list-decimal list-inside">
                          <li>Contractor submits milestone with photo evidence</li>
                          <li><strong>2+ citizens</strong> must verify the work quality</li>
                          <li>Average rating must be <strong>3+ stars</strong></li>
                          <li><strong>Payment automatically releases</strong> from escrow</li>
                        </ol>
                      </div>
                      <div className="space-y-3">
                        {(milestones[expandedProject.id] || []).map(milestone => (
                          <MilestoneVerificationCard
                            key={milestone.id}
                            milestone={{ ...milestone, completion_criteria: null }}
                            projectId={expandedProject.id}
                            onVerified={fetchProjects}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleReportProjectIssue(expandedProject)}>
                      <AlertTriangle className="h-4 w-4 mr-2" /> Report Issue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ResponsiveContainer>
      </main>

      <ProjectMapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)} projects={projects} />
      {selectedProjectForProgress && (
        <ProjectProgressViewer projectId={selectedProjectForProgress.id} projectTitle={selectedProjectForProgress.title} isOpen={!!selectedProjectForProgress} onClose={() => setSelectedProjectForProgress(null)} />
      )}
      {selectedProjectForRating && (
        <QualityRatingModal isOpen={!!selectedProjectForRating} onClose={() => setSelectedProjectForRating(null)} projectId={selectedProjectForRating.id} projectTitle={selectedProjectForRating.title} onRatingSubmitted={fetchProjects} />
      )}
      {selectedProjectForIssue && (
        <ProjectIssueReportModal isOpen={!!selectedProjectForIssue} onClose={() => setSelectedProjectForIssue(null)} projectId={selectedProjectForIssue.id} projectTitle={selectedProjectForIssue.title} onIssueSubmitted={fetchProjects} />
      )}
    </div>
  );
};

export default CitizenProjects;
