import React, { useState } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import WorkforceIntegration from '@/components/WorkforceIntegration';
import WorkerMatchingPanel from '@/components/cycles/WorkerMatchingPanel';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Briefcase, Target, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CitizenWorkforce = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('registry');
  
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Workforce Registry' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          {/* Workforce Integration Cycle Banner */}
          <Card className="mb-6 border-l-4 border-l-green-600 bg-gradient-to-r from-green-50 to-transparent">
            <CardContent className="p-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Workforce Integration Cycle (Local Employment Loop)
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Register your skills, get verified, and find job opportunities on local infrastructure projects. 
                The system prioritizes local hiring to keep money in the community.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
                  <Briefcase className="h-3 w-3" />
                  Skill Registration
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
                  <Target className="h-3 w-3" />
                  Skill-Based Matching
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
                  <DollarSign className="h-3 w-3" />
                  Fair Compensation
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-card shadow">
              <TabsTrigger value="registry" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Registry & Jobs
              </TabsTrigger>
              <TabsTrigger value="matching" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Job Matching
              </TabsTrigger>
            </TabsList>

            <TabsContent value="registry">
              <WorkforceIntegration />
            </TabsContent>

            <TabsContent value="matching">
              <WorkerMatchingPanel 
                workerId={user?.id} 
                mode="worker" 
              />
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenWorkforce;
