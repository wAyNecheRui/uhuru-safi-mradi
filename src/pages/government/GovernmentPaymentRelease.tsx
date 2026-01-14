import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import PaymentReleaseManager from '@/components/government/PaymentReleaseManager';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { DollarSign, Loader2, Building2, Wallet, CheckCircle, Clock } from 'lucide-react';
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
    { label: 'Payment Release' }
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

  const handleOpenPayments = (project: ProjectWithEscrow) => {
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
              <DollarSign className="h-8 w-8 text-green-600" />
              Payment Release Management
            </h1>
            <p className="text-gray-600">Release milestone payments to contractors from escrow accounts.</p>
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
                <p className="text-gray-600">There are no active projects with payment schedules.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
            {projects.map((project) => {
                const releasePercentage = project.escrow 
                  ? (project.escrow.released_amount / project.escrow.total_amount) * 100 
                  : 0;
                
                // Check if any milestones are pending citizen verification
                const pendingVerification = project.totalMilestones > 0 && project.verifiedMilestones === 0;

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
                            {project.verifiedMilestones > 0 ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {project.verifiedMilestones} Citizen-Verified (Ready for Payment)
                              </Badge>
                            ) : pendingVerification ? (
                              <Badge className="bg-amber-100 text-amber-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Awaiting Citizen Verification
                              </Badge>
                            ) : null}
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {project.totalMilestones} Milestones
                            </Badge>
                          </div>
                          
                          {/* Citizen Verification Requirement Notice */}
                          {pendingVerification && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 mb-4">
                              <p className="text-sm text-amber-800">
                                <strong>⚠️ Citizen Verification Required:</strong> No milestones have been verified by citizens yet. 
                                Payments cannot be released until citizens verify the completed work on-site.
                              </p>
                            </div>
                          )}

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
                          onClick={() => handleOpenPayments(project)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={!project.escrow || (pendingVerification && project.verifiedMilestones === 0)}
                          title={pendingVerification ? 'Waiting for citizen verification' : ''}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          {pendingVerification && project.verifiedMilestones === 0 
                            ? 'Awaiting Verification' 
                            : 'Manage Payments'}
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

      {/* Payment Release Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedProject && (
          <PaymentReleaseManager
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
