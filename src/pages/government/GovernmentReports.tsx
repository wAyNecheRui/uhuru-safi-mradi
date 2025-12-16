import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, Clock, MapPin, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';

const GovernmentReports = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Citizen Reports' }
  ];

  const reports = [
    {
      id: 'RPT-001',
      title: 'Pothole on Mombasa Road near Junction Mall',
      status: 'In Progress',
      priority: 'High',
      reportedDate: '2024-01-15',
      location: 'Nairobi County, Embakasi',
      reportedBy: 'Citizen ID: xxx-xxx-001',
      assignedContractor: 'Kenya Roads Construction Ltd',
      votes: 156,
      estimatedCost: 'KES 45,000'
    },
    {
      id: 'RPT-002',
      title: 'Water Pipeline Leak near Kasarani Stadium',
      status: 'Pending Assignment',
      priority: 'Critical',
      reportedDate: '2024-01-20',
      location: 'Nairobi County, Kasarani',
      reportedBy: 'Citizen ID: xxx-xxx-002',
      votes: 234,
      estimatedCost: 'KES 25,000'
    },
    {
      id: 'RPT-003',
      title: 'Broken Street Light on Kimathi Street',
      status: 'Completed',
      priority: 'Medium',
      reportedDate: '2024-01-10',
      location: 'Nairobi County, CBD',
      reportedBy: 'Citizen ID: xxx-xxx-003',
      assignedContractor: 'City Lighting Solutions',
      completedDate: '2024-01-18',
      votes: 89,
      actualCost: 'KES 12,500'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'pending assignment': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header 
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
      />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Citizen Reports</h1>
          <p className="text-gray-600">Review and manage citizen-reported infrastructure issues across all counties.</p>
        </div>

        <div className="space-y-6">
          {reports.map((report) => (
            <Card key={report.id} className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{report.title}</CardTitle>
                    <div className="flex items-center text-sm text-gray-500 space-x-4 mb-2">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {report.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Reported: {new Date(report.reportedDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {report.votes} citizen votes
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Reported by: {report.reportedBy}</p>
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
                  {report.estimatedCost && (
                    <Badge variant="outline" className="text-purple-600">
                      Est. Cost: {report.estimatedCost}
                    </Badge>
                  )}
                  {report.actualCost && (
                    <Badge variant="outline" className="text-green-600">
                      Actual Cost: {report.actualCost}
                    </Badge>
                  )}
                </div>

                {report.assignedContractor && (
                  <div className="mb-3">
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Assigned Contractor:</span>
                      <span className="text-gray-900 ml-1">{report.assignedContractor}</span>
                    </p>
                  </div>
                )}

                {report.completedDate && (
                  <div className="mb-3">
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Completed:</span>
                      <span className="text-green-600 ml-1">{new Date(report.completedDate).toLocaleDateString()}</span>
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Government oversight and citizen transparency
                  </p>
                  <div className="flex gap-2">
                    {report.status === 'Pending Assignment' && (
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Assign Contractor
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default GovernmentReports;
