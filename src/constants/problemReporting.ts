
import { Category, Priority } from '@/types/problemReporting';

export const CATEGORIES: Category[] = [
  { value: 'roads', label: 'Roads & Transportation', icon: '🛣️' },
  { value: 'water', label: 'Water & Sanitation', icon: '💧' },
  { value: 'healthcare', label: 'Healthcare Facilities', icon: '🏥' },
  { value: 'education', label: 'Education Infrastructure', icon: '🏫' },
  { value: 'electricity', label: 'Electricity & Lighting', icon: '⚡' },
  { value: 'waste', label: 'Waste Management', icon: '🗑️' },
  { value: 'security', label: 'Security Infrastructure', icon: '🛡️' },
  { value: 'other', label: 'Other Infrastructure', icon: '🏗️' }
];

export const PRIORITIES: Priority[] = [
  { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent Priority', color: 'bg-red-100 text-red-800' }
];
