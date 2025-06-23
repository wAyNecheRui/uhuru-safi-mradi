
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users } from 'lucide-react';

interface Issue {
  id: number;
  title: string;
  location: string;
  votes: number;
  status: string;
  urgency: string;
  reportedAt: string;
}

interface RecentIssuesProps {
  issues: Issue[];
  getText: (en: string, sw: string) => string;
}

const RecentIssues = ({ issues, getText }: RecentIssuesProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Review': return 'bg-yellow-500';
      case 'Contractor Assigned': return 'bg-blue-500';
      case 'In Progress': return 'bg-orange-500';
      case 'Completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
          {getText('Recent Issues', 'Masuala ya Hivi Karibuni')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {issues.map((issue) => (
          <div key={issue.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">{issue.title}</h4>
              <Badge className={getUrgencyColor(issue.urgency)}>
                {issue.urgency}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">{issue.location}</p>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  <Users className="h-4 w-4 inline mr-1" />
                  {issue.votes} {getText('votes', 'kura')}
                </span>
                <span className="text-xs text-gray-400">{issue.reportedAt}</span>
              </div>
              <Badge className={`${getStatusColor(issue.status)} text-white`}>
                {issue.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentIssues;
