import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Loader2, FolderOpen, MapPin, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import PaymentReleaseManager from '@/components/government/PaymentReleaseManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const GovernmentPaymentRelease = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const { toast } = useToast();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Payment Release' }
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
          problem_reports(title, location),
          project_milestones(id, status, payment_percentage, title)
        `)
        .in('status', ['in_progress', 'completed'])
        .not('contractor_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({ title: "Error", description: "Failed to fetch projects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <BreadcrumbNav items={[...breadcrumbItems.slice(0, -1), { label: selectedProject.title }]} />
          <Button variant="outline" className="mb-4" onClick={() => setSelectedProject(null)}>
            ← Back to Projects
          </Button>
          <PaymentReleaseManager
            projectId={selectedProject.id}
            projectTitle={selectedProject.title}
            onClose={() => {
              setSelectedProject(null);
              fetchProjects();
            }}
          />
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Release</h1>
          <p className="text-muted-foreground">Review verified milestones and release payments to contractors.</p>
        </div>

        <div className="space-y-4">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active projects with contractors assigned</p>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => {
              const milestones = project.project_milestones || [];
              const verified = milestones.filter((m: any) => m.status === 'verified' || m.status === 'paid').length;
              return (
                <Card key={project.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <Badge variant="outline">{project.status?.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {project.problem_reports?.location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.problem_reports.location}</span>
                      )}
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Milestones: </span>
                        <span className="font-medium">{verified}/{milestones.length} verified/paid</span>
                        {project.budget && (
                          <span className="ml-4 text-muted-foreground">Budget: <span className="font-medium">KES {project.budget.toLocaleString()}</span></span>
                        )}
                      </div>
                      <Button size="sm" onClick={() => setSelectedProject(project)}>
                        <DollarSign className="h-4 w-4 mr-1" />
                        Manage Payments
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default GovernmentPaymentRelease;
