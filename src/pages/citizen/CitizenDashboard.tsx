
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Users, MapPin, Clock, Shield, CheckCircle, Wallet, Loader2, Wrench } from 'lucide-react';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import Header from '@/components/Header';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/contexts/AuthContext';
import { useCitizenData } from '@/hooks/useCitizenData';

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const { user, isAuthenticated } = useAuth();
  const { reports, stats, isLoading, hasError } = useCitizenData();
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const handleCountyChange = (county: string) => {
    console.log('Citizen Dashboard - County changed to:', county);
    setSelectedCounty(county);
  };

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
      title: 'Skills Registration',
      description: 'Register your skills for project opportunities',
      icon: Wrench,
      href: '/citizen/skills',
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-blue-600',
      count: 0,
      badge: 'Earn'
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
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Header selectedCounty={selectedCounty} onCountyChange={handleCountyChange} />
        <main>
          <ResponsiveContainer className="py-6 sm:py-8">
            <Card className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
              <p className="text-gray-600 mb-4">
                We're having trouble loading your dashboard data. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </Card>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
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
                          <Badge className={`text-xs ${getStatusColor(report.status || 'pending')}`}>
                            {(report.status || 'pending').replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(report.priority || 'medium')}`}>
                            {(report.priority || 'medium').toUpperCase()} Priority
                          </Badge>
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

          {/* Call to Action for Key Features */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Be the Change Your Community Needs</h2>
              <p className="text-green-100 mb-6">
                Every problem you report, every verification you make, and every skill you contribute 
                helps build a better Kenya for everyone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-white text-green-600 hover:bg-gray-100">
                  <Link to="/citizen/report">Report a Problem</Link>
                </Button>
                <Button asChild variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                  <Link to="/citizen/voting">Validate Reports</Link>
                </Button>
                <Button asChild variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  <Link to="/citizen/skills">Register Skills</Link>
                </Button>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenDashboard;
