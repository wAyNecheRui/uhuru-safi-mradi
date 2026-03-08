import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, Clock, Wallet, CheckCircle, XCircle, 
  Loader2, UserCheck, AlertCircle 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkerPaymentService } from '@/services/WorkerPaymentService';
import { format } from 'date-fns';

interface HiredWorker {
  id: string;
  applicant_id: string;
  job_id: string;
  worker_name: string;
  phone_number: string;
  daily_rate: number;
  started_at: string;
  total_days_worked: number;
  total_earned: number;
}

interface DailyRecord {
  id: string;
  work_date: string;
  hours_worked: number;
  amount_earned: number;
  verification_status: string;
  payment_status: string;
}

interface WorkerAttendanceTrackerProps {
  jobId: string;
  dailyRate: number;
  onUpdate?: () => void;
}

const WorkerAttendanceTracker: React.FC<WorkerAttendanceTrackerProps> = ({
  jobId,
  dailyRate,
  onUpdate
}) => {
  const { toast } = useToast();
  const [workers, setWorkers] = useState<HiredWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<HiredWorker | null>(null);
  const [workerRecords, setWorkerRecords] = useState<DailyRecord[]>([]);
  const [recordingWork, setRecordingWork] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const [workRecord, setWorkRecord] = useState({
    workDate: format(new Date(), 'yyyy-MM-dd'),
    hoursWorked: '8',
    notes: ''
  });

  useEffect(() => {
    fetchHiredWorkers();
  }, [jobId]);

  const fetchHiredWorkers = async () => {
    try {
      setLoading(true);
      
      // Fetch accepted applications for this job
      const { data: applications, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('status', 'accepted');

      if (error) throw error;

      // Fetch worker details for each application
      const workersWithDetails = await Promise.all(
        (applications || []).map(async (app) => {
          const { data: worker } = await supabase
            .from('citizen_workers')
            .select('phone_number, daily_rate')
            .eq('user_id', app.applicant_id)
            .maybeSingle();

          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', app.applicant_id)
            .maybeSingle();

          return {
            id: app.id,
            applicant_id: app.applicant_id,
            job_id: app.job_id,
            worker_name: profile?.full_name || 'Worker',
            phone_number: worker?.phone_number || '',
            daily_rate: worker?.daily_rate || dailyRate,
            started_at: app.started_at || app.reviewed_at,
            total_days_worked: app.total_days_worked || 0,
            total_earned: app.total_earned || 0
          };
        })
      );

      setWorkers(workersWithDetails);
    } catch (error) {
      console.error('Error fetching hired workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerRecords = async (workerId: string) => {
    try {
      const { data, error } = await supabase
        .from('worker_daily_records')
        .select('*')
        .eq('worker_id', workerId)
        .eq('job_id', jobId)
        .order('work_date', { ascending: false });

      if (error) throw error;
      setWorkerRecords(data || []);
    } catch (error) {
      console.error('Error fetching worker records:', error);
    }
  };

  const handleOpenRecordDialog = (worker: HiredWorker) => {
    setSelectedWorker(worker);
    fetchWorkerRecords(worker.applicant_id);
    setWorkRecord({
      workDate: format(new Date(), 'yyyy-MM-dd'),
      hoursWorked: '8',
      notes: ''
    });
    setShowRecordDialog(true);
  };

  const handleRecordWork = async () => {
    if (!selectedWorker) return;

    setRecordingWork(true);
    try {
      const rate = selectedWorker.daily_rate || dailyRate;
      const hours = parseFloat(workRecord.hoursWorked) || 8;
      const amountEarned = (hours / 8) * rate;

      const { error } = await supabase
        .from('worker_daily_records')
        .insert({
          job_application_id: selectedWorker.id,
          worker_id: selectedWorker.applicant_id,
          job_id: jobId,
          work_date: workRecord.workDate,
          hours_worked: hours,
          daily_rate: rate,
          amount_earned: amountEarned,
          notes: workRecord.notes,
          verification_status: 'verified', // Contractor-verified by default
          payment_status: 'unpaid'
        });

      if (error) throw error;

      // Update job application totals
      await supabase
        .from('job_applications')
        .update({
          total_days_worked: (selectedWorker.total_days_worked || 0) + 1,
          total_earned: (selectedWorker.total_earned || 0) + amountEarned
        })
        .eq('id', selectedWorker.id);

      toast({
        title: 'Work Recorded',
        description: `Recorded ${hours} hours of work (KES ${amountEarned.toLocaleString()}) for ${selectedWorker.worker_name}`
      });

      fetchWorkerRecords(selectedWorker.applicant_id);
      fetchHiredWorkers();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record work',
        variant: 'destructive'
      });
    } finally {
      setRecordingWork(false);
    }
  };

  const handleOpenPaymentDialog = (worker: HiredWorker) => {
    setSelectedWorker(worker);
    fetchWorkerRecords(worker.applicant_id);
    setShowPaymentDialog(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedWorker) return;

    setProcessingPayment(true);
    try {
      // Get unpaid verified records
      const unpaidRecords = workerRecords.filter(
        r => r.payment_status === 'unpaid' && r.verification_status === 'verified'
      );

      if (unpaidRecords.length === 0) {
        toast({
          title: 'No Unpaid Records',
          description: 'There are no verified unpaid work records to process.',
          variant: 'destructive'
        });
        return;
      }

      const totalAmount = unpaidRecords.reduce((sum, r) => sum + r.amount_earned, 0);

      const result = await WorkerPaymentService.processDailyPayment({
        workerId: selectedWorker.applicant_id,
        jobId: jobId,
        recordIds: unpaidRecords.map(r => r.id),
        paymentMethod: 'mpesa'
      });

      if (result.success) {
        toast({
          title: '💰 Payment Sent Successfully',
          description: `KES ${totalAmount.toLocaleString()} sent to ${selectedWorker.worker_name} via M-Pesa. Ref: ${result.reference}`
        });
        setShowPaymentDialog(false);
        fetchWorkerRecords(selectedWorker.applicant_id);
        fetchHiredWorkers();
        onUpdate?.();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment',
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (workers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Hired Workers</h3>
          <p className="text-sm text-muted-foreground">
            Hire workers from job applications to track their attendance and payments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Hired Workers ({workers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workers.map((worker) => (
            <div 
              key={worker.id}
              className="p-4 bg-muted/50 rounded-lg flex flex-col sm:flex-row justify-between gap-4"
            >
              <div className="space-y-1">
                <h4 className="font-semibold">{worker.worker_name}</h4>
                <p className="text-sm text-muted-foreground">{worker.phone_number}</p>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {worker.total_days_worked} days
                  </span>
                  <span className="flex items-center gap-1 text-green-600">
                    <Wallet className="h-4 w-4" />
                    KES {worker.total_earned.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleOpenRecordDialog(worker)}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Record Work
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenPaymentDialog(worker)}
                >
                  <Wallet className="h-4 w-4 mr-1" />
                  Pay
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Record Work Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Daily Work</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Worker: <strong>{selectedWorker?.worker_name}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Daily Rate: <strong>KES {(selectedWorker?.daily_rate || dailyRate).toLocaleString()}</strong>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Work Date</label>
              <Input
                type="date"
                value={workRecord.workDate}
                onChange={(e) => setWorkRecord({ ...workRecord, workDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Hours Worked</label>
              <Input
                type="number"
                min="1"
                max="12"
                value={workRecord.hoursWorked}
                onChange={(e) => setWorkRecord({ ...workRecord, hoursWorked: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Any notes about the work done..."
                value={workRecord.notes}
                onChange={(e) => setWorkRecord({ ...workRecord, notes: e.target.value })}
              />
            </div>

            {workerRecords.length > 0 && (
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium mb-2">Recent Records</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {workerRecords.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex justify-between text-xs">
                      <span>{format(new Date(record.work_date), 'MMM d, yyyy')}</span>
                      <span>{record.hours_worked}h - KES {record.amount_earned.toLocaleString()}</span>
                      {getStatusBadge(record.payment_status)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordWork} disabled={recordingWork}>
              {recordingWork ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Work'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Worker Payment (Escrow)</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Worker: <strong>{selectedWorker?.worker_name}</strong>
              </p>
            </div>

            {workerRecords.length === 0 ? (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No work records found</p>
              </div>
            ) : (
              <>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {workerRecords.map((record) => (
                    <div 
                      key={record.id} 
                      className="flex justify-between items-center p-2 bg-muted rounded"
                    >
                      <div>
                        <span className="text-sm">{format(new Date(record.work_date), 'MMM d, yyyy')}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({record.hours_worked}h)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          KES {record.amount_earned.toLocaleString()}
                        </span>
                        {getStatusBadge(record.payment_status)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>Unpaid Total:</span>
                    <span className="text-green-600">
                      KES {workerRecords
                        .filter(r => r.payment_status === 'unpaid')
                        .reduce((sum, r) => sum + r.amount_earned, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💰 Paid directly from project escrow worker wage pool
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcessPayment} 
              disabled={processingPayment || workerRecords.filter(r => r.payment_status === 'unpaid').length === 0}
            >
              {processingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay from Escrow via M-Pesa'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkerAttendanceTracker;
