import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, MapPin, Calendar, Wallet, Loader2, FolderOpen, Target, Award } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ProjectLifecycleTracker from '@/components/workflow/ProjectLifecycleTracker';
import ProjectCompletionForm from '@/components/government/ProjectCompletionForm';
import ProjectBrowser from '@/components/projects/ProjectBrowser';
import ContractorBanner from '@/components/contractor/ContractorBanner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { ProjectCardData } from '@/components/projects/ProjectCard';

const GovernmentProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [completionProject, setCompletionProject] = useState<any | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Projects Overview' }
  ];

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, problem_reports(title, location, photo_urls, category), project_milestones(status, payment_percentage)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched = [];
      for (const project of (data || [])) {
        const ms = project.project_milestones || [];
        const allPaid = ms.length > 0 && ms.every((m: any) => m.status === 'paid');
        let effectiveStatus = project.status;
        if (project.status !== 'completed' && allPaid) {
          const { data: escrow } = await supabase.from('escrow_accounts').select('held_amount, released_amount, total_amount').eq('project_id', project.id).single();
          if (escrow && escrow.held_amount === 0 && escrow.released_amount >= escrow.total_amount) effectiveStatus = 'completed';
        }
        enriched.push({ ...project, effectiveStatus });
      }
      setProjects(enriched);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch projects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const cardData: ProjectCardData[] = useMemo(() =>
    projects.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.effectiveStatus || p.status || 'planning',
      budget: p.budget,
      progress: 0,
      photo_url: p.problem_reports?.photo_urls?.[0] || null,
      location: p.problem_reports?.location || null,
      category: p.problem_reports?.category || null,
      contractor_id: p.contractor_id,
      created_at: p.created_at,
    })),
    [projects]
  );

  const handleSelectProject = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
    setTimeout(() => {
      document.getElementById(`gov-detail-${projectId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const selectedProject = expandedProject ? projects.find((p: any) => p.id === expandedProject) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <BreadcrumbNav items={breadcrumbItems} />

        <div className="mt-4">
          <ProjectBrowser
            projects={cardData}
            onSelectProject={handleSelectProject}
            loading={false}
            title="Government Projects"
            subtitle="Monitor and manage all government infrastructure projects across Kenya."
            headerActions={
              <Button size="sm" onClick={() => navigate('/government/portfolio')}>
                <Building className="h-4 w-4 mr-1" /> Portfolio View
              </Button>
            }
          />
        </div>

        {/* Expanded Detail */}
        {selectedProject && (
          <Card id={`gov-detail-${selectedProject.id}`} className="mt-6 overflow-hidden border-primary/20 shadow-card-hover animate-fade-in">
            {selectedProject.problem_reports?.photo_urls?.[0] && (
              <div className="w-full h-[200px] sm:h-[240px] overflow-hidden">
                <img src={selectedProject.problem_reports.photo_urls[0]} alt={selectedProject.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            <CardHeader>
              <ContractorBanner contractorId={selectedProject.contractor_id} />
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl mb-2">{selectedProject.title}</CardTitle>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{selectedProject.problem_reports?.location || 'Not specified'}</span>
                    <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" />Started: {new Date(selectedProject.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">
                    {selectedProject.budget ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(selectedProject.budget) : 'TBD'}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">{selectedProject.description?.substring(0, 200)}...</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setExpandedProject(null)}>Hide Details</Button>
                {(selectedProject.effectiveStatus === 'in_progress' || (selectedProject.effectiveStatus === 'completed' && selectedProject.status !== 'completed')) && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setCompletionProject(selectedProject)}>
                    <Award className="h-4 w-4 mr-1" />
                    {selectedProject.status !== 'completed' && selectedProject.effectiveStatus === 'completed' ? 'Finalize' : 'Complete'}
                  </Button>
                )}
                <Button size="sm" onClick={() => navigate('/government/portfolio')}>Manage</Button>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <ProjectLifecycleTracker
                  projectId={selectedProject.id}
                  onAction={(step) => {
                    if (step.actionBy === 'government') {
                      if (step.name.includes('Escrow')) navigate('/government/escrow-funding');
                      else if (step.name.includes('Payment')) navigate('/government/payment-release');
                      else if (step.name.includes('Complete')) setCompletionProject(selectedProject);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {completionProject && (
        <ProjectCompletionForm
          projectId={completionProject.id}
          projectTitle={completionProject.title}
          budget={completionProject.budget}
          open={!!completionProject}
          onOpenChange={(open) => !open && setCompletionProject(null)}
          onCompleted={() => { setCompletionProject(null); fetchProjects(); }}
        />
      )}
    </div>
  );
};

export default GovernmentProjects;
