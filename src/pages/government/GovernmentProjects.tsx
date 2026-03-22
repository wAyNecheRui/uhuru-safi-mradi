import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Building, MapPin, Calendar, Wallet, Users, Loader2, FolderOpen, Target, Award, CheckCircle, LayoutGrid, List } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ProjectLifecycleTracker from '@/components/workflow/ProjectLifecycleTracker';
import ProjectCompletionForm from '@/components/government/ProjectCompletionForm';
import ProjectCategoryCarousel from '@/components/citizen/ProjectCategoryCarousel';
import { supabase } from '@/integrations/supabase/client';
import ContractorBanner from '@/components/contractor/ContractorBanner';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const GovernmentProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [completionProject, setCompletionProject] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'list'>('categories');
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Projects Overview' }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          problem_reports(title, location, photo_urls, category),
          project_milestones(status, payment_percentage)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich projects with escrow data for effective status
      const enriched = [];
      for (const project of (data || [])) {
        const milestones = project.project_milestones || [];
        const allMilestonesPaid = milestones.length > 0 && milestones.every((m: any) => m.status === 'paid');

        let effectiveStatus = project.status;

        if (project.status !== 'completed' && allMilestonesPaid) {
          // Check escrow to confirm completion
          const { data: escrow } = await supabase
            .from('escrow_accounts')
            .select('held_amount, released_amount, total_amount')
            .eq('project_id', project.id)
            .single();

          const escrowCleared = escrow
            ? (escrow.held_amount === 0 && escrow.released_amount >= escrow.total_amount)
            : false;

          if (escrowCleared) {
            effectiveStatus = 'completed';
          }
        }

        enriched.push({ ...project, effectiveStatus });
      }

      setProjects(enriched);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      case 'bidding': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Government Projects</h1>
          <p className="text-gray-600">Monitor and manage all government infrastructure projects across Kenya.</p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end mb-4">
          <div className="flex border rounded-lg overflow-hidden">
            <Button 
              variant={viewMode === 'categories' ? 'default' : 'ghost'} 
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('categories')}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Categories
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No projects found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Projects are created when citizen reports are approved.
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'categories' ? (
            <ProjectCategoryCarousel
              projects={projects.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description,
                status: p.effectiveStatus || p.status || 'planning',
                budget: p.budget || 0,
                contractor_id: p.contractor_id,
                category: p.problem_reports?.category || null,
                progress: 0,
              }))}
              onSelectProject={(projectId) => {
                setViewMode('list');
                setExpandedProject(projectId);
                setTimeout(() => {
                  document.getElementById(`gov-project-${projectId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }}
            />
          ) : (<>
            {projects.map((project) => (
              <Card key={project.id} id={`gov-project-${project.id}`} className="shadow-lg">
                <CardHeader>
                  <ContractorBanner contractorId={project.contractor_id} />
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {project.problem_reports?.location || 'Location not specified'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Started: {new Date(project.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {project.budget 
                          ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(project.budget)
                          : 'TBD'}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 mb-4">{project.description?.substring(0, 200)}...</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        <span className="font-medium">Budget:</span> {project.budget 
                          ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(project.budget)
                          : 'To be determined'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        <span className="font-medium">Budget:</span> {project.budget 
                          ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(project.budget)
                          : 'To be determined'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Badge className={getStatusColor(project.effectiveStatus || project.status)}>
                      {(project.effectiveStatus || project.status)?.replace('_', ' ').toUpperCase() || 'PLANNING'}
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                      >
                        <Target className="h-4 w-4 mr-1" />
                        {expandedProject === project.id ? 'Hide Lifecycle' : 'View Lifecycle'}
                      </Button>
                      {(project.effectiveStatus === 'in_progress' || 
                        (project.effectiveStatus === 'completed' && project.status !== 'completed')) && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setCompletionProject(project)}
                        >
                          <Award className="h-4 w-4 mr-1" />
                          {project.status !== 'completed' && project.effectiveStatus === 'completed' 
                            ? 'Finalize Completion' 
                            : 'Complete Project'}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => navigate('/government/portfolio')}
                      >
                        Manage Project
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Lifecycle Tracker */}
                  {expandedProject === project.id && (
                    <div className="mt-4 pt-4 border-t">
                      <ProjectLifecycleTracker 
                        projectId={project.id}
                        onAction={(step) => {
                          if (step.actionBy === 'government') {
                            if (step.name.includes('Escrow')) {
                              navigate('/government/escrow-funding');
                            } else if (step.name.includes('Payment')) {
                              navigate('/government/payment-release');
                            } else if (step.name.includes('Complete')) {
                              setCompletionProject(project);
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </>)}
        </div>
      </main>

      {/* Project Completion Dialog */}
      {completionProject && (
        <ProjectCompletionForm
          projectId={completionProject.id}
          projectTitle={completionProject.title}
          budget={completionProject.budget}
          open={!!completionProject}
          onOpenChange={(open) => !open && setCompletionProject(null)}
          onCompleted={() => {
            setCompletionProject(null);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
};

export default GovernmentProjects;