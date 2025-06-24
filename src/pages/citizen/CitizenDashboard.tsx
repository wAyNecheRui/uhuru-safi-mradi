
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Users, MapPin, Clock, CheckCircle } from 'lucide-react';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import Header from '@/components/Header';

const CitizenDashboard = () => {
  const quickActions = [
    {
      title: 'Report an Issue',
      description: 'Report infrastructure problems in your area',
      icon: AlertTriangle,
      href: '/citizen/report',
      color: 'bg-red-500 hover:bg-red-600',
      iconColor: 'text-red-600'
    },
    {
      title: 'Track My Reports',
      description: 'Check the status of your submitted reports',
      icon: FileText,
      href: '/citizen/track',
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Community Voting',
      description: 'Vote on community projects and priorities',
      icon: Users,
      href: '/citizen/voting',
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-green-600'
    }
  ];

  const recentReports = [
    {
      id: 'RPT-001',
      title: 'Pothole on Mombasa Road',
      status: 'In Progress',
      priority: 'High',
      date: '2 days ago',
      location: 'Nairobi County'
    },
    {
      id: 'RPT-002',
      title: 'Broken Street Light',
      status: 'Completed',
      priority: 'Medium',
      date: '1 week ago',
      location: 'Nairobi County'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Citizen Dashboard</h1>
          <p className="text-gray-600">Welcome! Report issues, track progress, and participate in your community.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        {/* Recent Reports */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-600" />
              My Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reports submitted yet.</p>
                <Button asChild className="mt-4 bg-green-600 hover:bg-green-700">
                  <Link to="/citizen/report">Submit Your First Report</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{report.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {report.location}
                          <Clock className="h-4 w-4 ml-4 mr-1" />
                          {report.date}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-medium">
                        {report.id}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      <Badge className={getPriorityColor(report.priority)}>
                        {report.priority} Priority
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link to="/citizen/track">View All Reports</Link>
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

export default CitizenDashboard;
