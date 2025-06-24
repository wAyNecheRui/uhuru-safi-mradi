
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, FileText, DollarSign, Clock, TrendingUp, Award } from 'lucide-react';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import Header from '@/components/Header';

const ContractorDashboard = () => {
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
        currentLanguage="en"
        onLanguageChange={() => {}}
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
        getText={(en: string) => en}
      />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contractor Dashboard</h1>
          <p className="text-gray-600">Manage your projects, bids, and track your performance.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <Card key={stat.label} className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <IconComponent className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link key={action.title} to={action.href}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
                      <IconComponent className={`h-8 w-8 ${action.iconColor}`} />
                    </div>
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 mb-4">{action.description}</p>
                    <Button className={`w-full ${action.color} text-white`}>
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
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeProjects.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active projects.</p>
                <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Link to="/contractor/bidding">Browse Available Projects</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeProjects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-500">{project.county}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{project.value}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {project.id}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
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
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        Due: {new Date(project.deadline).toLocaleDateString()}
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link to="/contractor/projects">View All Projects</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ContractorDashboard;
