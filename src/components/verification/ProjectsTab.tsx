import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users } from 'lucide-react';
import { VerificationData } from '@/types/contractorVerification';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectsTabProps {
  verificationData: VerificationData;
  formatAmount: (amount: number) => string;
}

interface ProjectRating {
  projectId: string;
  avgRating: number;
  totalVerifications: number;
}

const ProjectsTab = ({ verificationData, formatAmount }: ProjectsTabProps) => {
  const { user } = useAuth();
  const [projectRatings, setProjectRatings] = useState<Record<string, ProjectRating>>({});

  // Fetch real ratings from milestone verifications for each project
  useEffect(() => {
    const fetchProjectRatings = async () => {
      if (!user?.id || !verificationData.recentProjects.length) return;

      try {
        const projectIds = verificationData.recentProjects.map(p => String(p.id));
        
        // Fetch milestone verifications with ratings for these projects
        const { data: verifications } = await supabase
          .from('milestone_verifications')
          .select(`
            verification_notes,
            milestone_id,
            project_milestones!inner(project_id)
          `)
          .eq('verification_status', 'approved');

        // Parse ratings from verification notes
        const ratings: Record<string, { sum: number; count: number }> = {};
        (verifications || []).forEach((v: any) => {
          const projectId = v.project_milestones?.project_id;
          if (!projectId || !projectIds.includes(projectId)) return;

          const notes = v.verification_notes || '';
          const match = notes.match(/Rating:\s*(\d+(?:\.\d+)?)\s*\/\s*5/i);
          if (match) {
            const rating = parseFloat(match[1]);
            if (!ratings[projectId]) {
              ratings[projectId] = { sum: 0, count: 0 };
            }
            ratings[projectId].sum += rating;
            ratings[projectId].count += 1;
          }
        });

        // Convert to final format
        const result: Record<string, ProjectRating> = {};
        Object.entries(ratings).forEach(([projectId, data]) => {
          result[projectId] = {
            projectId,
            avgRating: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : 0,
            totalVerifications: data.count
          };
        });

        setProjectRatings(result);
      } catch (error) {
        console.error('Error fetching project ratings:', error);
      }
    };

    fetchProjectRatings();
  }, [user?.id, verificationData.recentProjects]);

  return (
    <div className="grid gap-6">
      {verificationData.recentProjects.map((project) => {
        const projectId = String(project.id);
        const ratingData = projectRatings[projectId];
        const displayRating = ratingData?.avgRating || project.rating || 0;
        const verificationCount = ratingData?.totalVerifications || 0;

        return (
          <Card key={project.id} className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Project Value: </span>
                      <span className="font-semibold text-green-600">{formatAmount(project.value)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status: </span>
                      <Badge className={project.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    {project.status === 'completed' && (
                      <>
                        <div>
                          <span className="text-gray-600">Completion Date: </span>
                          <span className="font-medium">{project.completionDate}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Citizen Rating: </span>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-semibold">{displayRating.toFixed(1)}/5.0</span>
                            {verificationCount > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {verificationCount} verifications
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {project.status === 'in_progress' && (
                      <>
                        <div>
                          <span className="text-gray-600">Progress: </span>
                          <span className="font-semibold">{project.progress}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Expected Completion: </span>
                          <span className="font-medium">{project.expectedCompletion}</span>
                        </div>
                        {displayRating > 0 && (
                          <div>
                            <span className="text-gray-600">Current Rating: </span>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                              <span className="font-semibold">{displayRating.toFixed(1)}/5.0</span>
                              {verificationCount > 0 && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({verificationCount} verifications)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {project.clientFeedback && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 italic">"{project.clientFeedback}"</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProjectsTab;
