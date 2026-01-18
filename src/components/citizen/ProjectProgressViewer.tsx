import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Camera, Clock, CheckCircle, AlertCircle, MapPin, 
  Calendar, User, TrendingUp, Image, ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ProgressUpdate {
  id: string;
  update_description: string;
  progress_percentage: number | null;
  photo_urls: string[] | null;
  video_urls: string[] | null;
  created_at: string;
  citizen_verified: boolean;
  supervisor_approved: boolean;
  weather_conditions: string | null;
  workers_present: number | null;
  challenges_faced: string | null;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: string;
  payment_percentage: number;
  milestone_number: number;
  evidence_urls: string[] | null;
  submitted_at: string | null;
  verified_at: string | null;
  completion_criteria: string | null;
}

interface ProjectProgressViewerProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectProgressViewer: React.FC<ProjectProgressViewerProps> = ({
  projectId,
  projectTitle,
  isOpen,
  onClose
}) => {
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'updates' | 'milestones'>('updates');

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProgressData();
    }
  }, [isOpen, projectId]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      // Fetch progress updates
      const { data: updates, error: updatesError } = await supabase
        .from('project_progress')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (updatesError) throw updatesError;
      setProgressUpdates(updates || []);

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('milestone_number', { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Awaiting Verification</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800"><TrendingUp className="h-3 w-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const calculateOverallProgress = () => {
    if (milestones.length === 0) return 0;
    const verified = milestones.filter(m => m.status === 'verified' || m.status === 'paid').length;
    return Math.round((verified / milestones.length) * 100);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="truncate">Progress: {projectTitle}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Overall Progress */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Overall Completion</span>
              <span className="text-2xl font-bold text-primary">{calculateOverallProgress()}%</span>
            </div>
            <Progress value={calculateOverallProgress()} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {milestones.filter(m => m.status === 'verified' || m.status === 'paid').length} of {milestones.length} milestones completed
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'updates' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('updates')}
            >
              Progress Updates ({progressUpdates.length})
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'milestones' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('milestones')}
            >
              Milestones ({milestones.length})
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <ScrollArea className="h-[50vh]">
              {activeTab === 'updates' ? (
                /* Progress Updates */
                <div className="space-y-4">
                  {progressUpdates.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No progress updates yet</p>
                      <p className="text-sm text-muted-foreground">The contractor will post updates as work progresses</p>
                    </div>
                  ) : (
                    progressUpdates.map((update) => (
                      <Card key={update.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(update.created_at), 'PPp')}
                            </div>
                            <div className="flex gap-2">
                              {update.citizen_verified && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Citizen Verified
                                </Badge>
                              )}
                              {update.supervisor_approved && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <User className="h-3 w-3 mr-1" />
                                  Supervisor Approved
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-foreground mb-3">{update.update_description}</p>

                          {update.progress_percentage !== null && (
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span className="font-medium">{update.progress_percentage}%</span>
                              </div>
                              <Progress value={update.progress_percentage} className="h-2" />
                            </div>
                          )}

                          {/* Photo Evidence - Responsive grid */}
                          {update.photo_urls && update.photo_urls.length > 0 && (
                            <div>
                              <p className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-1">
                                <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                                Photo Evidence ({update.photo_urls.length})
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {update.photo_urls.map((url, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedImage(url)}
                                    className="aspect-square rounded-lg overflow-hidden border-2 hover:border-primary transition-colors bg-muted"
                                  >
                                    <img
                                      src={url}
                                      alt={`Evidence ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Additional Info */}
                          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                            {update.workers_present && (
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {update.workers_present} workers on site
                              </span>
                            )}
                            {update.weather_conditions && (
                              <span>Weather: {update.weather_conditions}</span>
                            )}
                          </div>

                          {update.challenges_faced && (
                            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                              <span className="font-medium text-yellow-800 dark:text-yellow-200">Challenges: </span>
                              <span className="text-yellow-700 dark:text-yellow-300">{update.challenges_faced}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                /* Milestones */
                <div className="space-y-4">
                  {milestones.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No milestones defined yet</p>
                    </div>
                  ) : (
                    milestones.map((milestone, index) => (
                      <Card key={milestone.id} className={milestone.status === 'verified' || milestone.status === 'paid' ? 'border-l-4 border-l-green-500' : ''}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                milestone.status === 'verified' || milestone.status === 'paid' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {milestone.milestone_number}
                              </div>
                              <div>
                                <h4 className="font-semibold">{milestone.title}</h4>
                                <p className="text-sm text-muted-foreground">{milestone.payment_percentage}% of budget</p>
                              </div>
                            </div>
                            {getStatusBadge(milestone.status)}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>

                          {milestone.completion_criteria && (
                            <div className="text-sm mb-3">
                              <span className="font-medium">Completion Criteria: </span>
                              <span className="text-muted-foreground">{milestone.completion_criteria}</span>
                            </div>
                          )}

                          {/* Evidence Photos - Responsive grid */}
                          {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-1">
                                <Image className="h-3 w-3 sm:h-4 sm:w-4" />
                                Submitted Evidence ({milestone.evidence_urls.length})
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {milestone.evidence_urls.slice(0, 4).map((url, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedImage(url)}
                                    className="aspect-square rounded-lg overflow-hidden border-2 hover:border-primary transition-colors relative bg-muted"
                                  >
                                    <img
                                      src={url}
                                      alt={`Evidence ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    {idx === 3 && milestone.evidence_urls && milestone.evidence_urls.length > 4 && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-medium text-sm">
                                        +{milestone.evidence_urls.length - 4}
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-3 text-sm text-muted-foreground">
                            {milestone.submitted_at && (
                              <span>Submitted: {format(new Date(milestone.submitted_at), 'PP')}</span>
                            )}
                            {milestone.verified_at && (
                              <span className="text-green-600">Verified: {format(new Date(milestone.verified_at), 'PP')}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Image Viewer - Responsive */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="w-[95vw] max-w-4xl p-2 sm:p-4">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Evidence"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectProgressViewer;
