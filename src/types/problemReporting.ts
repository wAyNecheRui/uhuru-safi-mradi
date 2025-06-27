
export interface ReportData {
  title: string;
  category: string;
  description: string;
  location: string;
  coordinates: string;
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
