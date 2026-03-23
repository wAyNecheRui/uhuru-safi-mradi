import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, ChevronRight } from 'lucide-react';

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
      case 'Under Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Contractor Assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-50 text-red-700 border-red-200';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
          <div className="p-1.5 rounded-lg bg-orange-50 mr-2.5">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          {getText('Recent Issues', 'Masuala ya Hivi Karibuni')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {issues.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No issues reported yet</p>
            <p className="text-xs text-muted-foreground mt-1">New issues will appear here</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              className="group p-3.5 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {issue.title}
                </h4>
                <Badge className={`${getUrgencyColor(issue.urgency)} text-[10px] px-2 py-0 shrink-0`}>
                  {issue.urgency}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2.5">{issue.location}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {issue.votes}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">{issue.reportedAt}</span>
                </div>
                <Badge className={`${getStatusColor(issue.status)} text-[10px] px-2 py-0`}>
                  {issue.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RecentIssues;
