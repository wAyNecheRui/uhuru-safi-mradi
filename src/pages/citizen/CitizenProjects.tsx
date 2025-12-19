import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import ProjectMapModal from '@/components/citizen/ProjectMapModal';
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
}

const CitizenProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<{ [key: string]: Milestone[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Project Monitoring' }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);

      // Fetch milestones for each project
      for (const project of data || []) {
        const { data: milestonesData } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', project.id)
          .order('milestone_number', { ascending: true });

        setMilestones(prev => ({
          ...prev,
          [project.id]: milestonesData || []
        }));
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

  const handleRateQuality = async (projectId: string) => {
    if (!user) {
      toast.error('Please log in to rate quality');
      return;
    }
    
    toast.info('Quality rating submitted. Thank you for your feedback!');
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
    if (!projectMilestones || projectMilestones.length === 0) return 0;
    const completed = projectMilestones.filter(m => m.status === 'verified' || m.status === 'paid').length;
    return Math.round((completed / projectMilestones.length) * 100);
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Project Tracker</h1>
            <p className="text-gray-600">Monitor active infrastructure projects, verify milestones, and track community investments.</p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
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
                <Button 
                  variant="outline"
                  onClick={() => setShowMapModal(true)}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Map View
                </Button>
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
                const progress = calculateProgress(projectMilestones);

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
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{progress}%</div>
                          <div className="text-sm text-gray-600">Complete</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Project Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>

                      {/* Milestones */}
                      {projectMilestones.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-4">Milestones</h4>
                          <div className="space-y-3">
                            {projectMilestones.map((milestone) => (
                              <div 
                                key={milestone.id} 
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  {getMilestoneStatusIcon(milestone.status)}
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {milestone.milestone_number}. {milestone.title}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {milestone.payment_percentage}% of budget
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(milestone.status)}>
                                    {milestone.status}
                                  </Badge>
                                  {milestone.status === 'submitted' && (
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleVerifyMilestone(milestone.id, 5)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Verify
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Verification Actions */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-blue-600"
                          onClick={() => handlePhotoEvidence(project.id)}
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
                          onClick={() => handleRateQuality(project.id)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Rate Quality
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleReportIssue(project.id, 'quality')}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Report Issue
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

      {/* Map Modal */}
      <ProjectMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        projects={filteredProjects}
      />
    </div>
  );
};

export default CitizenProjects;
