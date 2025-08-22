export interface BidTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  sections: string[];
  lastUpdated: string;
  downloads: number;
}

export const BID_TEMPLATES: BidTemplate[] = [
  {
    id: '1',
    name: 'Road Construction Bid Template',
    category: 'Infrastructure',
    description: 'Standardized template for road construction and rehabilitation projects',
    sections: ['Technical Approach', 'Materials Specification', 'Timeline', 'Safety Plan', 'Quality Assurance'],
    lastUpdated: '2024-01-15',
    downloads: 245
  },
  {
    id: '2',
    name: 'Water Infrastructure Template',
    category: 'Water',
    description: 'Template for water pipeline installation and water system projects',
    sections: ['System Design', 'Environmental Impact', 'Community Engagement', 'Testing Protocols'],
    lastUpdated: '2024-01-12',
    downloads: 189
  },
  {
    id: '3',
    name: 'Building Construction Template',
    category: 'Construction',
    description: 'Comprehensive template for building and structural projects',
    sections: ['Architectural Plans', 'Structural Analysis', 'Materials', 'Project Management'],
    lastUpdated: '2024-01-10',
    downloads: 167
  },
  {
    id: '4',
    name: 'Electrical Infrastructure Template',
    category: 'Electrical',
    description: 'Template for electrical installations and street lighting projects',
    sections: ['Electrical Design', 'Safety Compliance', 'Maintenance Plan', 'Warranty Terms'],
    lastUpdated: '2024-01-08',
    downloads: 134
  }
];

export const TEMPLATE_CATEGORIES = ['all', 'Infrastructure', 'Water', 'Construction', 'Electrical'] as const;