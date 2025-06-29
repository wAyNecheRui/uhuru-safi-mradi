import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, FileText, DollarSign, Clock, TrendingUp, Award } from 'lucide-react';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import Header from '@/components/Header';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';

const ContractorDashboard = () => {
  const { isMobile, isTablet } = useResponsive();

  const quickActions = [
    {
      title: 'Browse Projects',
      description: 'Find and bid on available government projects',
      icon: Briefcase,
      href: '/contractor/bidding',
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-blue-600'
    },
    {
      title: 'My Projects',
      description: 'Manage your active and completed projects',
      icon: FileText,
      href: '/contractor/projects',
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-green-600'
    }
  ];

  const stats = [
    { label: 'Active Projects', value: '3', icon: Briefcase, color: 'text-blue-600' },
    { label: 'Completed Projects', value: '12', icon: Award, color: 'text-green-600' },
    { label: 'Total Earnings', value: 'KES 2.4M', icon: DollarSign, color: 'text-purple-600' },
    { label: 'Success Rate', value: '95%', icon: TrendingUp, color: 'text-orange-600' }
  ];

  const activeProjects = [
    {
      id: 'PRJ-001',
      title: 'Mombasa Road Repairs - Phase 2',
      county: 'Nairobi County',
      value: 'KES 850,000',
      progress: 75,
      deadline: '2024-02-15',
      status: 'On Track'
    },
    {
      id: 'PRJ-002',
      title: 'Kasarani Street Lighting Installation',
      county: 'Nairobi County',
      value: 'KES 320,000',
      progress: 45,
      deadline: '2024-01-30',
      status: 'In Progress'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header 
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
      />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav />
          
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Contractor Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your projects, bids, and track your performance.</p>
          </div>

          {/* Stats Cards */}
          <div className={`grid gap-4 sm:gap-6 mb-6 sm:mb-8 ${
            isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-2' : 'grid-cols-4'
          }`}>
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <Card key={stat.label} className="shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className={`grid gap-4 sm:gap-6 mb-6 sm:mb-8 ${
            isMobile ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.title} to={action.href}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
                    <CardHeader className="text-center pb-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-gray-200 transition-colors">
                        <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 ${action.iconColor}`} />
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

          {/* Active Projects */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeProjects.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">No active projects.</p>
                  <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700" size={isMobile ? "sm" : "default"}>
                    <Link to="/contractor/bidding">Browse Available Projects</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{project.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">{project.county}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-green-600 text-sm sm:text-base">{project.value}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {project.id}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-xs sm:text-sm mb-1">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm gap-2">
                        <div className="flex items-center text-gray-500">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Due: {new Date(project.deadline).toLocaleDateString()}
                        </div>
                        <Badge className="bg-green-100 text-green-800 self-start sm:self-center">
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Button variant="outline" asChild size={isMobile ? "sm" : "default"}>
                      <Link to="/contractor/projects">View All Projects</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ContractorDashboard;
