import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, Eye } from 'lucide-react';
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
         case 'Roads & Transportation': return 'bg-blue-100 text-blue-800';
         case 'Water & Sanitation': return 'bg-cyan-100 text-cyan-800';
         case 'Healthcare Facilities': return 'bg-red-100 text-red-800';
         case 'Education Infrastructure': return 'bg-green-100 text-green-800';
         case 'Electricity & Lighting': return 'bg-yellow-100 text-yellow-800';
         case 'Waste Management': return 'bg-orange-100 text-orange-800';
         case 'Security Infrastructure': return 'bg-purple-100 text-purple-800';
         case 'Building Construction': return 'bg-amber-100 text-amber-800';
         case 'Other Infrastructure': return 'bg-gray-100 text-gray-800';
         default: return 'bg-gray-100 text-gray-800';
      }
   };

   const getTemplateContent = (template: BidTemplate): string => {
      const header = `
================================================================================
                          BID PROPOSAL TEMPLATE
================================================================================
                          ${template.name.toUpperCase()}
================================================================================

Project Category: ${template.category}
Template Version: 1.0
Date: ${new Date().toLocaleDateString()}

================================================================================
                          CONTRACTOR INFORMATION
================================================================================

Company Name: _______________________________________________
Registration Number: ________________________________________
KRA PIN: ____________________________________________________
Physical Address: ___________________________________________
Postal Address: _____________________________________________
Phone Number: _______________________________________________
Email: ______________________________________________________
Contact Person: _____________________________________________

================================================================================
                          PROJECT DETAILS
================================================================================

Project Title: ______________________________________________
Project Location: ___________________________________________
County: _____________________________________________________
Constituency: _______________________________________________
Ward: _______________________________________________________

================================================================================
                          BID SUMMARY
================================================================================

Total Bid Amount (KES): _____________________________________
Bid Validity Period: ________________________________________
Proposed Start Date: ________________________________________
Proposed Completion Date: ___________________________________
Estimated Duration (Days): __________________________________

================================================================================
`;

      const sectionContents: Record<string, string> = {
         'Technical Approach': `
================================================================================
                          TECHNICAL APPROACH
================================================================================

1. METHODOLOGY
   Describe the technical methodology for this project:
   
   1.1 Project Assessment Phase
       _________________________________________________________________
       _________________________________________________________________
   
   1.2 Implementation Strategy
       _________________________________________________________________
       _________________________________________________________________
   
   1.3 Quality Control Measures
       _________________________________________________________________
       _________________________________________________________________

2. EQUIPMENT AND TECHNOLOGY
   List equipment and technology to be used:
   
   | Equipment/Technology | Quantity | Condition | Ownership |
   |---------------------|----------|-----------|-----------|
   |                     |          |           |           |
   |                     |          |           |           |

3. TEAM EXPERTISE
   
   Project Manager: _____________________________________________
   Qualifications: ______________________________________________
   Years Experience: ____________________________________________
   
   Technical Lead: ______________________________________________
   Qualifications: ______________________________________________
   Years Experience: ____________________________________________
   
   Site Supervisor: _____________________________________________
   Qualifications: ______________________________________________
   Years Experience: ____________________________________________
`,
         'Materials Specification': `
================================================================================
                          MATERIALS SPECIFICATION
================================================================================

1. PRIMARY MATERIALS

   | Material | Specification | Quantity | Unit | Source | Unit Cost | Total |
   |----------|--------------|----------|------|--------|-----------|-------|
   |          |              |          |      |        |           |       |
   |          |              |          |      |        |           |       |
   |          |              |          |      |        |           |       |

2. QUALITY STANDARDS
   All materials must comply with:
   [ ] Kenya Bureau of Standards (KEBS)
   [ ] International quality certifications
   [ ] Environmental regulations
   [ ] Project-specific requirements

3. MATERIAL SOURCING PLAN
   _________________________________________________________________
   _________________________________________________________________
`,
         'Timeline': `
================================================================================
                          PROJECT TIMELINE
================================================================================

PHASE 1: PREPARATION
Duration: _____________ to _____________

[ ] Site assessment and surveys
[ ] Permit acquisition
[ ] Resource mobilization
[ ] Team deployment

PHASE 2: IMPLEMENTATION
Duration: _____________ to _____________

Week 1-2: ___________________________________________________________
Week 3-4: ___________________________________________________________
Week 5-6: ___________________________________________________________
Week 7-8: ___________________________________________________________

PHASE 3: COMPLETION
Duration: _____________ to _____________

[ ] Final inspections
[ ] Documentation
[ ] Community handover
[ ] Defects liability period

GANTT CHART (Attach separately)
`,
         'Safety Plan': `
================================================================================
                          SAFETY PLAN
================================================================================

1. HEALTH AND SAFETY MEASURES

   1.1 Personal Protective Equipment (PPE)
       [ ] Helmets
       [ ] Safety boots
       [ ] Reflective vests
       [ ] Gloves
       [ ] Eye protection
       [ ] Other: _____________

   1.2 Site Safety Protocols
       _________________________________________________________________
       _________________________________________________________________

   1.3 Emergency Response Procedures
       Emergency Contact: __________________________________________
       Nearest Hospital: ___________________________________________
       First Aid Kit Location: ______________________________________

2. ENVIRONMENTAL PROTECTION
   [ ] Dust control measures
   [ ] Noise reduction plan
   [ ] Waste management plan
   [ ] Water protection measures
`,
         'Quality Assurance': `
================================================================================
                          QUALITY ASSURANCE
================================================================================

1. QUALITY CONTROL PROCEDURES

   [ ] Pre-construction quality checks
   [ ] In-process inspections
   [ ] Final quality verification
   [ ] Documentation and certification

2. TESTING REQUIREMENTS

   | Test Type | Frequency | Responsible Party | Standards |
   |-----------|-----------|-------------------|-----------|
   |           |           |                   |           |
   |           |           |                   |           |

3. DEFECTS LIABILITY
   Period: _______________ months
   Warranty coverage: _____________________________________________
`,
         'Traffic Management': `
================================================================================
                          TRAFFIC MANAGEMENT PLAN
================================================================================

1. TRAFFIC CONTROL MEASURES
   _________________________________________________________________
   _________________________________________________________________

2. ROAD DIVERSIONS (if applicable)
   _________________________________________________________________
   _________________________________________________________________

3. SIGNAGE AND BARRIERS
   [ ] Warning signs
   [ ] Detour signs
   [ ] Barriers
   [ ] Traffic cones
`,
         'System Design': `
================================================================================
                          SYSTEM DESIGN
================================================================================

1. DESIGN OVERVIEW
   _________________________________________________________________
   _________________________________________________________________

2. CAPACITY CALCULATIONS
   _________________________________________________________________

3. TECHNICAL SPECIFICATIONS
   _________________________________________________________________
   _________________________________________________________________
`,
         'Environmental Impact': `
================================================================================
                          ENVIRONMENTAL IMPACT ASSESSMENT
================================================================================

1. BASELINE ASSESSMENT
   _________________________________________________________________
   _________________________________________________________________

2. POTENTIAL IMPACTS
   _________________________________________________________________

3. MITIGATION MEASURES
   _________________________________________________________________

4. MONITORING PLAN
   _________________________________________________________________
`,
         'Community Engagement': `
================================================================================
                          COMMUNITY ENGAGEMENT PLAN
================================================================================

1. STAKEHOLDER IDENTIFICATION
   _________________________________________________________________

2. COMMUNICATION STRATEGY
   [ ] Community meetings
   [ ] Notice boards
   [ ] Local radio
   [ ] Other: _______________

3. GRIEVANCE MECHANISM
   Contact Person: ______________________________________________
   Phone: _______________________________________________________
   Email: _______________________________________________________
`,
         'Testing Protocols': `
================================================================================
                          TESTING PROTOCOLS
================================================================================

1. PRE-COMMISSIONING TESTS
   _________________________________________________________________

2. FUNCTIONAL TESTING
   _________________________________________________________________

3. PERFORMANCE VALIDATION
   _________________________________________________________________

4. ACCEPTANCE CRITERIA
   _________________________________________________________________
`,
         'Water Quality Standards': `
================================================================================
                          WATER QUALITY STANDARDS
================================================================================

1. QUALITY PARAMETERS
   [ ] pH Level: _______________
   [ ] Turbidity: ______________
   [ ] Chlorine: _______________
   [ ] Bacterial count: ________

2. TESTING FREQUENCY
   _________________________________________________________________

3. COMPLIANCE CERTIFICATION
   _________________________________________________________________
`,
         'Medical Equipment Integration': `
================================================================================
                          MEDICAL EQUIPMENT INTEGRATION
================================================================================

1. EQUIPMENT LIST
   _________________________________________________________________

2. INSTALLATION REQUIREMENTS
   _________________________________________________________________

3. POWER AND UTILITIES
   _________________________________________________________________
`,
         'Hygiene Standards': `
================================================================================
                          HYGIENE STANDARDS
================================================================================

1. INFECTION CONTROL MEASURES
   _________________________________________________________________

2. WASTE DISPOSAL
   _________________________________________________________________

3. CLEANING PROTOCOLS
   _________________________________________________________________
`,
         'Accessibility Compliance': `
================================================================================
                          ACCESSIBILITY COMPLIANCE
================================================================================

1. WHEELCHAIR ACCESS
   [ ] Ramps
   [ ] Wide doorways
   [ ] Accessible toilets

2. SIGNAGE
   [ ] Braille
   [ ] Visual aids

3. EMERGENCY EVACUATION
   _________________________________________________________________
`,
         'Emergency Systems': `
================================================================================
                          EMERGENCY SYSTEMS
================================================================================

1. FIRE SAFETY
   [ ] Fire extinguishers
   [ ] Sprinkler system
   [ ] Emergency exits

2. BACKUP POWER
   [ ] Generator capacity: ____________ kVA
   [ ] UPS systems

3. COMMUNICATION
   [ ] PA system
   [ ] Emergency phones
`,
         'Building Design': `
================================================================================
                          BUILDING DESIGN
================================================================================

1. ARCHITECTURAL PLANS (Attach separately)

2. STRUCTURAL DESIGN
   _________________________________________________________________

3. BUILDING MATERIALS
   _________________________________________________________________
`,
         'Safety Standards': `
================================================================================
                          SAFETY STANDARDS
================================================================================

1. BUILDING CODE COMPLIANCE
   [ ] National Building Code
   [ ] Fire safety regulations
   [ ] Structural integrity

2. CHILD SAFETY (for educational facilities)
   _________________________________________________________________
`,
         'Learning Environment': `
================================================================================
                          LEARNING ENVIRONMENT
================================================================================

1. CLASSROOM SPECIFICATIONS
   Size: _______________ sq meters
   Capacity: _______________ students
   Ventilation: _______________
   Lighting: _______________

2. ACOUSTICS
   _________________________________________________________________
`,
         'Playground & Recreation': `
================================================================================
                          PLAYGROUND & RECREATION
================================================================================

1. PLAY EQUIPMENT
   _________________________________________________________________

2. SAFETY SURFACES
   _________________________________________________________________

3. FENCING
   _________________________________________________________________
`,
         'Electrical Design': `
================================================================================
                          ELECTRICAL DESIGN
================================================================================

1. POWER REQUIREMENTS
   Total Load: _______________ kW
   Supply Type: _______________

2. CIRCUIT DESIGN (Attach drawings)

3. SAFETY SYSTEMS
   [ ] Earth leakage protection
   [ ] Lightning protection
   [ ] Surge protection
`,
         'Maintenance Plan': `
================================================================================
                          MAINTENANCE PLAN
================================================================================

1. ROUTINE MAINTENANCE SCHEDULE
   _________________________________________________________________

2. PREVENTIVE MAINTENANCE
   _________________________________________________________________

3. SPARE PARTS
   _________________________________________________________________
`,
         'Warranty Terms': `
================================================================================
                          WARRANTY TERMS
================================================================================

1. WARRANTY PERIOD: _______________ months

2. COVERAGE
   [ ] Materials
   [ ] Workmanship
   [ ] Equipment

3. EXCLUSIONS
   _________________________________________________________________

4. CLAIM PROCEDURE
   _________________________________________________________________
`,
         'Energy Efficiency': `
================================================================================
                          ENERGY EFFICIENCY
================================================================================

1. ENERGY SAVING MEASURES
   [ ] LED lighting
   [ ] Solar panels
   [ ] Timer controls

2. ESTIMATED SAVINGS
   _________________________________________________________________
`,
         'Collection System Design': `
================================================================================
                          WASTE COLLECTION SYSTEM DESIGN
================================================================================

1. COLLECTION POINTS
   _________________________________________________________________

2. VEHICLE REQUIREMENTS
   _________________________________________________________________

3. SCHEDULE
   _________________________________________________________________
`,
         'Environmental Compliance': `
================================================================================
                          ENVIRONMENTAL COMPLIANCE
================================================================================

1. NEMA REQUIREMENTS
   _________________________________________________________________

2. EMISSIONS CONTROL
   _________________________________________________________________

3. MONITORING
   _________________________________________________________________
`,
         'Recycling Facilities': `
================================================================================
                          RECYCLING FACILITIES
================================================================================

1. SORTING SYSTEM
   _________________________________________________________________

2. PROCESSING EQUIPMENT
   _________________________________________________________________

3. OUTPUT MATERIALS
   _________________________________________________________________
`,
         'Community Awareness': `
================================================================================
                          COMMUNITY AWARENESS
================================================================================

1. EDUCATION PROGRAMS
   _________________________________________________________________

2. SIGNAGE
   _________________________________________________________________

3. FEEDBACK MECHANISM
   _________________________________________________________________
`,
         'Health & Safety': `
================================================================================
                          HEALTH & SAFETY
================================================================================

1. WORKER PROTECTION
   _________________________________________________________________

2. PUBLIC SAFETY
   _________________________________________________________________

3. EMERGENCY PROCEDURES
   _________________________________________________________________
`,
         'Security Assessment': `
================================================================================
                          SECURITY ASSESSMENT
================================================================================

1. THREAT ANALYSIS
   _________________________________________________________________

2. VULNERABILITY ASSESSMENT
   _________________________________________________________________

3. RISK MITIGATION
   _________________________________________________________________
`,
         'Integration Plan': `
================================================================================
                          SYSTEM INTEGRATION PLAN
================================================================================

1. EXISTING SYSTEMS
   _________________________________________________________________

2. INTEGRATION POINTS
   _________________________________________________________________

3. TESTING
   _________________________________________________________________
`,
         'Monitoring Setup': `
================================================================================
                          MONITORING SETUP
================================================================================

1. CONTROL ROOM
   _________________________________________________________________

2. EQUIPMENT
   _________________________________________________________________

3. STAFFING
   _________________________________________________________________
`,
         'Maintenance Schedule': `
================================================================================
                          MAINTENANCE SCHEDULE
================================================================================

1. DAILY CHECKS
   _________________________________________________________________

2. WEEKLY MAINTENANCE
   _________________________________________________________________

3. MONTHLY INSPECTIONS
   _________________________________________________________________
`,
         'Project Overview': `
================================================================================
                          PROJECT OVERVIEW
================================================================================

1. SCOPE OF WORK
   _________________________________________________________________
   _________________________________________________________________

2. OBJECTIVES
   _________________________________________________________________

3. DELIVERABLES
   _________________________________________________________________
`,
         'Materials & Equipment': `
================================================================================
                          MATERIALS & EQUIPMENT
================================================================================

1. MATERIALS LIST
   _________________________________________________________________

2. EQUIPMENT LIST
   _________________________________________________________________

3. PROCUREMENT PLAN
   _________________________________________________________________
`,
         'Risk Management': `
================================================================================
                          RISK MANAGEMENT
================================================================================

1. IDENTIFIED RISKS
   | Risk | Likelihood | Impact | Mitigation |
   |------|------------|--------|------------|
   |      |            |        |            |

2. CONTINGENCY PLANS
   _________________________________________________________________
`,
         'Accessibility': `
================================================================================
                          ACCESSIBILITY
================================================================================

1. PHYSICAL ACCESS
   _________________________________________________________________

2. SPECIAL NEEDS PROVISIONS
   _________________________________________________________________
`,
         'Safety Compliance': `
================================================================================
                          SAFETY COMPLIANCE
================================================================================

1. REGULATORY REQUIREMENTS
   _________________________________________________________________

2. CERTIFICATION
   _________________________________________________________________

3. INSPECTION SCHEDULE
   _________________________________________________________________
`,
      };

      const footer = `

================================================================================
                          DECLARATION
================================================================================

I/We hereby declare that:

1. All information provided in this bid is true and accurate
2. We have the capacity and resources to complete this project
3. We are not debarred from public procurement
4. We have no conflict of interest
5. We agree to abide by all terms and conditions

Authorized Signatory: _______________________________________________

Name: ______________________________________________________________

Designation: _______________________________________________________

Date: ______________________________________________________________

Company Stamp:




================================================================================
                          ATTACHMENTS CHECKLIST
================================================================================

[ ] Company Registration Certificate
[ ] KRA Tax Compliance Certificate
[ ] AGPO Certificate (if applicable)
[ ] NCA Registration Certificate
[ ] Previous Project References
[ ] Bank Guarantee/Bid Bond
[ ] Audited Financial Statements
[ ] NEMA Compliance Certificate (if applicable)
[ ] Insurance Certificates
[ ] Technical Drawings (if applicable)

================================================================================
                    END OF BID PROPOSAL TEMPLATE
================================================================================
`;

      const sectionContent = template.sections
         .map(section => sectionContents[section] || `
================================================================================
                          ${section.toUpperCase()}
================================================================================

[Content to be filled by contractor]
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
`)
         .join('\n');

      return header + sectionContent + footer;
   };

   const handleDownload = (template: BidTemplate) => {
      const content = getTemplateContent(template);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name.replace(/\s+/g, '_')}_Template.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
         title: "Template Downloaded",
         description: `${template.name} has been downloaded. Fill out the template and submit with your bid.`,
      });
   };

   const handlePreview = (template: BidTemplate) => {
      setPreviewTemplate(template);
   };

   return (
      <div className="space-y-6">
         <Card className="shadow-lg border-t-4 border-t-primary">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
               <CardTitle className="flex items-center text-xl">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Standardized Bid Templates
               </CardTitle>
               <p className="text-muted-foreground mt-2">
                  Download professional bid templates to ensure consistency and completeness in your proposals.
                  Fill out the downloaded template and attach it to your bid submission.
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
                           <h3 className="text-lg font-semibold">{template.name}</h3>
                           <Badge className={getCategoryColor(template.category)}>
                              {template.category}
                           </Badge>
                        </div>

                        <p className="text-muted-foreground text-sm">{template.description}</p>

                        <div className="space-y-2">
                           <h4 className="text-sm font-medium">Template Sections:</h4>
                           <div className="flex flex-wrap gap-1">
                              {template.sections.map((section, index) => (
                                 <Badge key={index} variant="outline" className="text-xs">
                                    {section}
                                 </Badge>
                              ))}
                           </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t">
                           <span>Updated: {new Date(template.lastUpdated).toLocaleDateString()}</span>
                        </div>

                        <div className="flex gap-2">
                           <Button
                              size="sm"
                              className="flex-1"
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
               <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
               <p className="text-muted-foreground">No templates found for the selected category.</p>
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
                     <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Template Description</h3>
                        <p className="text-muted-foreground">{previewTemplate.description}</p>
                     </div>

                     <div className="bg-background border rounded-lg p-6">
                        <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                           {getTemplateContent(previewTemplate)}
                        </pre>
                     </div>

                     <div className="flex gap-2 pt-4 border-t">
                        <Button
                           className="flex-1"
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
