import React, { useState } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, DollarSign, Calendar, Clock, MapPin, 
  CheckCircle, Loader2, AlertCircle, TrendingUp,
  Wallet, CalendarDays, Building
} from 'lucide-react';
import { useCitizenJobs } from '@/hooks/useCitizenJobs';
import { format, parseISO } from 'date-fns';

const CitizenMyJobs = () => {
  const { hiredJobs, pendingApplications, dailyRecords, earnings, loading } = useCitizenJobs();
  const [activeTab, setActiveTab] = useState('hired');

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'My Jobs' }
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Hired</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Not Selected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header />
        <main>
          <ResponsiveContainer className="py-6 sm:py-8">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          {/* Earnings Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(earnings.totalEarned)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Wallet className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending Payment</p>
                    <p className="text-lg font-bold text-yellow-600">
                      {formatCurrency(earnings.pendingPayment)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid Amount</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(earnings.paidAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Days Worked</p>
                    <p className="text-lg font-bold text-purple-600">
                      {earnings.daysWorked}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-card shadow">
              <TabsTrigger value="hired" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Hired Jobs ({hiredJobs.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingApplications.length})
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Earnings History
              </TabsTrigger>
            </TabsList>

            {/* Hired Jobs Tab */}
            <TabsContent value="hired" className="space-y-4">
              {hiredJobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Hired Jobs Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      When a contractor selects you for a job, it will appear here.
                    </p>
                    <Button variant="outline" onClick={() => window.location.href = '/citizen/workforce'}>
                      Browse Available Jobs
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                hiredJobs.map((job) => (
                  <Card key={job.id} className="shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl font-semibold">{job.job?.title}</h3>
                            {getStatusBadge(job.status)}
                          </div>

                          <p className="text-muted-foreground">{job.job?.description}</p>

                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {job.job?.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              {job.job?.wage_min && job.job?.wage_max 
                                ? `KES ${job.job.wage_min.toLocaleString()} - ${job.job.wage_max.toLocaleString()}/day`
                                : 'Rate TBD'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {job.job?.duration_days ? `${job.job.duration_days} days` : 'Flexible'}
                            </span>
                          </div>

                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Hired on: {formatDate(job.reviewed_at)}
                              </span>
                              <span className="font-medium text-green-600">
                                Days Worked: {job.total_days_worked || 0}
                              </span>
                            </div>
                            {(job.total_earned || 0) > 0 && (
                              <div className="mt-2">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Total Earned</span>
                                  <span className="font-bold text-green-600">
                                    {formatCurrency(job.total_earned || 0)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Pending Applications Tab */}
            <TabsContent value="pending" className="space-y-4">
              {pendingApplications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any pending job applications.
                    </p>
                    <Button variant="outline" onClick={() => window.location.href = '/citizen/workforce'}>
                      Find Jobs to Apply
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                pendingApplications.map((app) => (
                  <Card key={app.id} className="shadow-md">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{app.job?.title}</h3>
                            {getStatusBadge(app.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{app.job?.description}</p>
                          <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {app.job?.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {app.job?.wage_min 
                                ? `KES ${app.job.wage_min.toLocaleString()}/day`
                                : 'Rate TBD'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Applied on: {formatDate(app.applied_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Earnings History Tab */}
            <TabsContent value="earnings" className="space-y-4">
              {dailyRecords.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Earnings Yet</h3>
                    <p className="text-muted-foreground">
                      Your daily work records and earnings will appear here once you start working.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Daily Work Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Date</th>
                            <th className="text-left py-2">Hours</th>
                            <th className="text-right py-2">Daily Rate</th>
                            <th className="text-right py-2">Earned</th>
                            <th className="text-center py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyRecords.map((record) => (
                            <tr key={record.id} className="border-b">
                              <td className="py-3">{formatDate(record.work_date)}</td>
                              <td className="py-3">{record.hours_worked} hrs</td>
                              <td className="py-3 text-right">{formatCurrency(record.daily_rate)}</td>
                              <td className="py-3 text-right font-medium">
                                {formatCurrency(record.amount_earned)}
                              </td>
                              <td className="py-3 text-center">
                                {getPaymentStatusBadge(record.payment_status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold">
                            <td colSpan={3} className="py-3">Total</td>
                            <td className="py-3 text-right text-green-600">
                              {formatCurrency(earnings.totalEarned)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenMyJobs;
