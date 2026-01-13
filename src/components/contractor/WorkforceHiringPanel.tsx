import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, Briefcase, MapPin, DollarSign, Clock, 
  Plus, UserCheck, X, Loader2, Search
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProjectLifecycleService } from '@/services/ProjectLifecycleService';

interface WorkforceJob {
  id: string;
  title: string;
  description: string;
  location: string;
  required_skills: string[];
  wage_min: number | null;
  wage_max: number | null;
  duration_days: number | null;
  positions_available: number;
  positions_filled: number;
  status: string;
  applicants_count?: number;
}

interface AvailableWorker {
  id: string;
  user_id: string;
  skills: string[];
  experience_years: number | null;
  rating: number | null;
  county: string;
  availability_status: string;
  hourly_rate: number | null;
  daily_rate: number | null;
}

interface WorkforceHiringPanelProps {
  projectId: string;
  projectLocation?: string;
  onHire?: () => void;
}

const WorkforceHiringPanel: React.FC<WorkforceHiringPanelProps> = ({
  projectId,
  projectLocation,
  onHire
}) => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<WorkforceJob[]>([]);
  const [workers, setWorkers] = useState<AvailableWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showWorkerSearch, setShowWorkerSearch] = useState(false);
  const [searchSkill, setSearchSkill] = useState('');
  const [creating, setCreating] = useState(false);
  
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    location: projectLocation || '',
    required_skills: '',
    wage_min: '',
    wage_max: '',
    duration_days: '',
    positions_available: '1'
  });

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch jobs for this project
      const { data: jobsData, error: jobsError } = await supabase
        .from('workforce_jobs')
        .select(`
          *,
          job_applications(id, status)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Transform jobs with applicant counts
      const transformedJobs = (jobsData || []).map(job => ({
        ...job,
        applicants_count: job.job_applications?.length || 0,
        positions_filled: job.job_applications?.filter((a: any) => a.status === 'accepted').length || 0
      }));

      setJobs(transformedJobs);

      // Fetch available workers using RPC function
      const { data: workersData, error: workersError } = await supabase
        .rpc('get_available_workers_for_contractors');

      if (!workersError && workersData) {
        setWorkers(workersData);
      }
    } catch (error) {
      console.error('Error fetching workforce data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the job title and description",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const success = await ProjectLifecycleService.createWorkforceJob(projectId, {
        title: newJob.title,
        description: newJob.description,
        location: newJob.location || projectLocation || '',
        required_skills: newJob.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        wage_min: newJob.wage_min ? parseFloat(newJob.wage_min) : undefined,
        wage_max: newJob.wage_max ? parseFloat(newJob.wage_max) : undefined,
        duration_days: newJob.duration_days ? parseInt(newJob.duration_days) : undefined,
        positions_available: parseInt(newJob.positions_available) || 1
      });

      if (success) {
        toast({
          title: "Job Posted",
          description: "Your job has been posted to the Citizen Worker Registry"
        });
        setShowCreateJob(false);
        setNewJob({
          title: '',
          description: '',
          location: projectLocation || '',
          required_skills: '',
          wage_min: '',
          wage_max: '',
          duration_days: '',
          positions_available: '1'
        });
        fetchData();
        onHire?.();
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: "Failed to create job posting",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const filteredWorkers = workers.filter(worker =>
    searchSkill === '' || 
    worker.skills?.some(skill => 
      skill.toLowerCase().includes(searchSkill.toLowerCase())
    )
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Workforce Integration</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowWorkerSearch(true)}>
                <Search className="h-4 w-4 mr-1" />
                Find Workers
              </Button>
              <Button size="sm" onClick={() => setShowCreateJob(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Post Job
              </Button>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Hire local skilled workers from the Citizen Worker Registry
          </p>
        </CardHeader>

        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Job Postings Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Post jobs to hire local workers for your project
              </p>
              <Button onClick={() => setShowCreateJob(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Job Posting
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div 
                  key={job.id}
                  className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{job.title}</h4>
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      {job.wage_min && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          KES {job.wage_min.toLocaleString()}{job.wage_max && ` - ${job.wage_max.toLocaleString()}`}
                        </span>
                      )}
                      {job.duration_days && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {job.duration_days} days
                        </span>
                      )}
                    </div>
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.required_skills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {job.positions_filled}/{job.positions_available}
                    </div>
                    <p className="text-xs text-muted-foreground">Positions Filled</p>
                    {job.applicants_count! > 0 && (
                      <Badge className="mt-2 bg-blue-100 text-blue-800">
                        {job.applicants_count} applicants
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Job Dialog */}
      <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Job to Citizen Worker Registry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Job Title</label>
              <Input
                value={newJob.title}
                onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                placeholder="e.g., Construction Laborer, Mason, Electrician"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newJob.description}
                onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                placeholder="Describe the job requirements and responsibilities..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                value={newJob.location}
                onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                placeholder="Project site location"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Required Skills (comma-separated)</label>
              <Input
                value={newJob.required_skills}
                onChange={(e) => setNewJob({...newJob, required_skills: e.target.value})}
                placeholder="e.g., masonry, carpentry, plumbing"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Min Daily Wage (KES)</label>
                <Input
                  type="number"
                  value={newJob.wage_min}
                  onChange={(e) => setNewJob({...newJob, wage_min: e.target.value})}
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Daily Wage (KES)</label>
                <Input
                  type="number"
                  value={newJob.wage_max}
                  onChange={(e) => setNewJob({...newJob, wage_max: e.target.value})}
                  placeholder="2000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Duration (days)</label>
                <Input
                  type="number"
                  value={newJob.duration_days}
                  onChange={(e) => setNewJob({...newJob, duration_days: e.target.value})}
                  placeholder="30"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Positions Available</label>
                <Input
                  type="number"
                  value={newJob.positions_available}
                  onChange={(e) => setNewJob({...newJob, positions_available: e.target.value})}
                  placeholder="5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateJob(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateJob} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Post Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Worker Search Dialog */}
      <Dialog open={showWorkerSearch} onOpenChange={setShowWorkerSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Citizen Worker Registry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by skill..."
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredWorkers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No workers found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWorkers.slice(0, 10).map((worker) => (
                  <div 
                    key={worker.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Verified Worker</span>
                        {worker.rating && (
                          <Badge variant="outline" className="text-amber-600">
                            ★ {worker.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {worker.county}
                        {worker.experience_years && (
                          <span>• {worker.experience_years} years exp.</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {worker.skills?.slice(0, 4).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      {worker.daily_rate && (
                        <div className="font-medium">
                          KES {worker.daily_rate.toLocaleString()}/day
                        </div>
                      )}
                      <Badge className="mt-1 bg-green-100 text-green-800">
                        {worker.availability_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Post a job to receive applications from these workers
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkforceHiringPanel;
