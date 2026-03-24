import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Users, MapPin, Clock, Shield, CheckCircle, Wallet, Loader2, Wrench, Eye, BookOpen, Briefcase, Map } from 'lucide-react';
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
    {
      title: 'Report a Problem',
      description: 'Document infrastructure issues with photos and GPS',
      icon: AlertTriangle,
      href: '/citizen/report',
      color: 'bg-red-500 hover:bg-red-600',
      iconColor: 'text-red-600',
      count: stats?.totalReports || 0,
      badge: 'Primary'
    },
    {
      title: 'Community Validation',
      description: 'Vote and verify community-reported problems',
      icon: Users,
      href: '/citizen/voting',
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-green-600',
      count: stats?.communityVotes || 0,
      badge: 'Verify'
    },
    {
      title: 'Track My Reports',
      description: 'Monitor progress of your submitted reports',
      icon: FileText,
      href: '/citizen/track',
      color: 'bg-purple-500 hover:bg-purple-600',
      iconColor: 'text-purple-600',
      count: stats?.activeReports || 0,
      badge: 'Track'
    },
    {
      title: 'Monitor Projects',
      description: 'Track active projects and verify milestones',
      icon: Map,
      href: '/citizen/projects',
      color: 'bg-teal-500 hover:bg-teal-600',
      iconColor: 'text-teal-600',
      count: 0,
      badge: 'Monitor'
    }
  ];

  const additionalActions = [
    {
      title: 'My Jobs',
      description: 'View your hired jobs and daily earnings',
      icon: Wallet,
      href: '/citizen/my-jobs',
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-green-600',
      badge: 'Earnings'
    },
    {
      title: 'Skills Registration',
      description: 'Register your skills for project opportunities',
      icon: Wrench,
      href: '/citizen/skills',
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-blue-600',
      badge: 'Earn'
    },
    {
      title: 'Job Opportunities',
      description: 'Find and apply for local workforce jobs',
      icon: Briefcase,
      href: '/citizen/workforce',
      color: 'bg-orange-500 hover:bg-orange-600',
      iconColor: 'text-orange-600',
      badge: 'Jobs'
    },
    {
      title: 'Transparency Portal',
      description: 'View public data, budgets, and contractor ratings',
      icon: Eye,
      href: '/citizen/transparency',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      iconColor: 'text-indigo-600',
      badge: 'Data'
    },
    {
      title: 'Citizen Guide',
      description: 'Learn how to use the platform effectively',
      icon: BookOpen,
      href: '/citizen/guide',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      iconColor: 'text-cyan-600',
      badge: 'Learn'
    }
  ];

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase().replace(/_/g, ' ') || 'pending';
    switch (normalizedStatus) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': 
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'contractor selected':
      case 'contractor_selected': return 'bg-purple-100 text-purple-800';
      case 'bidding open':
      case 'bidding_open': return 'bg-orange-100 text-orange-800';
      case 'under review':
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getVerificationBadge = () => {
    switch (stats?.verificationStatus) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Verified Citizen</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Verification Pending</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            Unverified
          </Badge>
        );
    }
  };

  if (!isAuthenticated || !user) {
    return null; // Will redirect to auth
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-background">
        <main>
          <ResponsiveContainer className="py-6 sm:py-8">
            <Card className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Session Issue</h2>
              <p className="text-muted-foreground mb-4">
                Your session may have expired. Please sign in again to continue.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={async () => {
                    await signOut();
                    navigate('/auth', { replace: true });
                  }}
                >
                  Sign in again
                </Button>
              </div>
            </Card>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      
      <main className="w-full max-w-full overflow-x-hidden">
        <ResponsiveContainer className="py-4 sm:py-6 lg:py-8">
          <BreadcrumbNav />
          
          {/* Welcome Header Card - Government Style */}
          <Card className="shadow-xl border-t-4 border-t-green-600 mb-4 sm:mb-6">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 p-4 sm:p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center text-lg sm:text-xl lg:text-2xl">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-green-600 flex-shrink-0" />
                    <span className="break-words">Welcome back, {user.name}!</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Lead community change by identifying problems, verifying solutions, and contributing your skills.
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {getVerificationBadge()}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Overview - Government Style */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-muted-foreground">Loading your dashboard...</span>
            </div>
          ) : (
            <Card className="shadow-lg mb-4 sm:mb-6">
              <CardHeader>
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600 flex-shrink-0" />
                  My Impact Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats?.totalReports || 0}</div>
                    <div className="text-sm text-blue-700">Problems Reported</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{stats?.activeReports || 0}</div>
                    <div className="text-sm text-orange-700">Under Review</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats?.completedReports || 0}</div>
                    <div className="text-sm text-green-700">Resolved</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats?.communityVotes || 0}</div>
                    <div className="text-sm text-purple-700">Validations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions - Government Button Grid Style */}
          <Card className="shadow-lg mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600 flex-shrink-0" />
                Citizen Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {quickActions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={action.title}
                      onClick={() => navigate(action.href)}
                      className={`${action.color} text-white h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 text-xs relative`}
                    >
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                      <span className="text-center leading-tight break-words">{action.title}</span>
                      {action.count > 0 && (
                        <Badge className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full px-1.5 py-0.5 text-xs font-bold">
                          {action.count}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Additional Actions - Government Button Grid Style */}
          <Card className="shadow-lg mb-6 sm:mb-8">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600 flex-shrink-0" />
                More Features
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                {additionalActions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={action.title}
                      onClick={() => navigate(action.href)}
                      className={`${action.color} text-white h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 text-xs`}
                    >
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                      <span className="text-center leading-tight break-words">{action.title}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Citizen Impact Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                  My Community Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-6 sm:py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-500">Loading your impact...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-500">Start making an impact in your community.</p>
                    <Button asChild className="mt-4 bg-green-600 hover:bg-green-700" size={isMobile ? "sm" : "default"}>
                      <Link to="/citizen/report">Report Your First Problem</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {reports.slice(0, 3).map((report) => (
                      <div key={report.id} className="border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
                        {/* Hero photo */}
                        {report.photo_urls && report.photo_urls.length > 0 ? (
                          <div className="w-full h-[140px] overflow-hidden bg-muted">
                            <img 
                              src={report.photo_urls[0]} 
                              alt={report.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-[80px] bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground text-sm sm:text-base">{report.title}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                              <div className="flex flex-wrap items-center text-xs sm:text-sm text-muted-foreground mt-2 gap-3">
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  {report.location || 'Location not specified'}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  {formatDate(report.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={`text-xs ${getStatusColor((report as any).effective_status || report.status || 'pending')}`}>
                              {((report as any).effective_status || report.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityColor(report.priority || 'medium')}`}>
                              {(report.priority || 'medium').toUpperCase()} Priority
                            </Badge>
                            {(report as any).project_id && (
                              <Badge variant="outline" className="text-xs text-green-600">
                                Project Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-4">
                      <Button variant="outline" asChild size={isMobile ? "sm" : "default"}>
                        <Link to="/citizen/track">View All My Reports</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Community Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Problem Identifier</h4>
                  <p className="text-sm text-blue-700">You help identify real community needs that require attention.</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Community Verifier</h4>
                  <p className="text-sm text-green-700">You validate and prioritize problems reported by others.</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Skilled Contributor</h4>
                  <p className="text-sm text-purple-700">You can contribute your skills to help solve community problems.</p>
                </div>
              </CardContent>
            </Card>
          </div>

        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenDashboard;
