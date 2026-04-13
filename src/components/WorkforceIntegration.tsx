import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Wrench, MapPin, Star, Briefcase, Phone, Loader2, AlertCircle, CheckCircle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import JobDetailsModal from '@/components/citizen/JobDetailsModal';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  required_skills: string[];
  duration_days: number | null;
  wage_min: number | null;
  wage_max: number | null;
  positions_available: number | null;
  status: string | null;
  created_at: string | null;
  project_id?: string | null;
  project_title?: string;
  report_category?: string;
}

interface Worker {
  id: string;
  user_id: string;
  skills: string[];
  county: string;
  phone_number: string;
  rating: number | null;
  total_jobs_completed: number | null;
  availability_status: string | null;
  experience_years: number | null;
}

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string | null;
}

interface CitizenProfile {
  full_name?: string;
  phone_number?: string;
  county?: string;
  sub_county?: string;
  ward?: string;
  skills?: string[];
  experience_years?: number;
  daily_rate?: number;
  national_id?: string;
}

const WorkforceIntegration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile | null>(null);

  // Skills registration form state
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const skillCategories = [
    {
      name: 'Construction',
      skills: ['Masonry', 'Carpentry', 'Plumbing', 'Electrical', 'Painting', 'Roofing'],
      icon: <Wrench className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    {
      name: 'Infrastructure',
      skills: ['Road Construction', 'Water Systems', 'Drainage', 'Bridge Building'],
      icon: <Briefcase className="h-5 w-5" />,
      color: 'bg-green-500'
    },
    {
      name: 'Maintenance',
      skills: ['Equipment Repair', 'Facility Maintenance', 'Landscaping', 'Cleaning'],
      icon: <Wrench className="h-5 w-5" />,
      color: 'bg-orange-500'
    }
  ];

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch open jobs - include project details to show linked report info
      const { data: jobsData, error: jobsError } = await supabase
        .from('workforce_jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Enrich jobs with project/report info
      const enrichedJobs: Job[] = [];
      for (const job of (jobsData || [])) {
        let projectTitle = '';
        let reportCategory = '';
        if (job.project_id) {
          const { data: project } = await supabase
            .from('projects')
            .select('title, report_id')
            .eq('id', job.project_id)
            .maybeSingle();
          if (project) {
            projectTitle = project.title;
            if (project.report_id) {
              const { data: report } = await supabase
                .from('problem_reports')
                .select('category')
                .eq('id', project.report_id)
                .maybeSingle();
              reportCategory = report?.category || '';
            }
          }
        }
        enrichedJobs.push({
          ...job,
          project_title: projectTitle,
          report_category: reportCategory
        });
      }
      setJobs(enrichedJobs);

      // Fetch workers (only for government users to see)
      const { data: workersData } = await supabase
        .from('citizen_workers')
        .select('*')
        .eq('availability_status', 'available')
        .limit(10);

      setWorkers(workersData || []);

      // Fetch user's applications and profile if logged in
      if (user) {
        const { data: appsData } = await supabase
          .from('job_applications')
          .select('*')
          .eq('applicant_id', user.id);

        setApplications(appsData || []);

        // Load citizen profile from user_profiles + citizen_workers
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('full_name, phone_number, county, sub_county, ward, national_id')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: workerProfile } = await supabase
          .from('citizen_workers')
          .select('skills, experience_years, daily_rate')
          .eq('user_id', user.id)
          .maybeSingle();

        setCitizenProfile({
          full_name: userProfile?.full_name || user.name,
          phone_number: userProfile?.phone_number || user.profile?.phone_number,
          county: userProfile?.county || user.profile?.county,
          sub_county: userProfile?.sub_county || user.profile?.sub_county,
          ward: userProfile?.ward || user.profile?.ward,
          national_id: userProfile?.national_id,
          skills: workerProfile?.skills || [],
          experience_years: workerProfile?.experience_years || 0,
          daily_rate: workerProfile?.daily_rate || 0,
        });

        // Pre-fill skills form
        if (workerProfile?.skills) {
          setSelectedSkills(workerProfile.skills);
        }
        if (workerProfile?.experience_years) {
          setExperience(String(workerProfile.experience_years));
        }
        if (userProfile?.phone_number) {
          setPhone(userProfile.phone_number);
        }
      }
    } catch (error: any) {
      console.error('Error fetching workforce data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApplicationStatus = (jobId: string) => {
    const app = applications.find(app => app.job_id === jobId);
    return app?.status || null;
  };

  const hasAppliedToJob = (jobId: string) => {
    return applications.some(app => app.job_id === jobId);
  };

  const handleJobApplication = async (jobId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to apply for jobs.", variant: "destructive" });
      return;
    }

    if (hasAppliedToJob(jobId)) {
      toast({ title: "Already Applied", description: "You have already applied to this job.", variant: "destructive" });
      return;
    }

    if (!citizenProfile?.skills || citizenProfile.skills.length === 0) {
      toast({
        title: "Skills Profile Incomplete",
        description: "Please register your skills in the 'Skills Registry' tab before applying for jobs.",
        variant: "destructive"
      });
      return;
    }

    setIsApplying(true);
    try {
      // Build rich application message from profile data
      const profileParts: string[] = [];
      if (citizenProfile?.full_name) profileParts.push(`Name: ${citizenProfile.full_name}`);
      if (citizenProfile?.phone_number) profileParts.push(`Phone: ${citizenProfile.phone_number}`);
      if (citizenProfile?.county) profileParts.push(`County: ${citizenProfile.county}`);
      if (citizenProfile?.sub_county) profileParts.push(`Sub-County: ${citizenProfile.sub_county}`);
      if (citizenProfile?.ward) profileParts.push(`Ward: ${citizenProfile.ward}`);
      if (citizenProfile?.skills && citizenProfile.skills.length > 0) {
        profileParts.push(`Skills: ${citizenProfile.skills.join(', ')}`);
      }
      if (citizenProfile?.experience_years) profileParts.push(`Experience: ${citizenProfile.experience_years} years`);
      if (citizenProfile?.daily_rate) profileParts.push(`Expected Daily Rate: KES ${citizenProfile.daily_rate}`);

      const applicationMessage = profileParts.length > 0
        ? profileParts.join(' | ')
        : 'Application submitted via workforce portal';

      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          application_message: applicationMessage
        });

      if (error) throw error;

      setApplications([...applications, {
        id: crypto.randomUUID(),
        job_id: jobId,
        applicant_id: user.id,
        status: 'pending'
      }]);

      toast({
        title: "Application Submitted!",
        description: "Your profile details have been sent to the contractor. You will be notified when reviewed.",
      });

      setShowJobModal(false);
    } catch (error: any) {
      console.error('Error applying for job:', error);
      toast({ title: "Application Failed", description: error.message || "Failed to submit application.", variant: "destructive" });
    } finally {
      setIsApplying(false);
    }
  };

  const handleViewJobDetails = (job: Job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleUpdateSkillsProfile = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to register your skills.", variant: "destructive" });
      return;
    }

    if (selectedSkills.length === 0) {
      toast({ title: "Select Skills", description: "Please select at least one skill.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // Get county from user profile
      const profileCounty = citizenProfile?.county || user.profile?.county || 'Nairobi';
      const profilePhone = phone || citizenProfile?.phone_number || user.profile?.phone_number || '0700000000';

      const { data: existing } = await supabase
        .from('citizen_workers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('citizen_workers')
          .update({
            skills: selectedSkills,
            experience_years: experience ? parseInt(experience) : null,
            phone_number: profilePhone,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('citizen_workers')
          .insert({
            user_id: user.id,
            skills: selectedSkills,
            experience_years: experience ? parseInt(experience) : 0,
            phone_number: profilePhone,
            county: profileCounty,
            availability_status: 'available'
          });
        if (error) throw error;
      }

      toast({ title: "Profile Updated!", description: "Your skills profile has been saved." });
      // Refresh citizen profile
      fetchData();
    } catch (error: any) {
      console.error('Error updating skills:', error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getWageDisplay = (job: Job) => {
    if (job.wage_min && job.wage_max) return `KES ${job.wage_min.toLocaleString()} - ${job.wage_max.toLocaleString()}/day`;
    if (job.wage_min) return `From KES ${job.wage_min.toLocaleString()}/day`;
    return 'Negotiable';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-green-600">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <Users className="h-6 w-6 mr-3 text-green-600" />
            Citizen Workforce Integration
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Find job opportunities from approved community projects. Your registration details are automatically used in applications.
          </p>
        </CardHeader>
      </Card>

      {/* Your Profile Summary */}
      {citizenProfile && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-sm">Your Application Profile</h4>
              <Badge variant="outline" className="text-xs">Auto-filled from registration</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Name</span>
                <p className="font-medium">{citizenProfile.full_name || 'Not set'}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Phone</span>
                <p className="font-medium">{citizenProfile.phone_number || 'Not set'}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">County</span>
                <p className="font-medium">{citizenProfile.county || 'Not set'}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Skills</span>
                <p className="font-medium">{citizenProfile.skills?.length ? citizenProfile.skills.join(', ') : 'Register below'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card shadow-lg">
          <TabsTrigger value="jobs">Available Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="skills">Skills Registry</TabsTrigger>
          <TabsTrigger value="workers">Local Workers</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Jobs Available</h3>
                <p className="text-muted-foreground">
                  No open job opportunities at the moment. Register your skills to get notified.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {jobs.map((job) => {
                const hasApplied = hasAppliedToJob(job.id);
                const appStatus = getApplicationStatus(job.id);
                return (
                  <Card key={job.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <h3 className="text-xl font-semibold">{job.title}</h3>
                              {job.project_title && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Project: {job.project_title}
                                  {job.report_category && ` • ${job.report_category}`}
                                </p>
                              )}
                            </div>
                            {appStatus === 'accepted' ? (
                              <Badge className="bg-green-600 text-white">Hired</Badge>
                            ) : appStatus === 'rejected' ? (
                              <Badge className="bg-red-100 text-red-800">Not Selected</Badge>
                            ) : hasApplied ? (
                              <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                            ) : null}
                          </div>

                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-2" />
                            {job.location}
                          </div>

                          <p className="text-muted-foreground">{job.description}</p>

                          <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-muted-foreground">Skills needed:</span>
                            {job.required_skills?.map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-primary border-primary/50">
                                {skill}
                              </Badge>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Duration:</span>
                              <div className="font-medium">{job.duration_days ? `${job.duration_days} days` : 'Flexible'}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Daily Rate:</span>
                              <div className="font-medium text-green-600">{getWageDisplay(job)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Spots Available:</span>
                              <div className="font-medium text-primary">{job.positions_available || 'Multiple'}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          {appStatus === 'accepted' ? (
                            <Button onClick={() => window.location.href = '/citizen/my-jobs'} className="bg-green-600 hover:bg-green-700">
                              View My Jobs
                            </Button>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <Button
                                onClick={() => handleJobApplication(job.id)}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={hasApplied || isApplying}
                              >
                                {hasApplied ? 'Pending Review' : 'Apply Now'}
                              </Button>
                              {!citizenProfile?.skills?.length && !hasApplied && (
                                <span className="text-[10px] text-amber-600 font-medium text-center">
                                  Skills registration required
                                </span>
                              )}
                            </div>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleViewJobDetails(job)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Register Your Skills</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add your skills to get matched with relevant job opportunities. Your phone and county are pulled from your registration.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {skillCategories.map((category, index) => (
                  <Card key={index} className="border-2 hover:border-green-400 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-lg">
                        <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center text-white mr-3`}>
                          {category.icon}
                        </div>
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.skills.map((skill, skillIndex) => (
                          <div key={skillIndex} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`${category.name}-${skill}`}
                              className="rounded border-gray-300"
                              checked={selectedSkills.includes(skill)}
                              onChange={() => handleSkillToggle(skill)}
                            />
                            <label htmlFor={`${category.name}-${skill}`} className="text-sm cursor-pointer">
                              {skill}
                            </label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-primary mb-3">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Years of Experience</label>
                    <Input
                      placeholder="e.g., 5"
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                    <Input
                      placeholder="Auto-filled from registration"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Pre-filled from your registration</p>
                  </div>
                </div>
                <Button
                  className="mt-4 bg-green-600 hover:bg-green-700"
                  onClick={handleUpdateSkillsProfile}
                  disabled={isSaving || selectedSkills.length === 0}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Skills Profile'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Registered Workers in Your Area</CardTitle>
            </CardHeader>
            <CardContent>
              {workers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No registered workers found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workers.map((worker) => (
                    <div key={worker.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{worker.county}</span>
                          {worker.rating && (
                            <Badge variant="outline" className="text-amber-600">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              {worker.rating.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {worker.skills?.slice(0, 4).map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {worker.availability_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          isOpen={showJobModal}
          onClose={() => setShowJobModal(false)}
          job={selectedJob}
          onApply={handleJobApplication}
          hasApplied={hasAppliedToJob(selectedJob.id)}
          isApplying={isApplying}
          citizenProfile={citizenProfile}
        />
      )}
    </div>
  );
};

export default WorkforceIntegration;
