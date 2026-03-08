import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, Briefcase, MapPin, Wallet, Clock, 
  Plus, UserCheck, X, Loader2, Search, Eye, CheckCircle, XCircle,
  Star, Phone, Mail, FileText, User, GraduationCap, Wrench, Globe
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProjectLifecycleService } from '@/services/ProjectLifecycleService';
import { NotificationService } from '@/services/NotificationService';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';

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
  job_applications?: any[];
}

interface ApplicantDetail {
  id: string;
  status: string;
  applicant_id: string;
  application_message?: string;
  applied_at?: string;
  // From user_profiles
  full_name?: string;
  email?: string;
  phone_number?: string;
  county?: string;
  sub_county?: string;
  ward?: string;
  national_id?: string;
  gender?: string;
  // From citizen_workers
  skills?: string[];
  experience_years?: number;
  rating?: number;
  daily_rate?: number;
  education_level?: string;
  certifications?: string[];
  languages?: string[];
  total_jobs_completed?: number;
  availability_status?: string;
  transport_means?: string[];
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
  readOnly?: boolean;
}

const WorkforceHiringPanel: React.FC<WorkforceHiringPanelProps> = ({
  projectId, projectLocation, onHire
}) => {
  const { toast } = useToast();
  const { isMobile } = useViewport();
  const [jobs, setJobs] = useState<WorkforceJob[]>([]);
  const [workers, setWorkers] = useState<AvailableWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showWorkerSearch, setShowWorkerSearch] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);
  const [selectedJob, setSelectedJob] = useState<WorkforceJob | null>(null);
  const [applicants, setApplicants] = useState<ApplicantDetail[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [processingApplication, setProcessingApplication] = useState<string | null>(null);
  const [searchSkill, setSearchSkill] = useState('');
  const [creating, setCreating] = useState(false);
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);
  
  const [newJob, setNewJob] = useState({
    title: '', description: '', location: projectLocation || '',
    required_skills: '', wage_min: '', wage_max: '',
    duration_days: '', positions_available: '1'
  });

  useEffect(() => { fetchData(); }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: jobsData, error: jobsError } = await supabase
        .from('workforce_jobs')
        .select(`*, job_applications(id, status, applicant_id, application_message, applied_at)`)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      const transformedJobs = (jobsData || []).map(job => ({
        ...job,
        applicants_count: job.job_applications?.length || 0,
        positions_filled: job.job_applications?.filter((a: any) => a.status === 'accepted').length || 0
      }));
      setJobs(transformedJobs);

      const { data: workersData } = await supabase.rpc('get_available_workers_for_contractors');
      if (workersData) setWorkers(workersData);
    } catch (error) {
      console.error('Error fetching workforce data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (job: WorkforceJob) => {
    setLoadingApplicants(true);
    setSelectedJob(job);
    setShowApplicants(true);
    
    try {
      const { data: applications, error: appsError } = await supabase
        .from('job_applications')
        .select('id, status, applicant_id, application_message, applied_at')
        .eq('job_id', job.id)
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch comprehensive details for each applicant
      const detailedApplicants: ApplicantDetail[] = await Promise.all(
        (applications || []).map(async (app) => {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, phone_number, county, sub_county, ward, national_id, gender')
            .eq('user_id', app.applicant_id)
            .maybeSingle();

          // Fetch citizen worker profile
          const { data: worker } = await supabase
            .from('citizen_workers')
            .select('skills, experience_years, rating, daily_rate, education_level, certifications, languages, total_jobs_completed, availability_status, transport_means, phone_number')
            .eq('user_id', app.applicant_id)
            .maybeSingle();

          // Fetch email from auth (via user_profiles or fallback)
          const { data: authUser } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('user_id', app.applicant_id)
            .maybeSingle();

          return {
            id: app.id,
            status: app.status,
            applicant_id: app.applicant_id,
            application_message: app.application_message,
            applied_at: app.applied_at,
            // Profile data
            full_name: profile?.full_name || 'Unknown',
            phone_number: worker?.phone_number || profile?.phone_number || '',
            county: profile?.county || '',
            sub_county: profile?.sub_county || '',
            ward: profile?.ward || '',
            national_id: profile?.national_id || '',
            gender: profile?.gender || '',
            // Worker data
            skills: worker?.skills || [],
            experience_years: worker?.experience_years || 0,
            rating: worker?.rating || 0,
            daily_rate: worker?.daily_rate || 0,
            education_level: worker?.education_level || '',
            certifications: worker?.certifications || [],
            languages: worker?.languages || [],
            total_jobs_completed: worker?.total_jobs_completed || 0,
            availability_status: worker?.availability_status || 'unknown',
            transport_means: worker?.transport_means || [],
          };
        })
      );

      setApplicants(detailedApplicants);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      toast({ title: "Error", description: "Failed to load applicants", variant: "destructive" });
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleReviewApplication = async (applicationId: string, status: 'accepted' | 'rejected') => {
    setProcessingApplication(applicationId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const application = applicants.find(a => a.id === applicationId);
      const updateData: any = { status, reviewed_at: new Date().toISOString(), reviewed_by: user.id };
      if (status === 'accepted') updateData.started_at = new Date().toISOString();

      const { error } = await supabase
        .from('job_applications').update(updateData).eq('id', applicationId);
      if (error) throw error;

      if (application) {
        const jobTitle = selectedJob?.title || 'a job';
        if (status === 'accepted') {
          await NotificationService.notifyUser(
            application.applicant_id,
            'Congratulations! You Have Been Hired',
            `You have been selected for "${jobTitle}". Check your My Jobs page for details.`,
            'success', 'general', '/citizen/my-jobs'
          );
        } else {
          await NotificationService.notifyUser(
            application.applicant_id,
            'Application Update',
            `Your application for "${jobTitle}" was not selected. Keep applying.`,
            'info', 'general', '/citizen/workforce'
          );
        }
      }

      toast({
        title: status === 'accepted' ? "Worker Hired!" : "Application Rejected",
        description: status === 'accepted' 
          ? "The worker has been notified and can now join your project."
          : "The applicant has been notified of your decision."
      });

      if (selectedJob) fetchApplicants(selectedJob);
      fetchData();
      onHire?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingApplication(null);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.description) {
      toast({ title: "Missing Information", description: "Please fill in the job title and description", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const success = await ProjectLifecycleService.createWorkforceJob(projectId, {
        title: newJob.title, description: newJob.description,
        location: newJob.location || projectLocation || '',
        required_skills: newJob.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        wage_min: newJob.wage_min ? parseFloat(newJob.wage_min) : undefined,
        wage_max: newJob.wage_max ? parseFloat(newJob.wage_max) : undefined,
        duration_days: newJob.duration_days ? parseInt(newJob.duration_days) : undefined,
        positions_available: parseInt(newJob.positions_available) || 1
      });
      if (success) {
        toast({ title: "Job Posted", description: "Your job has been posted to the Citizen Worker Registry" });
        setShowCreateJob(false);
        setNewJob({ title: '', description: '', location: projectLocation || '', required_skills: '', wage_min: '', wage_max: '', duration_days: '', positions_available: '1' });
        fetchData();
        onHire?.();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create job posting", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const filteredWorkers = workers.filter(worker =>
    searchSkill === '' || worker.skills?.some(skill => skill.toLowerCase().includes(searchSkill.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <Badge className="bg-green-100 text-green-800">Hired</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <Card><CardContent className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardHeader className={isMobile ? 'p-4' : undefined}>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-base sm:text-lg">Workforce Integration</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowWorkerSearch(true)}>
                <Search className="h-4 w-4 mr-1" />
                <span className={isMobile ? 'sr-only' : ''}>Find Workers</span>
              </Button>
              <Button size="sm" onClick={() => setShowCreateJob(true)}>
                <Plus className="h-4 w-4 mr-1" />
                <span className={isMobile ? 'sr-only' : ''}>Post Job</span>
              </Button>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Hire local skilled workers from the Citizen Worker Registry</p>
        </CardHeader>

        <CardContent className={isMobile ? 'p-4 pt-0' : undefined}>
          {jobs.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-lg">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Job Postings Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Post jobs to hire local workers</p>
              <Button onClick={() => setShowCreateJob(true)}><Plus className="h-4 w-4 mr-2" />Create Job Posting</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className={cn("p-4 bg-muted/50 rounded-lg", isMobile ? 'space-y-3' : 'flex items-start justify-between')}>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{job.title}</h4>
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>{job.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
                      {job.wage_min && <span className="flex items-center gap-1"><Wallet className="h-4 w-4" />KES {job.wage_min.toLocaleString()}{job.wage_max && ` - ${job.wage_max.toLocaleString()}`}</span>}
                      {job.duration_days && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{job.duration_days} days</span>}
                    </div>
                    {job.required_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.required_skills.map((skill, i) => <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div className={cn("flex items-center gap-4", isMobile ? 'justify-between' : 'flex-col items-end')}>
                    <div className={isMobile ? '' : 'text-right'}>
                      <div className="text-lg font-bold">{job.positions_filled}/{job.positions_available}</div>
                      <p className="text-xs text-muted-foreground">Positions Filled</p>
                    </div>
                    {job.applicants_count! > 0 && (
                      <Button size="sm" variant="outline" onClick={() => fetchApplicants(job)} className="flex items-center gap-1">
                        <Eye className="h-4 w-4" /><span>{job.applicants_count} Applicants</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Applicants Dialog - ENHANCED with full profile details */}
      <Dialog open={showApplicants} onOpenChange={setShowApplicants}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-3xl max-h-[90dvh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
              <Users className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate">Applicants: {selectedJob?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0 py-2">
            {loadingApplicants ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : applicants.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No applicants yet</p>
              </div>
            ) : (
              <div className="space-y-3 pr-1">
                {applicants.map((app) => {
                  const isExpanded = expandedApplicant === app.id;
                  return (
                    <div key={app.id} className="border rounded-lg overflow-hidden">
                      {/* Applicant Summary Row */}
                      <div 
                        className="p-3 sm:p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedApplicant(isExpanded ? null : app.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <User className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold text-sm sm:text-base">{app.full_name}</h4>
                              {getStatusBadge(app.status)}
                              {app.rating > 0 && (
                                <Badge variant="outline" className="text-amber-600 text-xs">
                                  <Star className="h-3 w-3 mr-1 fill-current" />{app.rating.toFixed(1)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
                              {app.county && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.county}{app.sub_county && `, ${app.sub_county}`}</span>}
                              {app.phone_number && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.phone_number}</span>}
                              {app.experience_years > 0 && <span>{app.experience_years}y exp.</span>}
                              {app.total_jobs_completed > 0 && <span>{app.total_jobs_completed} jobs done</span>}
                            </div>
                            {/* Skills preview */}
                            {app.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {app.skills.slice(0, 5).map((skill, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                                ))}
                                {app.skills.length > 5 && <Badge variant="outline" className="text-xs">+{app.skills.length - 5}</Badge>}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs text-muted-foreground">{formatDate(app.applied_at)}</span>
                            {app.daily_rate > 0 && (
                              <div className="text-sm font-medium text-green-600 mt-1">KES {app.daily_rate.toLocaleString()}/day</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Full Profile */}
                      {isExpanded && (
                        <div className="border-t bg-muted/20 p-4 space-y-4">
                          <h5 className="font-semibold text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Full Applicant Profile
                          </h5>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground text-xs block">Full Name</span>
                              <span className="font-medium">{app.full_name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Phone Number</span>
                              <a href={`tel:${app.phone_number}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                                <Phone className="h-3 w-3" />{app.phone_number || 'Not provided'}
                              </a>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">County</span>
                              <span className="font-medium">{app.county || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Sub-County</span>
                              <span className="font-medium">{app.sub_county || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Ward</span>
                              <span className="font-medium">{app.ward || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Gender</span>
                              <span className="font-medium">{app.gender || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">National ID</span>
                              <span className="font-medium">{app.national_id ? `***${app.national_id.slice(-4)}` : 'Not provided'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Experience</span>
                              <span className="font-medium">{app.experience_years ? `${app.experience_years} years` : 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Education</span>
                              <span className="font-medium">{app.education_level || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Availability</span>
                              <Badge className="bg-green-100 text-green-800 text-xs">{app.availability_status}</Badge>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Jobs Completed</span>
                              <span className="font-medium">{app.total_jobs_completed}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Expected Daily Rate</span>
                              <span className="font-medium text-green-600">{app.daily_rate ? `KES ${app.daily_rate.toLocaleString()}` : 'Negotiable'}</span>
                            </div>
                          </div>

                          {/* Skills */}
                          {app.skills.length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-xs block mb-1 flex items-center gap-1">
                                <Wrench className="h-3 w-3" /> All Skills
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {app.skills.map((skill, i) => <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>)}
                              </div>
                            </div>
                          )}

                          {/* Certifications */}
                          {app.certifications.length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-xs block mb-1 flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" /> Certifications
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {app.certifications.map((cert, i) => <Badge key={i} variant="outline" className="text-xs">{cert}</Badge>)}
                              </div>
                            </div>
                          )}

                          {/* Languages & Transport */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {app.languages.length > 0 && (
                              <div>
                                <span className="text-muted-foreground text-xs block mb-1 flex items-center gap-1">
                                  <Globe className="h-3 w-3" /> Languages
                                </span>
                                <span className="font-medium">{app.languages.join(', ')}</span>
                              </div>
                            )}
                            {app.transport_means.length > 0 && (
                              <div>
                                <span className="text-muted-foreground text-xs block mb-1">Transport</span>
                                <span className="font-medium">{app.transport_means.join(', ')}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {app.status === 'pending' && (
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                size="sm" variant="outline"
                                onClick={() => handleReviewApplication(app.id, 'rejected')}
                                disabled={processingApplication === app.id}
                                className="text-destructive hover:text-destructive flex-1 sm:flex-none"
                              >
                                {processingApplication === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><XCircle className="h-3 w-3 mr-1" />Reject</>}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReviewApplication(app.id, 'accepted')}
                                disabled={processingApplication === app.id}
                                className="flex-1 sm:flex-none"
                              >
                                {processingApplication === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle className="h-3 w-3 mr-1" />Hire Worker</>}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Job Dialog */}
      <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-lg max-h-[90dvh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg pr-8">Post Job Opening</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 space-y-3 py-2 pr-1">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium">Job Title</label>
              <Input value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} placeholder="e.g., Mason, Electrician" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium">Description</label>
              <Textarea value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} placeholder="Job requirements..." rows={2} className="text-sm resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium">Location</label>
              <Input value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} placeholder="Project site location" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium">Required Skills</label>
              <Input value={newJob.required_skills} onChange={(e) => setNewJob({...newJob, required_skills: e.target.value})} placeholder="masonry, carpentry (comma-separated)" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium">Min Wage/Day</label>
                <Input type="number" value={newJob.wage_min} onChange={(e) => setNewJob({...newJob, wage_min: e.target.value})} placeholder="1000" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium">Max Wage/Day</label>
                <Input type="number" value={newJob.wage_max} onChange={(e) => setNewJob({...newJob, wage_max: e.target.value})} placeholder="2000" className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium">Duration (days)</label>
                <Input type="number" value={newJob.duration_days} onChange={(e) => setNewJob({...newJob, duration_days: e.target.value})} placeholder="30" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium">Positions</label>
                <Input type="number" value={newJob.positions_available} onChange={(e) => setNewJob({...newJob, positions_available: e.target.value})} placeholder="5" className="text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCreateJob(false)} size="sm" className="flex-1 sm:flex-none">Cancel</Button>
            <Button onClick={handleCreateJob} disabled={creating} size="sm" className="flex-1 sm:flex-none">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Post Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Worker Search Dialog */}
      <Dialog open={showWorkerSearch} onOpenChange={setShowWorkerSearch}>
        <DialogContent className={cn("max-h-[80vh] overflow-auto", isMobile ? 'max-w-[95vw]' : 'max-w-2xl')}>
          <DialogHeader><DialogTitle>Citizen Worker Registry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by skill..." value={searchSkill} onChange={(e) => setSearchSkill(e.target.value)} className="pl-10" />
            </div>
            {filteredWorkers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No workers found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWorkers.slice(0, 10).map((worker) => (
                  <div key={worker.id} className={cn("p-4 border rounded-lg hover:bg-muted/50", isMobile ? 'space-y-3' : 'flex items-center justify-between')}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Verified Worker</span>
                        {worker.rating && <Badge variant="outline" className="text-amber-600">★ {worker.rating.toFixed(1)}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />{worker.county}
                        {worker.experience_years && <span>• {worker.experience_years} years exp.</span>}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {worker.skills?.slice(0, 4).map((skill, i) => <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>)}
                      </div>
                    </div>
                    <div className={isMobile ? 'flex items-center justify-between' : 'text-right'}>
                      {worker.daily_rate && <div className="font-medium">KES {worker.daily_rate.toLocaleString()}/day</div>}
                      <Badge className="bg-green-100 text-green-800 mt-1">{worker.availability_status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-center text-muted-foreground">Post a job to receive applications from these workers</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkforceHiringPanel;
