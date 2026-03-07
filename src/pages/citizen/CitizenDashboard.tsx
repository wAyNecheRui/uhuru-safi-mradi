import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Users, MapPin, Clock, Shield, CheckCircle, Wallet, Loader2, Wrench, Eye, BookOpen, Briefcase, Map } from 'lucide-react';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import Header from '@/components/Header';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
      <Header />
      
      <main className="w-full max-w-full overflow-x-hidden">
        <ResponsiveContainer className="py-4 sm:py-6 lg:py-8">
          <BreadcrumbNav />
          
          {/* Welcome Section with User Info */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-gray-600 mt-1">
                  Lead community change by identifying problems, verifying solutions, and contributing your skills.
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                {getVerificationBadge()}
              </div>
            </div>

            {/* Stats Overview */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Loading your dashboard...</span>
              </div>
            ) : (
              <div className={`grid gap-4 mb-6 ${
                isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-4' : 'grid-cols-4'
              }`}>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats?.totalReports || 0}</div>
                    <div className="text-sm text-gray-600">Problems Reported</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats?.activeReports || 0}</div>
                    <div className="text-sm text-gray-600">Under Review</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats?.completedReports || 0}</div>
                    <div className="text-sm text-gray-600">Resolved</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats?.communityVotes || 0}</div>
                    <div className="text-sm text-gray-600">Validations</div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Citizen-First Actions - Updated Layout */}
          <div className={`grid gap-4 sm:gap-6 mb-6 sm:mb-8 ${
            isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'
          }`}>
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.title} to={action.href}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
                    <CardHeader className="text-center pb-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-gray-200 transition-colors relative">
                        <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 ${action.iconColor}`} />
                        {action.count > 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                            {action.count}
                          </Badge>
                        )}
                        <Badge className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {action.badge}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm sm:text-base lg:text-lg">{action.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center pt-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-4">{action.description}</p>
                      <Button className={`w-full ${action.color} text-white`} size={isMobile ? "sm" : "default"}>
                        Start Now
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Additional Actions Grid */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">More Features</h2>
            <div className={`grid gap-3 sm:gap-4 ${
              isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-3 lg:grid-cols-6'
            }`}>
              {additionalActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <Link key={action.title} to={action.href}>
                    <Card className="h-full hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group p-3 sm:p-4">
                      <div className="text-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-gray-200 transition-colors">
                          <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${action.iconColor}`} />
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">{action.title}</h3>
                        <Badge className={`${action.color} text-white text-xs`}>
                          {action.badge}
                        </Badge>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

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
                      <div key={report.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{report.title}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{report.description}</p>
                            <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-500 mt-2 gap-3">
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
                          <Badge variant="outline" className="text-xs font-medium self-start">
                            {report.id.substring(0, 8)}
                          </Badge>
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
