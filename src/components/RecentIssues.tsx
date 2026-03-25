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
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'success' as const;
      case 'In Progress': return 'warning' as const;
      default: return 'secondary' as const;
    }
  };

  const getUrgencyVariant = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'destructive' as const;
      case 'High': return 'warning' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base font-semibold">
          <div className="p-1.5 rounded-lg bg-accent/15 mr-2.5">
            <AlertTriangle className="h-4 w-4 text-accent-foreground" />
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
              className="group p-3.5 rounded-xl border bg-card hover:bg-muted/50 transition-all duration-200 cursor-pointer hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {issue.title}
                </h4>
                <Badge variant={getUrgencyVariant(issue.urgency)} className="text-[10px] px-2 py-0 shrink-0">
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
                <Badge variant={getStatusVariant(issue.status)} className="text-[10px] px-2 py-0">
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
