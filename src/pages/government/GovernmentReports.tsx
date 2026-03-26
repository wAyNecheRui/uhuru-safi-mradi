import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, Clock, MapPin, TrendingUp, Camera, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const GovernmentReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Citizen Reports' }
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('problem_reports')
        .select(`
          *,
          community_votes(vote_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const reportsWithVotes = data?.map(report => ({
        ...report,
        votes: report.community_votes?.length || 0
      })) || [];
      
      setReports(reportsWithVotes);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">Citizen Reports</h1>
          <p className="text-muted-foreground">Review and manage citizen-reported infrastructure issues across all counties.</p>
        </div>

        <div className="space-y-6">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No reports found</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="hover:shadow-card-hover transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{report.title}</CardTitle>
                      <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4 mb-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {report.location || 'Location not specified'}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Reported: {new Date(report.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {report.votes} citizen votes
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{report.description?.substring(0, 150)}...</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getStatusColor(report.status)}>
                      {report.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                    </Badge>
                    <Badge className={getPriorityColor(report.priority)}>
                      {report.priority?.toUpperCase() || 'MEDIUM'} Priority
                    </Badge>
                    {report.estimated_cost && (
                      <Badge variant="outline" className="text-purple-600">
                        Est. Cost: {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(report.estimated_cost)}
                      </Badge>
                    )}
                  </div>

                  {/* Show photos if available */}
                  {report.photo_urls && report.photo_urls.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <Camera className="h-4 w-4" />
                        Evidence Photos ({report.photo_urls.length}):
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {report.photo_urls.slice(0, 4).map((url: string, index: number) => (
                          <a 
                            key={index} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block aspect-square rounded-lg overflow-hidden border hover:shadow-lg transition-shadow"
                          >
                            <img 
                              src={url} 
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                      {report.photo_urls.length > 4 && (
                        <p className="text-sm text-gray-500 mt-1">+ {report.photo_urls.length - 4} more photos</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Category: {report.category || 'General'}
                    </p>
                    <div className="flex gap-2">
                      {report.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => navigate('/government/approvals')}
                        >
                          Review & Approve
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
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

export default GovernmentReports;