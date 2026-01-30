import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Loader2, Building2, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateProjectProgress } from '@/utils/progressCalculation';

interface Milestone {
  id: string;
  title: string;
  description: string;
  milestone_number: number;
  payment_percentage: number;
  status: string;
  target_completion_date: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  status: string | null;
  contractor_id: string | null;
  milestones?: Milestone[];
}

const GovernmentMilestones = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Milestone Overview' }
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

      // Fetch milestones for each project
      const projectsWithMilestones = await Promise.all(
        (data || []).map(async (project) => {
          const { data: milestones } = await supabase
            .from('project_milestones')
            .select('*')
            .eq('project_id', project.id)
            .order('milestone_number', { ascending: true });
          
          return { ...project, milestones: milestones || [] };
        })
      );

      setProjects(projectsWithMilestones);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMilestoneProgress = (milestones: Milestone[]) => {
    return calculateProjectProgress(milestones);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'verified': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-amber-100 text-amber-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              Milestone Overview
            </h1>
            <p className="text-gray-600">View contractor-configured milestones and track project progress.</p>
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
                <p className="text-gray-600">There are no active projects to view milestones for.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="shadow-lg">
                  <CardContent className="p-6">
                    {/* Project Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-blue-600">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatCurrency(project.budget || 0)}
                          </Badge>
                          <Badge variant="secondary">
                            {project.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Milestone Progress</p>
                        <p className="text-2xl font-bold text-primary">
                          {getMilestoneProgress(project.milestones || [])}%
                        </p>
                      </div>
                    </div>

                    {/* Milestones Display */}
                    {project.milestones && project.milestones.length > 0 ? (
                      <div className="border rounded-lg p-4 bg-slate-50">
                        <h4 className="font-medium mb-3 flex items-center">
                          <Target className="h-4 w-4 mr-2 text-primary" />
                          Contractor-Defined Milestones ({project.milestones.length})
                        </h4>
                        <div className="space-y-3">
                          {project.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStatusColor(milestone.status)}`}>
                                  {milestone.status === 'paid' || milestone.status === 'verified' ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    milestone.milestone_number
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{milestone.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {milestone.payment_percentage}% of budget = {formatCurrency((project.budget || 0) * milestone.payment_percentage / 100)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {milestone.target_completion_date && (
                                  <Badge variant="outline" className="text-xs">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(milestone.target_completion_date).toLocaleDateString()}
                                  </Badge>
                                )}
                                <Badge className={`text-xs ${getStatusColor(milestone.status)}`}>
                                  {milestone.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Overall Progress</span>
                            <span className="font-medium">{getMilestoneProgress(project.milestones)}%</span>
                          </div>
                          <Progress value={getMilestoneProgress(project.milestones)} className="h-2" />
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-6 bg-orange-50 border-orange-200 text-center">
                        <Target className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                        <p className="text-orange-800 font-medium">Awaiting Milestone Configuration</p>
                        <p className="text-sm text-orange-600">The contractor has not yet configured milestones for this project.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentMilestones;
