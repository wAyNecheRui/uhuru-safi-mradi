import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Loader2,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  created_at: string;
}

interface ContractorDetails {
  id: string;
  user_id: string;
  company_name: string;
  verified: boolean;
  specialization: string[];
  years_in_business: number;
  registered_counties: string[];
  is_agpo: boolean;
  agpo_category: string | null;
}

interface Rating {
  rating: number;
  review: string | null;
  work_quality: number | null;
  communication: number | null;
  completion_timeliness: number | null;
  project_title: string;
  created_at: string;
}

interface ContractorPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractorId: string;
}

const ContractorPortfolioModal: React.FC<ContractorPortfolioModalProps> = ({
  isOpen,
  onClose,
  contractorId
}) => {
  const [loading, setLoading] = useState(true);
  const [contractor, setContractor] = useState<ContractorDetails | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalValue: 0,
    averageRating: 0
  });

  useEffect(() => {
    if (isOpen && contractorId) {
      fetchContractorData();
    }
  }, [isOpen, contractorId]);

  const fetchContractorData = async () => {
    try {
      setLoading(true);

      // Fetch contractor profile
      const { data: contractorData } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('id', contractorId)
        .single();

      if (contractorData) {
        setContractor(contractorData);

        // Fetch projects for this contractor
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, title, description, status, budget, created_at')
          .eq('contractor_id', contractorData.user_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        setProjects(projectsData || []);

        // Calculate stats from actual projects
        const totalProjects = projectsData?.length || 0;
        const completedProjects = projectsData?.filter(p => 
          p.status === 'completed' || p.status === 'closed'
        ).length || 0;
        const totalValue = projectsData?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;

        // Fetch ratings for this contractor
        const { data: ratingsData } = await supabase
          .from('contractor_ratings')
          .select(`
            rating,
            review,
            work_quality,
            communication,
            completion_timeliness,
            created_at,
            project_id
          `)
          .eq('contractor_id', contractorData.user_id)
          .order('created_at', { ascending: false });

        // Get project titles for ratings
        const ratingsWithTitles: Rating[] = [];
        if (ratingsData && ratingsData.length > 0) {
          for (const rating of ratingsData) {
            const project = projectsData?.find(p => p.id === rating.project_id);
            ratingsWithTitles.push({
              ...rating,
              project_title: project?.title || 'Unknown Project'
            });
          }
        }

        setRatings(ratingsWithTitles);

        // Calculate average rating
        const avgRating = ratingsData && ratingsData.length > 0
          ? ratingsData.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsData.length
          : 0;

        setStats({
          totalProjects,
          completedProjects,
          totalValue,
          averageRating: avgRating
        });
      }
    } catch (error) {
      console.error('Error fetching contractor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'closed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'planning':
        return <Badge className="bg-yellow-100 text-yellow-800">Planning</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Building2 className="h-6 w-6 text-primary" />
            Contractor Portfolio
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : contractor ? (
          <div className="space-y-6">
            {/* Company Header */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {contractor.company_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      {contractor.verified && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {contractor.is_agpo && (
                        <Badge className="bg-purple-100 text-purple-800">
                          AGPO {contractor.agpo_category ? `(${contractor.agpo_category})` : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      {getRatingStars(stats.averageRating)}
                      <span className="ml-2 text-sm text-gray-600">
                        ({stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'No ratings'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {contractor.years_in_business || 0} years in business
                    </span>
                  </div>
                </div>

                {/* Specializations */}
                {contractor.specialization && contractor.specialization.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Specializations:</p>
                    <div className="flex flex-wrap gap-2">
                      {contractor.specialization.map((spec, index) => (
                        <Badge key={index} variant="outline">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Registered Counties */}
                {contractor.registered_counties && contractor.registered_counties.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {contractor.registered_counties.join(', ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
                  <div className="text-xs text-gray-600">Total Projects</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.completedProjects}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-gray-900">
                    {(stats.totalValue / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-gray-600">Total Value (KES)</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalProjects > 0 
                      ? Math.round((stats.completedProjects / stats.totalProjects) * 100) 
                      : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Success Rate</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Projects and Ratings */}
            <Tabs defaultValue="projects" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
                <TabsTrigger value="ratings">Reviews ({ratings.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="space-y-3">
                {projects.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No projects found for this contractor.</p>
                    </CardContent>
                  </Card>
                ) : (
                  projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{project.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(project.budget || 0)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(project.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div>{getStatusBadge(project.status)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="ratings" className="space-y-3">
                {ratings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No reviews yet for this contractor.</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Ratings appear after project milestones are verified by citizens.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  ratings.map((rating, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{rating.project_title}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {getRatingStars(rating.rating || 0)}
                              <span className="ml-2 text-sm font-medium">
                                {rating.rating?.toFixed(1)}/5
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {rating.review && (
                          <p className="text-sm text-gray-600 mt-3">{rating.review}</p>
                        )}
                        {(rating.work_quality || rating.communication || rating.completion_timeliness) && (
                          <div className="flex flex-wrap gap-3 mt-3 text-xs">
                            {rating.work_quality && (
                              <span className="text-gray-600">
                                Quality: {rating.work_quality}/5
                              </span>
                            )}
                            {rating.communication && (
                              <span className="text-gray-600">
                                Communication: {rating.communication}/5
                              </span>
                            )}
                            {rating.completion_timeliness && (
                              <span className="text-gray-600">
                                Timeliness: {rating.completion_timeliness}/5
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-red-400 mb-4" />
            <p className="text-gray-600">Contractor not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContractorPortfolioModal;
