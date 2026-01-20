import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import MilestonePaymentProgress from '@/components/government/MilestonePaymentProgress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Eye, Loader2, Building2, Wallet, CheckCircle, Clock, Zap, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectWithEscrow {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  status: string | null;
  escrow?: {
    total_amount: number;
    released_amount: number;
    held_amount: number;
    status: string;
  };
  paidMilestones?: number;
  verifiedMilestones?: number;
  totalMilestones?: number;
}

const GovernmentPaymentRelease = () => {
  const [projects, setProjects] = useState<ProjectWithEscrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectWithEscrow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Payment Progress' }
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

      // Fetch escrow and milestone data for each project
      const projectsWithDetails = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Get escrow account
          const { data: escrow } = await supabase
            .from('escrow_accounts')
            .select('*')
            .eq('project_id', project.id)
            .maybeSingle();

          // Get milestone counts
          const { data: milestones } = await supabase
            .from('project_milestones')
            .select('status')
            .eq('project_id', project.id);

          const paidMilestones = milestones?.filter(m => m.status === 'paid').length || 0;
          const verifiedMilestones = milestones?.filter(m => m.status === 'verified').length || 0;
          const totalMilestones = milestones?.length || 0;

          return {
            ...project,
            escrow: escrow ? {
              total_amount: escrow.total_amount,
              released_amount: escrow.released_amount,
              held_amount: escrow.held_amount,
              status: escrow.status
            } : undefined,
            paidMilestones,
            verifiedMilestones,
            totalMilestones
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

  const handleViewProgress = (project: ProjectWithEscrow) => {
    setSelectedProject(project);
    setDialogOpen(true);
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
              <Eye className="h-8 w-8 text-blue-600" />
              Payment Progress Monitoring
            </h1>
            <p className="text-gray-600">Monitor automated milestone payments from escrow to contractors.</p>
          </div>

          {/* Automated Payment Info */}
          <Card className="bg-blue-50 border-blue-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Automated Payment System Active</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Payments are automatically released when milestones receive <strong>2+ citizen verifications</strong> with 
                    a minimum average rating of <strong>3/5 stars</strong>. This page shows the progress of each project's milestone payments.
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    <strong>To fund project escrows:</strong> Visit the <a href="/government/escrow-funding" className="underline hover:text-blue-800">Escrow Funding page</a>
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
                <p className="text-gray-600">There are no active projects with payment schedules.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => {
                const releasePercentage = project.escrow 
                  ? (project.escrow.released_amount / project.escrow.total_amount) * 100 
                  : 0;
                
                const hasVerifiedPending = (project.verifiedMilestones || 0) > 0;
                const isFullyPaid = project.paidMilestones === project.totalMilestones && project.totalMilestones > 0;

                return (
                  <Card key={project.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                          <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.escrow ? (
                              <>
                                <Badge variant="outline" className="text-green-600">
                                  <Wallet className="h-3 w-3 mr-1" />
                                  {formatCurrency(project.escrow.held_amount)} Held
                                </Badge>
                                <Badge className="bg-blue-100 text-blue-800">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatCurrency(project.escrow.released_amount)} Released
                                </Badge>
                              </>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-800">
                                No Escrow Account
                              </Badge>
                            )}
                            
                            {/* Milestone Progress */}
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {project.paidMilestones}/{project.totalMilestones} Paid
                            </Badge>

                            {hasVerifiedPending && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Zap className="h-3 w-3 mr-1" />
                                {project.verifiedMilestones} Processing
                              </Badge>
                            )}

                            {isFullyPaid && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                All Payments Complete
                              </Badge>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {project.escrow && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${releasePercentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          onClick={() => handleViewProgress(project)}
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Progress
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

      {/* Payment Progress Dialog */}
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
