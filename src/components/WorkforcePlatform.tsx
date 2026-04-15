import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Wallet, Users, Briefcase } from 'lucide-react';
import { useWorkforce } from '@/hooks/useWorkforce';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

const WorkforcePlatform = () => {
  const { jobs, loading, applyForJob, createJob } = useWorkforce();
  const { user } = useAuth();
  const { userProfile, contractorProfile } = useProfile();
  const { toast } = useToast();

  const [applicationMessage, setApplicationMessage] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    location: '',
    required_skills: [],
    wage_min: '',
    wage_max: '',
    duration_days: '',
    positions_available: 1
  });

  const handleApply = async () => {
    if (!selectedJobId) return;

    if (!userProfile) {
      toast({
        title: "Skills Profile Required",
        description: "Please register your skills profile in the Workforce Integration page before applying.",
        variant: "destructive"
      });
      return;
    }

    await applyForJob(selectedJobId, applicationMessage);
    setApplicationMessage('');
    setSelectedJobId(null);
  };

  const handleCreateJob = async () => {
    const jobData = {
      ...newJob,
      wage_min: newJob.wage_min ? parseFloat(newJob.wage_min) : undefined,
      wage_max: newJob.wage_max ? parseFloat(newJob.wage_max) : undefined,
      duration_days: newJob.duration_days ? parseInt(newJob.duration_days) : undefined,
    };

    await createJob(jobData);
    setNewJob({
      title: '',
      description: '',
      location: '',
      required_skills: [],
      wage_min: '',
      wage_max: '',
      duration_days: '',
      positions_available: 1
    });
    setShowCreateJob(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workforce Platform</h1>
          <p className="text-muted-foreground">
            Connect with local infrastructure projects and find skilled workers
          </p>
        </div>

        {userProfile?.user_type === 'contractor' && (
          <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
            <DialogTrigger asChild>
              <Button>
                <Briefcase className="h-4 w-4 mr-2" />
                Post Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Job Posting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Job Title"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                />
                <Textarea
                  placeholder="Job Description"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                />
                <Input
                  placeholder="Location"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Min Wage (KES)"
                    type="number"
                    value={newJob.wage_min}
                    onChange={(e) => setNewJob({ ...newJob, wage_min: e.target.value })}
                  />
                  <Input
                    placeholder="Max Wage (KES)"
                    type="number"
                    value={newJob.wage_max}
                    onChange={(e) => setNewJob({ ...newJob, wage_max: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Duration (days)"
                  type="number"
                  value={newJob.duration_days}
                  onChange={(e) => setNewJob({ ...newJob, duration_days: e.target.value })}
                />
                <Button onClick={handleCreateJob} className="w-full">
                  Create Job Posting
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <Badge variant="secondary">Open</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {job.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {job.location}
                </div>

                {job.duration_days && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {job.duration_days} days
                  </div>
                )}

                {(job.wage_min || job.wage_max) && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Wallet className="h-4 w-4 mr-2" />
                    KES {job.wage_min && job.wage_max
                      ? `${job.wage_min.toLocaleString()} - ${job.wage_max.toLocaleString()}`
                      : job.wage_min?.toLocaleString() || job.wage_max?.toLocaleString()
                    }
                  </div>
                )}

                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  {job.positions_available} position{job.positions_available !== 1 ? 's' : ''} available
                </div>
              </div>

              {job.required_skills && job.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {job.required_skills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {job.required_skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{job.required_skills.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="mt-auto pt-4">
                {userProfile?.user_type === 'citizen' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="flex flex-col gap-1">
                        <Button
                          className="w-full"
                          onClick={() => setSelectedJobId(job.id)}
                          disabled={!(userProfile as any)?.skills || (userProfile as any)?.skills?.length === 0}
                        >
                          Apply Now
                        </Button>
                        {(!(userProfile as any)?.skills || (userProfile as any)?.skills?.length === 0) && (
                          <span className="text-[10px] text-amber-600 font-medium text-center">
                            Skills registration required
                          </span>
                        )}
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply for {job.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Why are you interested in this position? Describe your relevant experience..."
                          value={applicationMessage}
                          onChange={(e) => setApplicationMessage(e.target.value)}
                          rows={4}
                        />
                        <Button onClick={handleApply} className="w-full">
                          Submit Application
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No jobs available</h3>
          <p className="text-muted-foreground">
            Check back later for new job opportunities
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkforcePlatform;