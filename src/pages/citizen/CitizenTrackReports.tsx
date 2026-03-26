import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Clock, FileText, Eye, Trash2, ImageOff } from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ContractorBanner from '@/components/contractor/ContractorBanner';
import ReportDetailsModal from '@/components/ReportDetailsModal';
import { useCitizenData } from '@/hooks/useCitizenData';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const CitizenTrackReports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const { reports, isLoading, deleteReport, isDeletingReport } = useCitizenData();
  
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Track Reports' }
  ];

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase().replace(/_/g, ' ') || '';
    switch (normalizedStatus) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': 
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contractor selected':
      case 'contractor_selected': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'bidding open':
      case 'bidding_open': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'under review':
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatStatus = (status: string) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">Track My Reports</h1>
          <p className="text-muted-foreground">Monitor the progress of your submitted infrastructure reports.</p>
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
          {isLoading ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-pulse">Loading your reports...</div>
              </CardContent>
            </Card>
          ) : filteredReports.length === 0 ? (
              <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">No Reports Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No reports match your search criteria.' : 'You haven\'t submitted any reports yet.'}
                </p>
                <Button asChild>
                  <a href="/citizen/report">Submit Your First Report</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id} className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                {/* Hero Photo */}
                {report.photo_urls && report.photo_urls.length > 0 ? (
                  <div className="w-full h-[180px] sm:h-[220px] overflow-hidden bg-muted">
                    <img 
                      src={report.photo_urls[0]} 
                      alt={report.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-[100px] bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                    <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}

                {/* Contractor Banner if project assigned */}
                {(report as any).project_id && (
                  <div className="px-4 pt-3">
                    <ContractorBanner contractorId={(report as any).contractor_id} compact />
                  </div>
                )}

                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{report.title}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {report.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Reported: {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getStatusColor((report as any).effective_status || report.status)}>
                      {formatStatus((report as any).effective_status || report.status)}
                    </Badge>
                    <Badge className={getPriorityColor(report.priority)}>
                      {report.priority?.toUpperCase()} Priority
                    </Badge>
                    {(report as any).project_id && (report as any).effective_status !== 'completed' && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        Project Active
                      </Badge>
                    )}
                    {(report as any).project_id && (report as any).effective_status === 'completed' && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Project Completed
                      </Badge>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Track progress and receive SMS updates
                    </p>
                    <div className="flex gap-2">
                      {report.status === 'pending' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isDeletingReport}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete your report "{report.title}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteReport(report.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                        <Eye className="h-4 w-4 mr-2" />
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

      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
};

export default CitizenTrackReports;
