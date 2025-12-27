export interface BidTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  sections: string[];
  lastUpdated: string;
}

export const BID_TEMPLATES: BidTemplate[] = [
  {
    id: '1',
    name: 'Road Construction Bid Template',
    category: 'Roads & Transportation',
    description: 'Standardized template for road construction, rehabilitation, and transportation projects',
    sections: ['Technical Approach', 'Materials Specification', 'Timeline', 'Safety Plan', 'Quality Assurance', 'Traffic Management'],
    lastUpdated: '2024-12-01'
  },
  {
    id: '2',
    name: 'Water & Sanitation Infrastructure Template',
    category: 'Water & Sanitation',
    description: 'Template for water pipeline installation, sanitation, and water system projects',
    sections: ['System Design', 'Environmental Impact', 'Community Engagement', 'Testing Protocols', 'Water Quality Standards'],
    lastUpdated: '2024-12-01'
  },
  {
    id: '3',
    name: 'Healthcare Facility Template',
    category: 'Healthcare Facilities',
    description: 'Template for healthcare facility construction and renovation projects',
    sections: ['Architectural Plans', 'Medical Equipment Integration', 'Hygiene Standards', 'Accessibility Compliance', 'Emergency Systems'],
    lastUpdated: '2024-12-01'
  },
  {
    id: '4',
    name: 'Education Infrastructure Template',
    category: 'Education Infrastructure',
    description: 'Template for school buildings, classrooms, and educational facility projects',
    sections: ['Building Design', 'Safety Standards', 'Accessibility', 'Learning Environment', 'Playground & Recreation'],
    lastUpdated: '2024-12-01'
  },
  {
    id: '5',
    name: 'Electrical & Lighting Template',
    category: 'Electricity & Lighting',
    description: 'Template for electrical installations and street lighting projects',
    sections: ['Electrical Design', 'Safety Compliance', 'Maintenance Plan', 'Warranty Terms', 'Energy Efficiency'],
    lastUpdated: '2024-12-01'
  },
  {
    id: '6',
    name: 'Waste Management Template',
    category: 'Waste Management',
    description: 'Template for waste collection, disposal, and recycling infrastructure projects',
    sections: ['Collection System Design', 'Environmental Compliance', 'Recycling Facilities', 'Community Awareness', 'Health & Safety'],
    lastUpdated: '2024-12-01'
  },
  {
    id: '7',
    name: 'Security Infrastructure Template',
    category: 'Security Infrastructure',
    description: 'Template for security installations including CCTV, perimeter fencing, and lighting',
    sections: ['Security Assessment', 'System Design', 'Integration Plan', 'Monitoring Setup', 'Maintenance Schedule'],
    lastUpdated: '2024-12-01'
  },
  {
    id: '8',
    name: 'General Infrastructure Template',
    category: 'Other Infrastructure',
    description: 'Flexible template for various infrastructure projects not covered by specific categories',
    sections: ['Project Overview', 'Technical Approach', 'Materials & Equipment', 'Timeline', 'Quality Assurance', 'Risk Management'],
    lastUpdated: '2024-12-01'
  }
];

export const TEMPLATE_CATEGORIES = [
  'all', 
  'Roads & Transportation', 
  'Water & Sanitation', 
  'Healthcare Facilities',
  'Education Infrastructure',
  'Electricity & Lighting', 
  'Waste Management',
  'Security Infrastructure',
  'Other Infrastructure'
] as const;
