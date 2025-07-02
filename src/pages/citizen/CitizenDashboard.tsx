
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Users, MapPin, Clock, Shield, CheckCircle, Wallet, Loader2 } from 'lucide-react';
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
      title: 'Report an Issue',
      description: 'Report infrastructure problems in your area',
      icon: AlertTriangle,
      href: '/citizen/report',
      color: 'bg-red-500 hover:bg-red-600',
      iconColor: 'text-red-600',
      count: stats?.totalReports || 0
    },
    {
      title: 'Track My Reports',
      description: 'Check the status of your submitted reports',
      icon: FileText,
      href: '/citizen/track',
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-blue-600',
      count: stats?.activeReports || 0
    },
    {
      title: 'Community Voting',
      description: 'Vote on community projects and priorities',
      icon: Users,
      href: '/citizen/voting',
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-green-600',
      count: stats?.communityVotes || 0
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
      <Header 
        selectedCounty={selectedCounty}
        onCountyChange={handleCountyChange}
      />
      
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
                  Help improve your community by reporting issues and participating in decisions.
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
                    <div className="text-sm text-gray-600">Total Reports</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats?.activeReports || 0}</div>
                    <div className="text-sm text-gray-600">Active Reports</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats?.completedReports || 0}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats?.communityVotes || 0}</div>
                    <div className="text-sm text-gray-600">Votes Cast</div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={`grid gap-4 sm:gap-6 mb-6 sm:mb-8 ${
            isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'
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
                      </div>
                      <CardTitle className="text-lg sm:text-xl">{action.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-sm sm:text-base text-gray-600 mb-4">{action.description}</p>
                      <Button className={`w-full ${action.color} text-white`} size={isMobile ? "sm" : "default"}>
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Recent Reports */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                My Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-6 sm:py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">Loading your reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">No reports submitted yet.</p>
                  <Button asChild className="mt-4 bg-green-600 hover:bg-green-700" size={isMobile ? "sm" : "default"}>
                    <Link to="/citizen/report">Submit Your First Report</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {reports.slice(0, 5).map((report) => (
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
                        <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={`text-xs ${getPriorityColor(report.priority)}`}>
                          {report.priority.toUpperCase()} Priority
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {report.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Button variant="outline" asChild size={isMobile ? "sm" : "default"}>
                      <Link to="/citizen/track">View All Reports</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phase 2 Features - Additional Actions */}
          <div className="mt-6 sm:mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Services</h2>
            <div className={`grid gap-4 ${
              isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'
            }`}>
              <Link to="/citizen/workforce">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Workforce Integration</h3>
                      <p className="text-sm text-gray-600">Find local job opportunities</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/citizen/ussd">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">USSD Services</h3>
                      <p className="text-sm text-gray-600">Offline reporting options</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Card className="p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Payment Transparency</h3>
                    <p className="text-sm text-gray-600">Track project funding</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenDashboard;
