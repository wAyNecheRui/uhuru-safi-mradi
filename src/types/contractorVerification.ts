
export interface CertificationData {
  name: string;
  status: 'verified' | 'pending' | 'expired';
  expiryDate: string;
}

export interface ProjectData {
  id: number;
  title: string;
  value: number;
  status: 'completed' | 'in_progress';
  rating?: number;
  completionDate?: string;
  clientFeedback?: string;
  progress?: number;
  startDate?: string;
  expectedCompletion?: string;
}

export interface VerificationData {
  companyName: string;
  kraPin: string;
  registrationNumber: string;
  physicalAddress: string;
  yearsInBusiness: number;
  verificationStatus: 'verified' | 'pending' | 'expired';
  overallRating: number;
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  specializations: string[];
  certifications: CertificationData[];
  recentProjects: ProjectData[];
}
