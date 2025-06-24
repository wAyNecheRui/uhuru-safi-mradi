
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, DollarSign, MapPin, Calendar, Award } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';

const ContractorProjects = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'My Projects' }
  ];

  const activeProjects = [
    {
      id: 'PRJ-001',
      title: 'Mombasa Road Repairs - Phase 2',
      county: 'Nairobi County',
      value: 'KES 850,000',
      progress: 75,
      startDate: '2023-12-01',
      deadline: '2024-02-15',
      status: 'On Track',
      description: 'Road surface repair and pothole filling along Mombasa Road from Junction Mall to Belle Vue'
    },
    {
      id: 'PRJ-002',
      title: 'Kasarani Street Lighting Installation',
      county: 'Nairobi County',
      value: 'KES 320,000',
      progress: 45,
      startDate: '2024-01-05',
      deadline: '2024-01-30',
      status: 'In Progress',
      description: 'Installation of LED street lights along Kasarani main road and adjacent streets'
    }
  ];

  const completedProjects = [
    {
      id: 'PRJ-C001',
      title: 'Thika Road Bridge Maintenance',
      county: 'Kiambu County',
      value: 'KES 1,200,000',
      completedDate: '2023-11-30',
      rating: 4.8,
      description: 'Structural maintenance and painting of Thika Road bridge infrastructure'
    },
    {
      id: 'PRJ-C002',
      title: 'Westlands Water Pipeline Extension',
      county: 'Nairobi County',
      value: 'KES 650,000',
      completedDate: '2023-10-15',
      rating: 4.9,
      description: 'Extension of water pipeline network in Westlands residential area'
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
        <BreadcrumbNav items={breadcrumbItems} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
          <p className="text-gray-600">Track and manage your active and completed government projects.</p>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
            <TabsTrigger value="active" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Active Projects ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Completed Projects ({completedProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeProjects.map((project) => (
              <Card key={project.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                      <p className="text-gray-600">{project.description}</p>
                      <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {project.county}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Started: {new Date(project.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 mb-1">{project.value}</div>
                      <Badge variant="outline" className="text-xs">
                        {project.id}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Project Progress</span>
                      <span className="font-bold">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Deadline: {new Date(project.deadline).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        {project.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Update Progress
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {completedProjects.map((project) => (
              <Card key={project.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                      <p className="text-gray-600">{project.description}</p>
                      <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {project.county}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Completed: {new Date(project.completedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 mb-1">{project.value}</div>
                      <Badge variant="outline" className="text-xs">
                        {project.id}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="font-medium">Rating: {project.rating}/5.0</span>
                      <div className="flex ml-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(project.rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                      <Button size="sm" variant="outline">
                        View Certificate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ContractorProjects;
