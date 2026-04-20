export interface ReportData {
  title: string;
  category: string;
  description: string;
  location: string; // The physical OSM address
  county: string;
  constituency: string;
  ward: string;
  coordinates: string;
  gpsVerified: boolean;
  priority: string;
  photos: File[];
  estimatedCost: string;
  affectedPopulation: string;
}

export interface Category {
  value: string;
  label: string;
  icon: string;
}

export interface Priority {
  value: string;
  label: string;
  color: string;
}

export interface CommunityVote {
  id: string;
  report_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}

export interface SkillsProfile {
  user_id: string;
  full_name: string;
  phone_number: string;
  location: string;
  organization?: string;
  years_experience: number;
  certifications?: string;
  portfolio?: string;
  available_for_work: boolean;
  skills: string[];
  custom_skills: string[];
}
