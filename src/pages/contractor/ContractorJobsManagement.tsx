import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Briefcase, MapPin, Clock, Plus, Loader2, Eye,
  CheckCircle, XCircle, Star, Phone, User, GraduationCap,
  FileText, Globe, Wrench, Wallet, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import WorkerAttendanceTracker from '@/components/contractor/WorkerAttendanceTracker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { NotificationService } from '@/services/NotificationService';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

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
  status: string;
  created_at: string;
  project_id: string;
  project_title?: string;
  project_status?: string;
}

interface ApplicantDetail {
  id: string;
  status: string;
  applicant_id: string;
  application_message?: string;
  applied_at?: string;
  full_name?: string;
  phone_number?: string;
  county?: string;
  sub_county?: string;
  ward?: string;
  national_id?: string;
  gender?: string;
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

const ContractorJobsManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<WorkforceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<WorkforceJob | null>(null);
  const [applicants, setApplicants] = useState<ApplicantDetail[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);
  const [showAttendance, setShowAttendance] = useState<string | null>(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '', description: '', location: '',
    required_skills: '', wage_min: '', wage_max: '',
    duration_days: '', positions_available: '1', project_id: ''
  });
  const [contractorProjects, setContractorProjects] = useState<{id: string; title: string}[]>([]);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'Job Postings' }
  ];

  useRealtimeSubscription({
    subscriptions: [
      { table: 'workforce_jobs', event: '*' },
      { table: 'job_applications', event: '*' }
    ],
    onDataChange: () => fetchJobs(),
    channelPrefix: 'contractor-jobs',
    enabled: !!user
  });

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workforce_jobs')
        .select(`*, projects(title, status)`)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch applicant counts
      const jobsWithCounts = await Promise.all(
        (data || []).map(async (job) => {
          const { count } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);

          return {
            ...job,
            project_title: job.projects?.title || 'Unknown Project',
            project_status: job.projects?.status || 'unknown',
            applicants_count: count || 0
          };
        })
      );

      setJobs(jobsWithCounts);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchContractorProjects = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('projects')
      .select('id, title, status')
      .eq('contractor_id', user.id)
      .not('status', 'in', '("completed","cancelled")');
    setContractorProjects(data || []);
  };

  useEffect(() => {
    fetchJobs();
    fetchContractorProjects();
  }, [user, fetchJobs]);

  const fetchApplicants = async (job: WorkforceJob) => {
    setLoadingApplicants(true);
    setSelectedJob(job);
    try {
      const { data: applications, error } = await supabase
        .from('job_applications')
        .select('id, status, applicant_id, application_message, applied_at')
        .eq('job_id', job.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      const detailed: ApplicantDetail[] = await Promise.all(
        (applications || []).map(async (app) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, phone_number, county, sub_county, ward, national_id, gender')
            .eq('user_id', app.applicant_id)
            .maybeSingle();

          const { data: worker } = await supabase
            .from('citizen_workers')
            .select('skills, experience_years, rating, daily_rate, education_level, certifications, languages, total_jobs_completed, availability_status, transport_means, phone_number')
            .eq('user_id', app.applicant_id)
            .maybeSingle();

          return {
            id: app.id,
            status: app.status,
            applicant_id: app.applicant_id,
            application_message: app.application_message,
            applied_at: app.applied_at,
            full_name: profile?.full_name || 'Unknown',
            phone_number: worker?.phone_number || profile?.phone_number || '',
            county: profile?.county || '',
            sub_county: profile?.sub_county || '',
            ward: profile?.ward || '',
            national_id: profile?.national_id || '',
            gender: profile?.gender || '',
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

      setApplicants(detailed);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      toast({ title: "Error", description: "Failed to load applicants", variant: "destructive" });
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleReviewApplication = async (applicationId: string, status: 'accepted' | 'rejected') => {
    setProcessingId(applicationId);
    try {
      if (!user) throw new Error('Not authenticated');
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
          ? `${application?.full_name} has been notified and can now join your project.`
          : "The applicant has been notified."
      });

      if (selectedJob) fetchApplicants(selectedJob);
      fetchJobs();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.description || !newJob.project_id) {
      toast({ title: "Missing Information", description: "Please fill in title, description, and select a project", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('workforce_jobs').insert({
        title: newJob.title,
        description: newJob.description,
        location: newJob.location,
        required_skills: newJob.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        wage_min: newJob.wage_min ? parseFloat(newJob.wage_min) : null,
        wage_max: newJob.wage_max ? parseFloat(newJob.wage_max) : null,
        duration_days: newJob.duration_days ? parseInt(newJob.duration_days) : null,
        positions_available: parseInt(newJob.positions_available) || 1,
        project_id: newJob.project_id,
        created_by: user.id
      });
      if (error) throw error;
      toast({ title: "Job Posted", description: "Your job has been posted to the Citizen Worker Registry" });
      setShowCreateJob(false);
      setNewJob({ title: '', description: '', location: '', required_skills: '', wage_min: '', wage_max: '', duration_days: '', positions_available: '1', project_id: '' });
      fetchJobs();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return 'Unknown';
    return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <Badge className="bg-green-100 text-green-800">Hired</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const openJobs = jobs.filter(j => j.status === 'open');
  const closedJobs = jobs.filter(j => j.status !== 'open');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Job Postings & Applicants</h1>
              <p className="text-sm text-muted-foreground">Manage your workforce job postings and review citizen applicants</p>
            </div>
            <Button onClick={() => setShowCreateJob(true)}>
              <Plus className="h-4 w-4 mr-2" />Create Job
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Job Postings Yet</h3>
                <p className="text-muted-foreground mb-4">Create job postings to hire local workers for your projects</p>
                <Button onClick={() => setShowCreateJob(true)}>
                  <Plus className="h-4 w-4 mr-2" />Post Your First Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="open" className="space-y-4">
              <TabsList>
                <TabsTrigger value="open">Open Jobs ({openJobs.length})</TabsTrigger>
                <TabsTrigger value="closed">Closed/Filled ({closedJobs.length})</TabsTrigger>
              </TabsList>

              {['open', 'closed'].map(tab => (
                <TabsContent key={tab} value={tab} className="space-y-4">
                  {(tab === 'open' ? openJobs : closedJobs).map(job => {
                    const isProjectCompleted = job.project_status === 'completed' || job.project_status === 'cancelled';
                    return (
                    <Card key={job.id} className={`shadow-md ${isProjectCompleted ? 'opacity-75' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Briefcase className="h-5 w-5 text-primary" />
                              {job.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Project: <span className="font-medium">{job.project_title}</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {isProjectCompleted && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Project Completed
                              </Badge>
                            )}
                            <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>{job.status}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm">{job.description}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
                          {job.wage_min && (
                            <span className="flex items-center gap-1">
                              <Wallet className="h-4 w-4" />KES {job.wage_min.toLocaleString()}{job.wage_max && ` - ${job.wage_max.toLocaleString()}`}/day
                            </span>
                          )}
                          {job.duration_days && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{job.duration_days} days</span>}
                          <span className="flex items-center gap-1"><Users className="h-4 w-4" />{job.positions_available} positions</span>
                        </div>
                        {job.required_skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {job.required_skills.map((skill, i) => <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>)}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button size="sm" onClick={() => fetchApplicants(job)}>
                            <Eye className="h-4 w-4 mr-1" />View Applicants ({(job as any).applicants_count || 0})
                          </Button>
                          {!isProjectCompleted && (
                            <Button size="sm" variant="outline" onClick={() => setShowAttendance(showAttendance === job.id ? null : job.id)}>
                              <Users className="h-4 w-4 mr-1" />Attendance & Pay
                            </Button>
                          )}
                        </div>

                        {showAttendance === job.id && (
                          <div className="mt-4">
                            <WorkerAttendanceTracker 
                              jobId={job.id} 
                              dailyRate={job.wage_min || 1000} 
                              onUpdate={fetchJobs} 
                              readOnly={isProjectCompleted}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    );
                  })}
                  {(tab === 'open' ? openJobs : closedJobs).length === 0 && (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No {tab} jobs found.
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </ResponsiveContainer>
      </main>

      {/* Applicants Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-3xl max-h-[90dvh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 pr-8">
              <Users className="h-5 w-5 text-primary" />
              Applicants for: {selectedJob?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 py-2">
            {loadingApplicants ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : applicants.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No applicants yet for this job.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applicants.map((app) => {
                  const isExpanded = expandedApplicant === app.id;
                  return (
                    <div key={app.id} className="border rounded-lg overflow-hidden">
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedApplicant(isExpanded ? null : app.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <User className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold">{app.full_name}</h4>
                              {getStatusBadge(app.status)}
                              {app.rating > 0 && (
                                <Badge variant="outline" className="text-amber-600 text-xs">
                                  <Star className="h-3 w-3 mr-1 fill-current" />{app.rating.toFixed(1)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                              {app.county && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.county}{app.sub_county && `, ${app.sub_county}`}</span>}
                              {app.phone_number && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.phone_number}</span>}
                              {app.experience_years > 0 && <span>{app.experience_years}y exp.</span>}
                              {app.total_jobs_completed > 0 && <span>{app.total_jobs_completed} jobs done</span>}
                            </div>
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
                            {isExpanded ? <ChevronUp className="h-4 w-4 mx-auto mt-1" /> : <ChevronDown className="h-4 w-4 mx-auto mt-1" />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t bg-muted/20 p-4 space-y-4">
                          <h5 className="font-semibold text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Full Applicant Profile
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div><span className="text-muted-foreground text-xs block">Full Name</span><span className="font-medium">{app.full_name}</span></div>
                            <div><span className="text-muted-foreground text-xs block">Phone</span><a href={`tel:${app.phone_number}`} className="font-medium text-primary hover:underline flex items-center gap-1"><Phone className="h-3 w-3" />{app.phone_number || 'Not provided'}</a></div>
                            <div><span className="text-muted-foreground text-xs block">County</span><span className="font-medium">{app.county || 'Not specified'}</span></div>
                            <div><span className="text-muted-foreground text-xs block">Sub-County</span><span className="font-medium">{app.sub_county || 'Not specified'}</span></div>
                            <div><span className="text-muted-foreground text-xs block">Ward</span><span className="font-medium">{app.ward || 'Not specified'}</span></div>
                            <div><span className="text-muted-foreground text-xs block">Gender</span><span className="font-medium">{app.gender || 'Not specified'}</span></div>
                            <div><span className="text-muted-foreground text-xs block">National ID</span><span className="font-medium">{app.national_id ? `***${app.national_id.slice(-4)}` : 'Not provided'}</span></div>
                            <div><span className="text-muted-foreground text-xs block">Experience</span><span className="font-medium">{app.experience_years ? `${app.experience_years} years` : 'Not specified'}</span></div>
                            <div><span className="text-muted-foreground text-xs block">Education</span><span className="font-medium">{app.education_level || 'Not specified'}</span></div>
                            <div><span className="text-muted-foreground text-xs block">Daily Rate</span><span className="font-medium text-green-600">{app.daily_rate ? `KES ${app.daily_rate.toLocaleString()}` : 'Not set'}</span></div>
                            <div><span className="text-muted-foreground text-xs block">Jobs Completed</span><span className="font-medium">{app.total_jobs_completed}</span></div>
                            <div><span className="text-muted-foreground text-xs block">Availability</span><Badge className="bg-green-100 text-green-800 text-xs">{app.availability_status}</Badge></div>
                          </div>

                          {app.skills.length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-xs block mb-1">Skills</span>
                              <div className="flex flex-wrap gap-1">
                                {app.skills.map((skill, i) => <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>)}
                              </div>
                            </div>
                          )}

                          {app.certifications?.length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-xs block mb-1">Certifications</span>
                              <div className="flex flex-wrap gap-1">
                                {app.certifications.map((cert, i) => <Badge key={i} variant="outline" className="text-xs">{cert}</Badge>)}
                              </div>
                            </div>
                          )}

                          {app.languages?.length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-xs block mb-1">Languages</span>
                              <span className="text-sm">{app.languages.join(', ')}</span>
                            </div>
                          )}

                          {app.transport_means?.length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-xs block mb-1">Transport</span>
                              <span className="text-sm">{app.transport_means.join(', ')}</span>
                            </div>
                          )}

                          {app.application_message && (
                            <div className="bg-background p-3 rounded border">
                              <span className="text-muted-foreground text-xs block mb-1">Application Message</span>
                              <p className="text-sm">{app.application_message}</p>
                            </div>
                          )}

                          {app.status === 'pending' && !(selectedJob?.project_status === 'completed' || selectedJob?.project_status === 'cancelled') && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleReviewApplication(app.id, 'accepted'); }}
                                disabled={!!processingId}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingId === app.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                Hire Worker
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); handleReviewApplication(app.id, 'rejected'); }}
                                disabled={!!processingId}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />Reject
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
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[90dvh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="pr-8">Create New Job Posting</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
            <div>
              <label className="text-sm font-medium">Project *</label>
              <select
                className="w-full mt-1 p-2 border rounded-md text-sm"
                value={newJob.project_id}
                onChange={(e) => setNewJob(prev => ({ ...prev, project_id: e.target.value }))}
              >
                <option value="">Select a project</option>
                {contractorProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Job Title *</label>
              <Input value={newJob.title} onChange={e => setNewJob(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Mason / Plumber" />
            </div>
            <div>
              <label className="text-sm font-medium">Description *</label>
              <Textarea value={newJob.description} onChange={e => setNewJob(prev => ({ ...prev, description: e.target.value }))} placeholder="Job responsibilities..." />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input value={newJob.location} onChange={e => setNewJob(prev => ({ ...prev, location: e.target.value }))} placeholder="e.g. Kasarani, Nairobi" />
            </div>
            <div>
              <label className="text-sm font-medium">Required Skills (comma separated)</label>
              <Input value={newJob.required_skills} onChange={e => setNewJob(prev => ({ ...prev, required_skills: e.target.value }))} placeholder="e.g. Masonry, Plumbing" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Min Wage (KES/day)</label>
                <Input type="number" value={newJob.wage_min} onChange={e => setNewJob(prev => ({ ...prev, wage_min: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Max Wage (KES/day)</label>
                <Input type="number" value={newJob.wage_max} onChange={e => setNewJob(prev => ({ ...prev, wage_max: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Duration (days)</label>
                <Input type="number" value={newJob.duration_days} onChange={e => setNewJob(prev => ({ ...prev, duration_days: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Positions</label>
                <Input type="number" value={newJob.positions_available} onChange={e => setNewJob(prev => ({ ...prev, positions_available: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateJob(false)}>Cancel</Button>
            <Button onClick={handleCreateJob} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Post Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractorJobsManagement;
