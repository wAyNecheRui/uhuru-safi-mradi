
import { Contractor } from '@/types/contractorDatabase';

export const CATEGORIES = ['all', 'Road Construction', 'Water Infrastructure', 'Electrical Infrastructure', 'Building Construction'];

export const LOCATIONS = ['all', 'Nairobi County', 'Mombasa County', 'Kisumu County', 'Machakos County'];

export const SAMPLE_CONTRACTORS: Contractor[] = [
  {
    id: 'CTR-001',
    name: 'Quality Builders Ltd',
    category: 'Road Construction',
    location: 'Nairobi County',
    rating: 4.8,
    projects: 45,
    yearsExperience: 8,
    verificationStatus: 'verified',
    phone: '+254 700 123 456',
    email: 'info@qualitybuilders.co.ke',
    specializations: ['Road Construction', 'Water Infrastructure', 'Building Construction'],
    certifications: ['NCA Registration', 'OSHA Safety', 'Environmental Compliance'],
    recentProjects: [
      { name: 'Machakos Market Road', value: 4800000, status: 'completed' },
      { name: 'Kibera Water Pipeline', value: 4200000, status: 'in_progress' }
    ]
  },
  {
    id: 'CTR-002',
    name: 'Aqua Solutions Kenya',
    category: 'Water Infrastructure',
    location: 'Mombasa County',
    rating: 4.6,
    projects: 32,
    yearsExperience: 6,
    verificationStatus: 'verified',
    phone: '+254 711 234 567',
    email: 'contracts@aquasolutions.co.ke',
    specializations: ['Water Supply', 'Sewerage Systems', 'Borehole Drilling'],
    certifications: ['Water Resources Authority License', 'OSHA Safety'],
    recentProjects: [
      { name: 'Kilifi Water Project', value: 6200000, status: 'completed' },
      { name: 'Malindi Sewerage Upgrade', value: 3800000, status: 'in_progress' }
    ]
  },
  {
    id: 'CTR-003',
    name: 'Power Connect Ltd',
    category: 'Electrical Infrastructure',
    location: 'Kisumu County',
    rating: 4.4,
    projects: 28,
    yearsExperience: 5,
    verificationStatus: 'pending',
    phone: '+254 722 345 678',
    email: 'info@powerconnect.co.ke',
    specializations: ['Street Lighting', 'Power Distribution', 'Solar Systems'],
    certifications: ['Electrical Engineers Board', 'OSHA Safety'],
    recentProjects: [
      { name: 'Kisumu Street Lighting', value: 2100000, status: 'completed' }
    ]
  }
];
