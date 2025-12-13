import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, Eye, X } from 'lucide-react';
import { BID_TEMPLATES, TEMPLATE_CATEGORIES, type BidTemplate } from '@/constants/bidTemplates';
import { useToast } from '@/hooks/use-toast';

const BidTemplates = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<BidTemplate | null>(null);
  const { toast } = useToast();

  const filteredTemplates = selectedCategory === 'all' 
    ? BID_TEMPLATES 
    : BID_TEMPLATES.filter(template => template.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Infrastructure': return 'bg-blue-100 text-blue-800';
      case 'Water': return 'bg-cyan-100 text-cyan-800';
      case 'Construction': return 'bg-orange-100 text-orange-800';
      case 'Electrical': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (template: BidTemplate) => {
    toast({
      title: "Download Started",
      description: `Downloading ${template.name}...`,
    });
    // TODO: Implement actual download functionality
  };

  const handlePreview = (template: BidTemplate) => {
    setPreviewTemplate(template);
  };

  const getTemplateContent = (template: BidTemplate) => {
    // Generate sample template content based on template type
    const sectionContents: Record<string, string> = {
      'Technical Approach': `
## Technical Approach

### Methodology
Describe the technical methodology that will be employed for this project:
- Project assessment and planning phase
- Implementation strategy
- Quality control measures
- Risk mitigation approaches

### Equipment and Technology
List the equipment and technology to be used:
- [Equipment 1]
- [Equipment 2]
- [Technology/Software]

### Team Expertise
Outline the qualifications of your team:
- Project Manager: [Qualifications]
- Technical Lead: [Qualifications]
- Site Supervisor: [Qualifications]
      `,
      'Materials Specification': `
## Materials Specification

### Primary Materials
| Material | Specification | Quantity | Source |
|----------|--------------|----------|--------|
| [Material 1] | [Spec] | [Qty] | [Source] |
| [Material 2] | [Spec] | [Qty] | [Source] |

### Quality Standards
All materials must comply with:
- Kenya Bureau of Standards (KEBS)
- International quality certifications
- Environmental regulations
      `,
      'Timeline': `
## Project Timeline

### Phase 1: Preparation (Week 1-2)
- Site assessment and surveys
- Permit acquisition
- Resource mobilization

### Phase 2: Implementation (Week 3-8)
- Main construction/installation work
- Quality checkpoints
- Progress reporting

### Phase 3: Completion (Week 9-10)
- Final inspections
- Documentation
- Handover
      `,
      'Safety Plan': `
## Safety Plan

### Health and Safety Measures
- Personal Protective Equipment (PPE) requirements
- Site safety protocols
- Emergency response procedures
- First aid provisions

### Environmental Protection
- Dust and noise control
- Waste management plan
- Water and soil protection measures
      `,
      'Quality Assurance': `
## Quality Assurance

### Quality Control Procedures
1. Pre-construction quality checks
2. In-process inspections
3. Final quality verification
4. Documentation and certification

### Testing and Certification
- Material testing requirements
- Workmanship standards
- Third-party verification
      `,
      'System Design': `
## System Design

### Design Overview
Provide detailed system design including:
- System architecture
- Capacity calculations
- Integration points
- Scalability considerations
      `,
      'Environmental Impact': `
## Environmental Impact Assessment

### Impact Analysis
- Environmental baseline assessment
- Potential impacts identification
- Mitigation measures
- Monitoring plan
      `,
      'Community Engagement': `
## Community Engagement Plan

### Stakeholder Communication
- Community meetings schedule
- Information dissemination
- Feedback mechanisms
- Grievance redress procedures
      `,
      'Testing Protocols': `
## Testing Protocols

### Testing Requirements
- Pre-commissioning tests
- Functional testing
- Performance validation
- Acceptance criteria
      `,
      'Architectural Plans': `
## Architectural Plans

### Design Documentation
- Site plans
- Floor plans
- Elevation drawings
- Structural details
      `,
      'Structural Analysis': `
## Structural Analysis

### Engineering Calculations
- Load analysis
- Foundation design
- Structural stability
- Compliance verification
      `,
      'Materials': `
## Materials Schedule

### Building Materials
Comprehensive list of all materials with specifications, quantities, and sources.
      `,
      'Project Management': `
## Project Management Plan

### Management Approach
- Project organization
- Communication plan
- Progress monitoring
- Reporting structure
      `,
      'Electrical Design': `
## Electrical Design

### System Specifications
- Power requirements
- Circuit design
- Safety systems
- Compliance standards
      `,
      'Safety Compliance': `
## Safety Compliance

### Electrical Safety
- Safety protocols
- Certification requirements
- Testing procedures
- Compliance documentation
      `,
      'Maintenance Plan': `
## Maintenance Plan

### Ongoing Maintenance
- Routine maintenance schedule
- Preventive maintenance
- Emergency response
- Spare parts management
      `,
      'Warranty Terms': `
## Warranty Terms

### Coverage Details
- Warranty period
- Coverage scope
- Exclusions
- Claim procedures
      `,
    };

    return template.sections.map(section => 
      sectionContents[section] || `## ${section}\n\n[Content to be filled by contractor]`
    ).join('\n\n---\n\n');
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center text-xl">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Standardized Bid Templates
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Download professional bid templates to ensure consistency and completeness in your proposals.
          </p>
        </CardHeader>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {category === 'all' ? 'All Categories' : category}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                </div>
                
                <p className="text-gray-600 text-sm">{template.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Template Sections:</h4>
                  <div className="flex flex-wrap gap-1">
                    {template.sections.map((section, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {section}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t">
                  <span>Updated: {new Date(template.lastUpdated).toLocaleDateString()}</span>
                  <span>{template.downloads} downloads</span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleDownload(template)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No templates found for the selected category.</p>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewTemplate?.name}</span>
              <Badge className={previewTemplate ? getCategoryColor(previewTemplate.category) : ''}>
                {previewTemplate?.category}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Template Description</h3>
                <p className="text-gray-600">{previewTemplate.description}</p>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-center border-b pb-4">
                  {previewTemplate.name}
                </h2>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded-lg">
                    {getTemplateContent(previewTemplate)}
                  </pre>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleDownload(previewTemplate)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BidTemplates;