import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import EnhancedProblemReporting from '@/components/EnhancedProblemReporting';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ThumbsUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CitizenReportIssue = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Report Issue' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          {/* Citizen Problem Identification Cycle Banner */}
          <Card className="mb-6 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Citizen Problem Identification Cycle
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Report infrastructure issues with GPS tagging and photo evidence. Your report will undergo 
                community validation and impact assessment before being prioritized for government review.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
                  <AlertTriangle className="h-3 w-3" />
                  Identification & Documentation
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
                  <CheckCircle className="h-3 w-3" />
                  Community Validation
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
                  <Users className="h-3 w-3" />
                  Impact Assessment
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
                  <ThumbsUp className="h-3 w-3" />
                  Priority Ranking
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <EnhancedProblemReporting />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenReportIssue;
