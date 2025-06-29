import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Clock, FileText, Eye } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';

const CitizenTrackReports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Track Reports' }
  ];

  const reports = [
    {
      id: 'UWZ-RPT-001',
      title: 'Pothole on Mombasa Road near Junction Mall',
      status: 'In Progress',
      priority: 'High',
      date: '2024-01-15',
      location: 'Nairobi County, Embakasi',
      contractor: 'Kenya Roads Construction Ltd',
      estimatedCompletion: '2024-01-25',
      updates: 3
    },
    {
      id: 'UWZ-RPT-002',
      title: 'Broken Street Light on Kimathi Street',
      status: 'Completed',
      priority: 'Medium',
      date: '2024-01-10',
      location: 'Nairobi County, CBD',
      contractor: 'City Lighting Solutions',
      completedDate: '2024-01-18',
      updates: 5
    },
    {
      id: 'UWZ-RPT-003',
      title: 'Water Pipeline Leak near Kasarani Stadium',
      status: 'Pending Assignment',
      priority: 'Critical',
      date: '2024-01-20',
      location: 'Nairobi County, Kasarani',
      updates: 1
    }
  ];

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending assignment': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header 
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
      />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track My Reports</h1>
          <p className="text-gray-600">Monitor the progress of your submitted infrastructure reports.</p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by report ID or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-6">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'No reports match your search criteria.' : 'You haven\'t submitted any reports yet.'}
                </p>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <a href="/citizen/report">Submit Your First Report</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{report.title}</CardTitle>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {report.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Reported: {new Date(report.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {report.id}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                    <Badge className={getPriorityColor(report.priority)}>
                      {report.priority} Priority
                    </Badge>
                    <Badge variant="outline" className="text-blue-600">
                      {report.updates} Update{report.updates !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {report.contractor && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        Assigned Contractor: <span className="text-gray-900">{report.contractor}</span>
                      </p>
                    </div>
                  )}

                  {report.estimatedCompletion && report.status === 'In Progress' && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        Estimated Completion: <span className="text-green-600">{new Date(report.estimatedCompletion).toLocaleDateString()}</span>
                      </p>
                    </div>
                  )}

                  {report.completedDate && report.status === 'Completed' && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        Completed: <span className="text-green-600">{new Date(report.completedDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Track progress and receive SMS updates
                    </p>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default CitizenTrackReports;
