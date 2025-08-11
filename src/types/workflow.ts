export type WorkflowStep = 
  | 'problem_identification'
  | 'community_validation'
  | 'government_approval'
  | 'contractor_bidding'
  | 'project_execution'
  | 'final_verification';

export type ProjectStatus = 
  | 'submitted'
  | 'community_review'
  | 'government_review'
  | 'approved'
  | 'bidding_open'
  | 'contractor_selected'
  | 'in_progress'
  | 'under_verification'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type VoteType = 'upvote' | 'downvote';

export type BidStatus = 'submitted' | 'selected' | 'rejected';

export type MilestoneStatus = 'pending' | 'in_progress' | 'submitted' | 'verified' | 'paid';

export type VerificationStatus = 'approved' | 'rejected' | 'needs_clarification';

export type EscrowStatus = 'active' | 'completed' | 'disputed' | 'cancelled';

export type TransactionType = 'deposit' | 'release' | 'refund';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type NotificationCategory = 'report' | 'project' | 'payment' | 'verification' | 'system';

export interface CommunityVote {
  id: string;
  report_id: string;
  user_id: string;
  vote_type: VoteType;
  comment?: string;
  created_at: string;
}

export interface ContractorBid {
  id: string;
  report_id: string;
  contractor_id: string;
  bid_amount: number;
  proposal: string;
  estimated_duration: number;
  technical_approach?: string;
  status: BidStatus;
  submitted_at: string;
  selected_at?: string;
  created_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  milestone_number: number;
  title: string;
  description: string;
  target_completion_date?: string;
  completion_criteria: string;
  payment_percentage: number;
  status: MilestoneStatus;
  evidence_urls?: string[];
  submitted_at?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
}

export interface MilestoneVerification {
  id: string;
  milestone_id: string;
  verifier_id: string;
  verification_status: VerificationStatus;
  verification_notes?: string;
  verification_photos?: string[];
  verified_at: string;
}

export interface EscrowAccount {
  id: string;
  project_id: string;
  total_amount: number;
  held_amount: number;
  released_amount: number;
  status: EscrowStatus;
  stripe_account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  escrow_account_id: string;
  milestone_id?: string;
  amount: number;
  transaction_type: TransactionType;
  payment_method: string;
  status: string;
  stripe_transaction_id?: string;
  created_at: string;
}

export interface ContractorCredential {
  id: string;
  contractor_id: string;
  credential_type: 'certification' | 'license' | 'insurance' | 'bond';
  credential_name: string;
  issuing_authority: string;
  credential_number?: string;
  issue_date?: string;
  expiry_date?: string;
  document_url?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_at?: string;
  verified_by?: string;
  created_at: string;
}

export interface SkillsProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone_number?: string;
  location?: string;
  organization?: string;
  years_experience?: number;
  certifications?: string;
  portfolio?: string;
  available_for_work: boolean;
  skills: string[];
  custom_skills?: string[];
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  read: boolean;
  action_url?: string;
  created_at: string;
}

export interface WorkflowState {
  currentStep: WorkflowStep;
  canProceed: boolean;
  nextStep?: WorkflowStep;
  requirements: string[];
  completedSteps: WorkflowStep[];
}