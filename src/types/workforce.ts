// Workforce integration types
export interface WorkforceJob {
  id: string;
  project_id?: string;
  title: string;
  description: string;
  required_skills?: string[];
  location: string;
  wage_min?: number;
  wage_max?: number;
  duration_days?: number;
  positions_available?: number;
  status?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  application_message?: string;
  status?: string;
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  started_at?: string;
  completed_at?: string;
  total_days_worked?: number;
  total_earned?: number;
}

export interface WorkerDailyRecord {
  id: string;
  job_application_id: string;
  worker_id: string;
  job_id: string;
  work_date: string;
  hours_worked: number;
  daily_rate: number;
  amount_earned: number;
  verified_by?: string;
  verification_status: 'pending' | 'verified' | 'disputed';
  payment_status: 'unpaid' | 'processing' | 'paid';
  payment_transaction_id?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkerPayment {
  id: string;
  worker_id: string;
  job_id: string;
  amount: number;
  payment_method: string;
  payment_reference?: string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed';
  period_start: string;
  period_end: string;
  daily_records_count: number;
  processed_at?: string;
  created_at: string;
}

export interface HiredJobWithDetails extends JobApplication {
  job?: WorkforceJob;
  daily_records?: WorkerDailyRecord[];
  total_pending_payment?: number;
}

// Real-time updates
export interface RealtimeProjectUpdate {
  id: string;
  project_id: string;
  update_type: string;
  message: string;
  metadata: any;
  created_by: string;
  created_at: string;
}

// Analytics
export interface SystemAnalytics {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_date: string;
  category: string;
  metadata: any;
  created_at: string;
}
