import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Camera,
  Thermometer,
  Wrench,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProjectProgress {
  id: string;
  project_id: string;
  milestone_id?: string;
  progress_percentage: number;
  update_description: string;
  photo_urls?: string[];
  video_urls?: string[];
  gps_coordinates?: string;
  weather_conditions?: string;
  workers_present?: number;
  equipment_used?: string[];
  challenges_faced?: string;
  updated_by: string;
  supervisor_approved: boolean;
  citizen_verified: boolean;
  created_at: string;
  project_title?: string;
  milestone_title?: string;
  updater_name?: string;
}

interface QualityCheckpoint {
  id: string;
  project_id: string;
  checkpoint_name: string;
  inspection_criteria: string;
  inspector_type: string;
  inspector_id: string;
  inspection_date: string;
  passed?: boolean;
  score?: number;
  findings?: string;
  recommendations?: string;
  photo_evidence?: string[];
  follow_up_required: boolean;
  inspector_name?: string;
  projects?: { title: string };
}

const RealTimeTracking = () => {
  const { user } = useAuth();
  const [progressUpdates, setProgressUpdates] = useState<ProjectProgress[]>([]);
  const [qualityCheckpoints, setQualityCheckpoints] = useState<QualityCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progress');

  useEffect(() => {
    fetchTrackingData();

    // Set up real-time subscriptions
    const progressChannel = supabase
      .channel('project-progress-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_progress'
        },
        (payload) => {
          console.log('Progress update received:', payload);
          fetchTrackingData();
        }
      )
      .subscribe();

    const checkpointsChannel = supabase
      .channel('quality-checkpoints-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quality_checkpoints'
        },
        (payload) => {
          console.log('Quality checkpoint update received:', payload);
          fetchTrackingData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(checkpointsChannel);
    };
  }, []);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);

      // Fetch project progress updates
      const { data: progressData, error: progressError } = await supabase
        .from('project_progress')
        .select(`
          *,
          projects(title),
          project_milestones(title)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (progressError) throw progressError;

      // Fetch quality checkpoints
      const { data: checkpointsData, error: checkpointsError } = await supabase
        .from('quality_checkpoints')
        .select(`
          *,
          projects(title)
        `)
        .order('inspection_date', { ascending: false })
        .limit(15);

      if (checkpointsError) throw checkpointsError;

      // Transform progress data
      const transformedProgress = progressData?.map(update => ({
        ...update,
        project_title: update.projects?.title || 'Unknown Project',
        milestone_title: update.project_milestones?.title || null,
        updater_name: 'System User',
        gps_coordinates: update.gps_coordinates ? `${update.gps_coordinates}` : undefined
      })) || [];

      // Transform checkpoints data  
      const transformedCheckpoints = checkpointsData?.map(checkpoint => ({
        ...checkpoint,
        inspector_name: 'Inspector' // Could join with user_profiles if needed
      })) || [];

      setProgressUpdates(transformedProgress);
      setQualityCheckpoints(transformedCheckpoints);

    } catch (error: any) {
      console.error('Error fetching tracking data:', error);
      toast.error('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProgress = async (progressId: string, type: 'supervisor' | 'citizen') => {
    if (!user) {
      toast.error('Please log in to approve progress');
      return;
    }

    try {
      const updateField = type === 'supervisor' ? 'supervisor_approved' : 'citizen_verified';
      
      const { error } = await supabase
        .from('project_progress')
        .update({ [updateField]: true })
        .eq('id', progressId);

      if (error) throw error;

      toast.success(`Progress ${type} approval recorded`);
      fetchTrackingData();
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error('Failed to record approval');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-blue-600';
    if (percentage >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCheckpointStatus = (checkpoint: QualityCheckpoint) => {
    if (checkpoint.passed === null) return 'bg-yellow-100 text-yellow-800';
    return checkpoint.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-pulse">Loading real-time tracking data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="border-t-4 border-t-blue-600">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <TrendingUp className="h-6 w-6 mr-3 text-blue-600" />
            Real-Time Project Progress Tracking
          </CardTitle>
          <p className="text-gray-600">
            Live monitoring of project progress with GPS verification, quality checkpoints, and citizen oversight.
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
          <TabsTrigger value="progress">Live Progress Updates</TabsTrigger>
          <TabsTrigger value="quality">Quality Checkpoints</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          {progressUpdates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Progress Updates</h3>
                <p className="text-gray-600">Project progress updates will appear here in real-time.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {progressUpdates.map((update) => (
                <Card key={update.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Update Header */}
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {update.project_title}
                          </h3>
                          {update.milestone_title && (
                            <div className="text-sm text-gray-600">
                              Milestone: <span className="font-medium">{update.milestone_title}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-500 gap-4">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDateTime(update.created_at)}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {update.updater_name}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <div className={`text-3xl font-bold ${getProgressColor(update.progress_percentage)}`}>
                            {update.progress_percentage}%
                          </div>
                          <div className="text-sm text-gray-600">Progress</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <Progress value={update.progress_percentage} className="h-3" />
                        <div className="text-sm text-gray-600">
                          {update.update_description}
                        </div>
                      </div>

                      {/* Additional Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                        {update.gps_coordinates && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="text-xs font-medium text-gray-500">GPS Location</div>
                              <div className="text-sm font-medium">{update.gps_coordinates}</div>
                            </div>
                          </div>
                        )}

                        {update.weather_conditions && (
                          <div className="flex items-center space-x-2">
                            <Thermometer className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="text-xs font-medium text-gray-500">Weather</div>
                              <div className="text-sm font-medium">{update.weather_conditions}</div>
                            </div>
                          </div>
                        )}

                        {update.workers_present && (
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <div>
                              <div className="text-xs font-medium text-gray-500">Workers Present</div>
                              <div className="text-sm font-medium">{update.workers_present}</div>
                            </div>
                          </div>
                        )}

                        {update.equipment_used && update.equipment_used.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Wrench className="h-4 w-4 text-orange-600" />
                            <div>
                              <div className="text-xs font-medium text-gray-500">Equipment</div>
                              <div className="text-sm font-medium">
                                {update.equipment_used.slice(0, 2).join(', ')}
                                {update.equipment_used.length > 2 && ` +${update.equipment_used.length - 2} more`}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Challenges */}
                      {update.challenges_faced && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-yellow-800">Challenges Reported</div>
                              <div className="text-sm text-yellow-700 mt-1">{update.challenges_faced}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Photo Evidence */}
                      {update.photo_urls && update.photo_urls.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Camera className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">
                              Photo Evidence ({update.photo_urls.length})
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {update.photo_urls.slice(0, 4).map((url, index) => (
                              <div key={index} className="aspect-square">
                                <img
                                  src={url}
                                  alt={`Progress evidence ${index + 1}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Approval Status */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${update.supervisor_approved ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm text-gray-600">Supervisor Approved</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${update.citizen_verified ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm text-gray-600">Citizen Verified</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          {!update.supervisor_approved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveProgress(update.id, 'supervisor')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Supervisor Approve
                            </Button>
                          )}
                          {!update.citizen_verified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveProgress(update.id, 'citizen')}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Citizen Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          {qualityCheckpoints.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quality Checkpoints</h3>
                <p className="text-gray-600">Quality inspection checkpoints will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {qualityCheckpoints.map((checkpoint) => (
                <Card key={checkpoint.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {checkpoint.checkpoint_name}
                          </h3>
                          <div className="text-sm text-gray-600">
                            Project: <span className="font-medium">{checkpoint.projects?.title || 'Unknown Project'}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 gap-4">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDateTime(checkpoint.inspection_date)}
                            </div>
                            <Badge className="text-xs">
                              {checkpoint.inspector_type.toUpperCase()} INSPECTOR
                            </Badge>
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <Badge className={getCheckpointStatus(checkpoint)}>
                            {checkpoint.passed === null ? 'PENDING' : 
                             checkpoint.passed ? 'PASSED' : 'FAILED'}
                          </Badge>
                          {checkpoint.score && (
                            <div className="text-lg font-bold text-gray-900">
                              {checkpoint.score}/100
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-1">Inspection Criteria</div>
                        <div className="text-sm text-gray-600">{checkpoint.inspection_criteria}</div>
                      </div>

                      {checkpoint.findings && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 mb-1">Findings</div>
                          <div className="text-sm text-blue-700">{checkpoint.findings}</div>
                        </div>
                      )}

                      {checkpoint.recommendations && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-sm font-medium text-green-800 mb-1">Recommendations</div>
                          <div className="text-sm text-green-700">{checkpoint.recommendations}</div>
                        </div>
                      )}

                      {checkpoint.follow_up_required && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">Follow-up Required</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeTracking;