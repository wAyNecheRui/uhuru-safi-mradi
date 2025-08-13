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