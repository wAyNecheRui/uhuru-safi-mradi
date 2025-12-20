import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import MilestoneManagement from '@/components/government/MilestoneManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Target, Loader2, Building2, DollarSign, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  status: string | null;
  contractor_id: string | null;
  milestoneCount?: number;
}

const GovernmentMilestones = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Milestone Management' }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .in('status', ['planning', 'in_progress', 'active'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch milestone counts for each project
      const projectsWithCounts = await Promise.all(
        (data || []).map(async (project) => {
          const { count } = await supabase
            .from('project_milestones')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);
          
          return { ...project, milestoneCount: count || 0 };
        })
      );

      setProjects(projectsWithCounts);
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

  const handleOpenMilestones = (project: Project) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    setDialogOpen(false);
    fetchProjects();
    toast({
      title: "Milestones Updated",
      description: "Project milestones have been saved successfully."
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              Milestone Management
            </h1>
            <p className="text-gray-600">Configure and manage project milestones and payment schedules.</p>
          </div>

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
                <p className="text-gray-600">There are no active projects to configure milestones for.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-blue-600">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatCurrency(project.budget || 0)}
                          </Badge>
                          <Badge className={project.milestoneCount ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            <Target className="h-3 w-3 mr-1" />
                            {project.milestoneCount || 0} Milestones
                          </Badge>
                          <Badge variant="secondary">
                            {project.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <Button onClick={() => handleOpenMilestones(project)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Milestones
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ResponsiveContainer>
      </main>

      {/* Milestone Management Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedProject && (
          <MilestoneManagement
            project={selectedProject}
            onClose={() => setDialogOpen(false)}
            onSaved={handleSaved}
          />
        )}
      </Dialog>
    </div>
  );
};

export default GovernmentMilestones;
