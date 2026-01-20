import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, Clock, AlertTriangle, 
  Loader2, Lock, Eye, Camera, Users, Zap, RefreshCw,
  MapPin, CloudRain, HardHat, Play, Image, Video, FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateProjectProgress } from '@/utils/progressCalculation';

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
  target_completion_date: string | null;
}

interface ProgressUpdate {
  id: string;
  project_id: string;
  milestone_id: string | null;
  progress_percentage: number | null;
  update_description: string;
  photo_urls: string[] | null;
  video_urls: string[] | null;
  challenges_faced: string | null;
  workers_present: number | null;
  weather_conditions: string | null;
  created_at: string;
  updated_by: string;
  supervisor_approved: boolean | null;
  citizen_verified: boolean | null;
}

interface MilestoneVerification {
  id: string;
  milestone_id: string;
  verifier_id: string;
  verification_status: string;
  verified_at: string;
  verification_notes: string | null;
}

interface MilestonePaymentProgressProps {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

const MilestonePaymentProgress: React.FC<MilestonePaymentProgressProps> = ({ 
  projectId, 
  projectTitle, 
  onClose 
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [verifications, setVerifications] = useState<Record<string, MilestoneVerification[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<ProgressUpdate | null>(null);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for updates
    const channel = supabase
      .channel('milestone_workflow_progress')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_milestones', filter: `project_id=eq.${projectId}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_progress', filter: `project_id=eq.${projectId}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'milestone_verifications' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const fetchData = async () => {
    try {
      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('milestone_number', { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);

      // Fetch progress updates
      const { data: progressData, error: progressError } = await supabase
        .from('project_progress')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (progressError) throw progressError;
      setProgressUpdates(progressData || []);

      // Calculate overall progress from milestone statuses using unified utility
      if (milestonesData && milestonesData.length > 0) {
        const calculatedProgress = calculateProjectProgress(milestonesData);
        setOverallProgress(calculatedProgress);
      }

      // Fetch verifications for each milestone
      if (milestonesData && milestonesData.length > 0) {
        const milestoneIds = milestonesData.map(m => m.id);
        const { data: verificationsData } = await supabase
          .from('milestone_verifications')
          .select('*')
          .in('milestone_id', milestoneIds)
          .order('verified_at', { ascending: false });

        const groupedVerifications: Record<string, MilestoneVerification[]> = {};
        verificationsData?.forEach(v => {
          if (!groupedVerifications[v.milestone_id]) {
            groupedVerifications[v.milestone_id] = [];
          }
          groupedVerifications[v.milestone_id].push(v);
        });
        setVerifications(groupedVerifications);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed & Paid
          </Badge>
        );
      case 'verified':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Zap className="h-3 w-3 mr-1" />
            Verified - Auto-Payment Processing
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Submitted - Awaiting Verification
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <HardHat className="h-3 w-3 mr-1" />
            Work In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Lock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getVerificationProgress = (milestoneId: string) => {
    const milestoneVerifications = verifications[milestoneId] || [];
    const approvedCount = milestoneVerifications.filter(v => v.verification_status === 'approved').length;
    return { approved: approvedCount, required: 2 };
  };

  const getMilestoneUpdates = (milestoneId: string) => {
    return progressUpdates.filter(u => u.milestone_id === milestoneId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return (
      <DialogContent className="max-w-5xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DialogContent>
    );
  }

  const completedMilestones = milestones.filter(m => m.status === 'paid').length;

  return (
    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-600" />
          Project Workflow Progress
        </DialogTitle>
        <DialogDescription>{projectTitle}</DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Overall Project Progress */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <HardHat className="h-5 w-5 text-blue-600" />
                Overall Project Progress
              </h4>
              <Button variant="ghost" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold text-blue-700">{overallProgress}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Milestones Completed</p>
                <p className="text-2xl font-bold text-green-700">{completedMilestones}/{milestones.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Progress Updates</p>
                <p className="text-2xl font-bold text-orange-700">{progressUpdates.length}</p>
              </div>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Automated Workflow Notice */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900">Automated Payment Workflow</h4>
                <p className="text-sm text-green-700 mt-1">
                  Payments are automatically released when milestones receive <strong>2+ citizen verifications</strong> with 
                  a minimum rating of <strong>3/5 stars</strong>. Monitor progress updates and verification status below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestone Workflow Status */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Milestone Progress & Updates
          </h3>
          
          {milestones.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No milestones configured for this project</p>
              </CardContent>
            </Card>
          ) : (
            milestones.map((milestone) => {
              const milestoneUpdates = getMilestoneUpdates(milestone.id);
              const verificationProgress = getVerificationProgress(milestone.id);
              const isPaid = milestone.status === 'paid';
              const isVerified = milestone.status === 'verified';
              const isSubmitted = milestone.status === 'submitted';
              const isInProgress = milestone.status === 'in_progress';

              return (
                <Card 
                  key={milestone.id} 
                  className={`
                    ${isPaid ? 'bg-green-50 border-green-200' : ''}
                    ${isVerified ? 'bg-blue-50 border-blue-200' : ''}
                    ${isSubmitted ? 'bg-yellow-50 border-yellow-200' : ''}
                    ${isInProgress ? 'bg-orange-50 border-orange-200' : ''}
                  `}
                >
                  <CardContent className="p-4">
                    {/* Milestone Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono">M{milestone.milestone_number}</Badge>
                          <span className="font-semibold text-lg">{milestone.title}</span>
                          {getStatusBadge(milestone.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        {milestone.target_completion_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Target: {new Date(milestone.target_completion_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Payment Weight</p>
                        <p className="text-lg font-bold text-green-700">{milestone.payment_percentage}%</p>
                      </div>
                    </div>

                    {/* Verification Progress */}
                    {(isSubmitted || isVerified) && !isPaid && (
                      <div className="bg-white rounded-lg p-3 border mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Citizen Verification Status</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={(verificationProgress.approved / verificationProgress.required) * 100} 
                            className="flex-1 h-2"
                          />
                          <span className="text-sm font-medium">
                            {verificationProgress.approved}/{verificationProgress.required}
                          </span>
                        </div>
                        {verificationProgress.approved >= verificationProgress.required ? (
                          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Threshold met - automatic payment processing
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">
                            Waiting for {verificationProgress.required - verificationProgress.approved} more citizen verification(s)
                          </p>
                        )}
                      </div>
                    )}

                    {/* Completed Badge */}
                    {isPaid && (
                      <div className="bg-green-100 rounded-lg p-3 border border-green-200 mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">
                            Milestone completed and payment released automatically
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Contractor Progress Updates */}
                    {milestoneUpdates.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Contractor Updates ({milestoneUpdates.length})
                        </h5>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {milestoneUpdates.map((update) => (
                            <div 
                              key={update.id}
                              className="bg-white rounded-lg p-3 border hover:border-blue-300 transition-colors"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <p className="text-sm">{update.update_description}</p>
                                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDate(update.created_at)}
                                    </span>
                                    {update.progress_percentage !== null && (
                                      <Badge variant="outline" className="text-xs">
                                        {update.progress_percentage}% complete
                                      </Badge>
                                    )}
                                    {update.workers_present && (
                                      <span className="flex items-center gap-1">
                                        <HardHat className="h-3 w-3" />
                                        {update.workers_present} workers
                                      </span>
                                    )}
                                    {update.weather_conditions && (
                                      <span className="flex items-center gap-1">
                                        <CloudRain className="h-3 w-3" />
                                        {update.weather_conditions}
                                      </span>
                                    )}
                                  </div>
                                  {update.challenges_faced && (
                                    <p className="text-xs text-orange-600 mt-2 flex items-start gap-1">
                                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      {update.challenges_faced}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Media Indicators */}
                                <div className="flex gap-2">
                                  {(update.photo_urls?.length || update.video_urls?.length) ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUpdate(update);
                                        setShowMediaDialog(true);
                                      }}
                                    >
                                      {update.photo_urls?.length ? (
                                        <span className="flex items-center gap-1">
                                          <Image className="h-4 w-4" />
                                          {update.photo_urls.length}
                                        </span>
                                      ) : null}
                                      {update.video_urls?.length ? (
                                        <span className="flex items-center gap-1 ml-1">
                                          <Video className="h-4 w-4" />
                                          {update.video_urls.length}
                                        </span>
                                      ) : null}
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Updates Message */}
                    {milestoneUpdates.length === 0 && !isPaid && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No progress updates submitted for this milestone yet
                      </div>
                    )}

                    {/* Milestone Evidence */}
                    {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Submitted Evidence ({milestone.evidence_urls.length} files)
                        </h5>
                        <div className="flex gap-2 flex-wrap">
                          {milestone.evidence_urls.slice(0, 4).map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-16 h-16 rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
                            >
                              <img src={url} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                          {milestone.evidence_urls.length > 4 && (
                            <div className="w-16 h-16 rounded-lg border bg-gray-100 flex items-center justify-center text-sm text-gray-600">
                              +{milestone.evidence_urls.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* General Progress Updates (not linked to milestones) */}
        {progressUpdates.filter(u => !u.milestone_id).length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              General Project Updates
            </h3>
            <div className="space-y-2">
              {progressUpdates.filter(u => !u.milestone_id).map((update) => (
                <Card key={update.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-sm">{update.update_description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(update.created_at)}
                          </span>
                          {update.progress_percentage !== null && (
                            <Badge variant="outline" className="text-xs">
                              {update.progress_percentage}% complete
                            </Badge>
                          )}
                        </div>
                      </div>
                      {(update.photo_urls?.length || update.video_urls?.length) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUpdate(update);
                            setShowMediaDialog(true);
                          }}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          View Media
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>

      {/* Media Viewer Dialog */}
      <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Progress Update Media</DialogTitle>
            <DialogDescription>
              {selectedUpdate && formatDate(selectedUpdate.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedUpdate && (
            <div className="space-y-4 py-4">
              {/* Photos */}
              {selectedUpdate.photo_urls && selectedUpdate.photo_urls.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Photos ({selectedUpdate.photo_urls.length})
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUpdate.photo_urls.map((url, index) => (
                      <a 
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video rounded-lg overflow-hidden border hover:shadow-lg transition-shadow"
                      >
                        <img 
                          src={url} 
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {selectedUpdate.video_urls && selectedUpdate.video_urls.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Videos ({selectedUpdate.video_urls.length})
                  </h5>
                  <div className="space-y-3">
                    {selectedUpdate.video_urls.map((url, index) => (
                      <div key={index} className="rounded-lg overflow-hidden border">
                        <video 
                          src={url} 
                          controls
                          className="w-full"
                        >
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Play className="h-8 w-8" />
                            View Video {index + 1}
                          </a>
                        </video>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Update Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium mb-2">Update Details</h5>
                <p className="text-sm text-gray-700">{selectedUpdate.update_description}</p>
                {selectedUpdate.challenges_faced && (
                  <div className="mt-3 p-2 bg-orange-50 rounded border border-orange-200">
                    <p className="text-xs text-orange-800 font-medium">Challenges Faced:</p>
                    <p className="text-sm text-orange-700">{selectedUpdate.challenges_faced}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMediaDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContent>
  );
};

export default MilestonePaymentProgress;
