import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { Clock, DollarSign, MapPin, Calendar, Award, Loader2, Briefcase } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ProgressUpdateForm from '@/components/contractor/ProgressUpdateForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  milestones?: { id: string; title: string; milestone_number: number; status: string }[];
}

const ContractorProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeProjects, setActiveProjects] = useState<ProjectWithExtras[]>([]);
  const [completedProjects, setCompletedProjects] = useState<ProjectWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithExtras | null>(null);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'My Projects' }
  ];

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
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

      // Fetch progress and milestones for active projects
      const activeWithProgress: ProjectWithExtras[] = [];
      for (const project of activeRaw) {
        const { data: progress } = await supabase
          .from('project_progress')
          .select('progress_percentage')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        const { data: milestones } = await supabase
          .from('project_milestones')
          .select('id, title, milestone_number, status')
          .eq('project_id', project.id)
          .order('milestone_number', { ascending: true });
        
        activeWithProgress.push({
          ...project,
          progress: progress?.progress_percentage || 0,
          milestones: milestones || []
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
  };

  const handleUpdateProgress = (project: ProjectWithExtras) => {
    setSelectedProject(project);
    setUpdateModalOpen(true);
  };

  const handleProgressSubmitted = () => {
    setUpdateModalOpen(false);
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
                            Started: {new Date(project.created_at).toLocaleDateString()}
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
                    <div className="mb-4">
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
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        Last updated: {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {project.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateProgress(project)}
                        >
                          Update Progress
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
            currentProgress={selectedProject.progress || 0}
            milestones={selectedProject.milestones || []}
            onClose={() => setUpdateModalOpen(false)}
            onSubmitted={handleProgressSubmitted}
          />
        )}
      </Dialog>
    </div>
  );
};

export default ContractorProjects;