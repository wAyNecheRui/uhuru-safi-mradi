import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Users, MapPin, Clock, Shield, CheckCircle, Wallet, Loader2, Wrench, Eye, BookOpen, Briefcase, Map, BarChart3 } from 'lucide-react';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/contexts/AuthContext';
import { useCitizenData } from '@/hooks/useCitizenData';
import { useRealtimeSubscription, REALTIME_PRESETS } from '@/hooks/useRealtimeSubscription';

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const { user, isAuthenticated, signOut } = useAuth();
  const { reports, stats, isLoading, hasError } = useCitizenData();

  const quickActions = [
    { title: 'Report a Problem', description: 'Document infrastructure issues with photos and GPS', icon: AlertTriangle, href: '/citizen/report', badge: 'Primary' },
    { title: 'Community Validation', description: 'Vote and verify community-reported problems', icon: Users, href: '/citizen/voting', badge: 'Verify' },
    { title: 'Track My Reports', description: 'Monitor progress of your submitted reports', icon: FileText, href: '/citizen/track', badge: 'Track' },
    { title: 'Monitor Projects', description: 'Track active projects and verify milestones', icon: Map, href: '/citizen/projects', badge: 'Monitor' },
  ];

  const additionalActions = [
    { title: 'My Jobs', description: 'View your hired jobs and daily earnings', icon: Wallet, href: '/citizen/my-jobs' },
    { title: 'Skills Registration', description: 'Register your skills for project opportunities', icon: Wrench, href: '/citizen/skills' },
    { title: 'Job Opportunities', description: 'Find and apply for local workforce jobs', icon: Briefcase, href: '/citizen/workforce' },
    { title: 'Transparency Portal', description: 'View public data, budgets, and contractor ratings', icon: Eye, href: '/citizen/transparency' },
    { title: 'System Visuals', description: 'View detailed performance charts and graphs', icon: BarChart3, href: '/visuals' },
    { title: 'Citizen Guide', description: 'Learn how to use the platform effectively', icon: BookOpen, href: '/citizen/guide' },
  ];

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase().replace(/_/g, ' ') || 'pending';
    if (s === 'completed') return 'success' as const;
    if (s.includes('progress')) return 'warning' as const;
    if (s.includes('rejected')) return 'destructive' as const;
    return 'secondary' as const;
  };

  const formatDate = (dateString: string) => {
    const diffInHours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60));
    return diffInHours < 24 ? `${diffInHours}h ago` : `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getVerificationBadge = () => {
    if (stats?.verificationStatus === 'verified') return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" />Verified Citizen</Badge>;
    if (stats?.verificationStatus === 'pending') return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" />Verification Pending</Badge>;
    return <Badge variant="outline">Unverified</Badge>;
  };

  if (!isAuthenticated || !user) return null;

  if (hasError) {
    return (
      <div className="min-h-screen bg-background">
        <main>
          <ResponsiveContainer className="py-6 sm:py-8">
            <Card className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-accent mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Session Issue</h2>
              <p className="text-muted-foreground mb-4">Your session may have expired. Please sign in again.</p>
              <Button onClick={async () => { await signOut(); navigate('/auth', { replace: true }); }}>Sign in again</Button>
            </Card>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <main className="w-full max-w-full overflow-x-hidden">
        <ResponsiveContainer className="py-5 sm:py-8">
          <BreadcrumbNav />

          {/* Welcome Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                  Welcome back, {user.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Lead community change by identifying problems and contributing your skills.
                </p>
              </div>
              {getVerificationBadge()}
            </div>
          </div>

          {/* Stats Row */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground text-sm">Loading dashboard...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {[
                { label: 'Problems Reported', value: stats?.totalReports || 0, color: 'text-primary', bg: 'bg-primary/5' },
                { label: 'Under Review', value: stats?.underReviewReports || 0, color: 'text-accent-foreground', bg: 'bg-accent/10' },
                { label: 'Resolved', value: stats?.completedReports || 0, color: 'text-success', bg: 'bg-success/10' },
                { label: 'Validations', value: stats?.communityVotes || 0, color: 'text-info', bg: 'bg-info/10' }
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center border border-transparent`}>
                  <div className={`text-lg sm:text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.title}
                    className="cursor-pointer hover:shadow-card-hover transition-all duration-200 group border-border/60"
                    onClick={() => navigate(action.href)}
                  >
                    <CardContent className="p-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm text-foreground">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* More Features */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">More Features</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {additionalActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.title}
                    className="cursor-pointer hover:shadow-card-hover transition-all duration-200 group border-border/60"
                    onClick={() => navigate(action.href)}
                  >
                    <CardContent className="p-4">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-2.5 group-hover:bg-primary/10 transition-colors">
                        <Icon className="h-4 w-4 text-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="font-medium text-sm text-foreground">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{action.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recent Reports & Community Role */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  My Community Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading your impact...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Start making an impact in your community.</p>
                    <Button asChild size="sm"><Link to="/citizen/report">Report Your First Problem</Link></Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 3).map((report) => (
                      <div key={report.id} className="border border-border rounded-xl overflow-hidden hover:shadow-card-hover transition-all duration-200">
                        {report.photo_urls && report.photo_urls.length > 0 ? (
                          <div className="w-full h-[140px] overflow-hidden bg-muted">
                            <img src={report.photo_urls[0]} alt={report.title} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        ) : (
                          <div className="w-full h-[72px] bg-muted/50 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="p-3.5">
                          <h3 className="font-semibold text-sm text-foreground">{report.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                          <div className="flex flex-wrap items-center text-xs text-muted-foreground mt-2 gap-3">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{report.location || 'N/A'}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(report.created_at)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            <Badge variant={getStatusColor((report as any).effective_status || report.status || 'pending')} className="text-[10px]">
                              {((report as any).effective_status || report.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                            {(report as any).project_id && (
                              <Badge variant="success" className="text-[10px]">Project Active</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm" asChild><Link to="/citizen/track">View All My Reports</Link></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Community Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: 'Problem Identifier', desc: 'You help identify real community needs that require attention.', bg: 'bg-primary/5', text: 'text-primary' },
                  { title: 'Community Verifier', desc: 'You validate and prioritize problems reported by others.', bg: 'bg-success/10', text: 'text-success' },
                  { title: 'Skilled Contributor', desc: 'You can contribute your skills to help solve community problems.', bg: 'bg-info/10', text: 'text-info' },
                ].map((role) => (
                  <div key={role.title} className={`${role.bg} p-3.5 rounded-xl`}>
                    <h4 className={`font-medium text-sm ${role.text}`}>{role.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{role.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenDashboard;
