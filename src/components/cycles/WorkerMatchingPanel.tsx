import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  MapPin, 
  Star, 
  Briefcase,
  DollarSign,
  CheckCircle,
  Phone,
  Loader2,
  Target
} from 'lucide-react';
import { WorkforceIntegrationCycle, JobMatch, WorkerPerformance } from '@/services/FullCycleService';
import { toast } from 'sonner';

interface WorkerMatchingPanelProps {
  workerId?: string;
  projectLocation?: string;
  requiredSkills?: string[];
  mode: 'worker' | 'contractor';
}

const WorkerMatchingPanel = ({ workerId, projectLocation, requiredSkills, mode }: WorkerMatchingPanelProps) => {
  const [matchingJobs, setMatchingJobs] = useState<JobMatch[]>([]);
  const [localWorkers, setLocalWorkers] = useState<any[]>([]);
  const [performance, setPerformance] = useState<WorkerPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mode === 'worker' && workerId) {
      fetchWorkerData();
    } else if (mode === 'contractor' && projectLocation && requiredSkills) {
      fetchContractorData();
    }
  }, [workerId, projectLocation, requiredSkills, mode]);

  const fetchWorkerData = async () => {
    if (!workerId) return;
    setLoading(true);
    try {
      const [jobs, perf] = await Promise.all([
        WorkforceIntegrationCycle.findMatchingJobs(workerId),
        WorkforceIntegrationCycle.getWorkerPerformance(workerId)
      ]);
      setMatchingJobs(jobs);
      setPerformance(perf);
    } catch (error) {
      console.error('Error fetching worker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractorData = async () => {
    if (!projectLocation || !requiredSkills) return;
    setLoading(true);
    try {
      const workers = await WorkforceIntegrationCycle.getLocalWorkers(projectLocation, requiredSkills);
      setLocalWorkers(workers);
    } catch (error) {
      console.error('Error fetching contractor data:', error);
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

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading matches...</span>
        </CardContent>
      </Card>
    );
  }

  // Worker Mode - Show matching jobs
  if (mode === 'worker') {
    return (
      <div className="space-y-6">
        {/* Performance Summary */}
        {performance && (
          <Card className="border-t-4 border-t-green-600">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Your Performance Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Briefcase className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{performance.totalJobsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Jobs Completed</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                  <p className="text-2xl font-bold">{performance.averageRating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Average Rating</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Target className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-2xl font-bold">{performance.reliabilityScore}%</p>
                  <p className="text-xs text-muted-foreground">Reliability</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-5 w-5 mx-auto text-green-600 mb-1" />
                  <p className="text-2xl font-bold">{formatCurrency(performance.earnedWages)}</p>
                  <p className="text-xs text-muted-foreground">Earned Wages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Matching Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Jobs Matched to Your Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matchingJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No matching jobs found. Update your skills profile for better matches.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matchingJobs.map((match) => (
                  <div key={match.jobId} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getMatchColor(match.matchScore)}>
                            {match.matchScore.toFixed(0)}% Match
                          </Badge>
                          {match.locationMatch && (
                            <Badge variant="outline" className="text-green-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              Local
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Skill Match:</span>
                            <Progress value={match.skillMatch} className="h-2 mt-1" />
                          </div>
                          <div>
                            <span className="text-muted-foreground">Wage Range:</span>
                            <p className="font-medium text-green-600">
                              {formatCurrency(match.wageRange.min)} - {formatCurrency(match.wageRange.max)}/day
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button size="sm">Apply</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Contractor Mode - Show local workers
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-primary" />
          Local Workers - {projectLocation}
          <Badge variant="outline" className="ml-2">{localWorkers.length} available</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {localWorkers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No verified workers found in this location with the required skills.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {localWorkers.map((worker) => (
              <div key={worker.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{worker.rating?.toFixed(1) || 'New'}</span>
                          <span className="text-muted-foreground text-sm">
                            ({worker.total_jobs_completed || 0} jobs)
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {worker.county}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {worker.skills?.slice(0, 5).map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {worker.skills?.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{worker.skills.length - 5} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <Badge className={getMatchColor(worker.skillMatchPercent)}>
                        {worker.skillMatchPercent.toFixed(0)}% Skill Match
                      </Badge>
                      <span className="text-muted-foreground">
                        {worker.experience_years || 0} years experience
                      </span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(worker.daily_rate || 0)}/day
                      </span>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toast.success('Contact request sent')}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkerMatchingPanel;
