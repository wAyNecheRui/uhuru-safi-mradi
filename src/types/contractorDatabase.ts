
export interface Contractor {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  projects: number;
  yearsExperience: number;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  phone: string;
  email: string;
  specializations: string[];
  certifications: string[];
  recentProjects: RecentProject[];
}

export interface RecentProject {
  name: string;
  value: number;
  status: 'completed' | 'in_progress';
}

export interface ContractorFilters {
  searchTerm: string;
  selectedCategory: string;
  selectedLocation: string;
}
