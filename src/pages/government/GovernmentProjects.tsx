
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, MapPin, Calendar, DollarSign, Users } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';

const GovernmentProjects = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Projects Overview' }
  ];

  const projects = [
    {
      id: 'GOV-001',
      title: 'Nairobi Roads Infrastructure Upgrade',
      status: 'Active',
      budget: 'KES 45.2M',
      contractor: 'Kenya Roads Construction Ltd',
      progress: 68,
      startDate: '2023-08-15',
      expectedCompletion: '2024-06-30',
      county: 'Nairobi',
      beneficiaries: '2.1M citizens'
    },
    {
      id: 'GOV-002',
      title: 'Mombasa Water Supply Enhancement',
      status: 'Planning',
      budget: 'KES 32.8M',
      contractor: 'Pending Assignment',
      progress: 0,
      startDate: '2024-03-01',
      expectedCompletion: '2024-12-15',
      county: 'Mombasa',
      beneficiaries: '850K citizens'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header 
        currentLanguage="en"
        onLanguageChange={() => {}}
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
        getText={(en: string) => en}
      />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Government Projects</h1>
          <p className="text-gray-600">Monitor and manage all government infrastructure projects across Kenya.</p>
        </div>

        <div className="space-y-6">
          {projects.map((project) => (
            <Card key={project.id} className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {project.county} County
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {project.beneficiaries}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(project.startDate).toLocaleDateString()} - {new Date(project.expectedCompletion).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{project.budget}</div>
                    <Badge variant="outline" className="text-xs">
                      {project.id}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Project Progress</span>
                    <span className="text-sm font-bold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      <span className="font-medium">Contractor:</span> {project.contractor}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      <span className="font-medium">Budget:</span> {project.budget}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      Manage Project
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

export default GovernmentProjects;
