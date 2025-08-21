export interface DescriptionTemplate {
  category: string;
  title: string;
  template: string;
  placeholder: string;
  example: string;
}

export const DESCRIPTION_TEMPLATES: DescriptionTemplate[] = [
  {
    category: 'roads',
    title: 'Road & Transportation Issue',
    template: `PROBLEM LOCATION: [Specify exact location]
PROBLEM TYPE: [Potholes, cracked surface, poor drainage, missing signage, etc.]
SEVERITY: [How bad is the problem - minor, moderate, severe]
IMPACT: [Who is affected and how - pedestrians, vehicles, accidents caused]
WHEN NOTICED: [When did you first notice this problem]
ADDITIONAL DETAILS: [Any other relevant information]`,
    placeholder: 'Describe the road/transportation infrastructure problem in detail...',
    example: 'PROBLEM LOCATION: Mombasa Road, 50m before Junction Mall entrance\nPROBLEM TYPE: Large potholes causing vehicle damage\nSEVERITY: Severe - holes are 30cm deep\nIMPACT: Daily commuters, matatu damage, traffic delays\nWHEN NOTICED: Problem worsened during recent rains\nADDITIONAL DETAILS: Water collects in holes making them deeper'
  },
  {
    category: 'water',
    title: 'Water & Sanitation Issue',
    template: `PROBLEM LOCATION: [Specify exact location]
PROBLEM TYPE: [Pipe burst, no water supply, contaminated water, sewage overflow, etc.]
DURATION: [How long has this been a problem]
AFFECTED AREA: [How many households/buildings affected]
HEALTH IMPACT: [Any health concerns or risks]
PREVIOUS REPORTS: [Has this been reported before]
ADDITIONAL DETAILS: [Any other relevant information]`,
    placeholder: 'Describe the water/sanitation infrastructure problem...',
    example: 'PROBLEM LOCATION: Kasarani Estate, Block C apartments\nPROBLEM TYPE: Burst water pipe flooding the area\nDURATION: Started 3 days ago, getting worse\nAFFECTED AREA: 50+ households without water\nHEALTH IMPACT: Stagnant water breeding mosquitoes\nPREVIOUS REPORTS: Reported to water company twice\nADDITIONAL DETAILS: Pipe appears to be corroded'
  },
  {
    category: 'healthcare',
    title: 'Healthcare Facility Issue',
    template: `FACILITY NAME: [Name of healthcare facility]
PROBLEM TYPE: [Equipment failure, infrastructure damage, access issues, etc.]
SERVICES AFFECTED: [What services are impacted]
PATIENT IMPACT: [How many patients affected daily]
URGENCY: [How urgent is this repair]
SAFETY CONCERNS: [Any immediate safety risks]
ADDITIONAL DETAILS: [Any other relevant information]`,
    placeholder: 'Describe the healthcare infrastructure problem...',
    example: 'FACILITY NAME: Kiambu District Hospital\nPROBLEM TYPE: Non-functional elevator\nSERVICES AFFECTED: Access to upper floors for elderly/disabled\nPATIENT IMPACT: 200+ patients daily use stairs\nURGENCY: High - emergency patients affected\nSAFETY CONCERNS: Patients with mobility issues at risk\nADDITIONAL DETAILS: Elevator broke down 2 weeks ago'
  },
  {
    category: 'education',
    title: 'Education Infrastructure Issue',
    template: `SCHOOL NAME: [Name of educational institution]
PROBLEM TYPE: [Classroom damage, missing facilities, safety hazards, etc.]
STUDENTS AFFECTED: [Number of students impacted]
LEARNING IMPACT: [How it affects education delivery]
SAFETY CONCERNS: [Any immediate safety risks]
TERM IMPACT: [How urgent relative to school calendar]
ADDITIONAL DETAILS: [Any other relevant information]`,
    placeholder: 'Describe the education infrastructure problem...',
    example: 'SCHOOL NAME: Kibera Primary School\nPROBLEM TYPE: Leaking roof in classroom block\nSTUDENTS AFFECTED: 120 students in 4 classrooms\nLEARNING IMPACT: Classes cancelled during rain\nSAFETY CONCERNS: Electrical fixtures getting wet\nTERM IMPACT: Critical - exams approaching\nADDITIONAL DETAILS: Problem worsens during heavy rains'
  },
  {
    category: 'electricity',
    title: 'Electrical Infrastructure Issue',
    template: `LOCATION: [Specify exact location]
PROBLEM TYPE: [Power outages, faulty wiring, broken poles, non-functional streetlights, etc.]
OUTAGE DURATION: [How long has power been out or lights not working]
AREA AFFECTED: [How many homes/businesses affected]
SAFETY IMPACT: [Security concerns, accident risks]
BUSINESS IMPACT: [Effect on local businesses]
ADDITIONAL DETAILS: [Any other relevant information]`,
    placeholder: 'Describe the electrical infrastructure problem...',
    example: 'LOCATION: Tom Mboya Street, CBD section\nPROBLEM TYPE: Street lights not functioning\nOUTAGE DURATION: 2 weeks without lighting\nAREA AFFECTED: 500m stretch of busy street\nSAFETY IMPACT: Increased crime, pedestrian accidents\nBUSINESS IMPACT: Shops closing early, reduced customers\nADDITIONAL DETAILS: All 8 streetlights in section affected'
  },
  {
    category: 'waste',
    title: 'Waste Management Issue',
    template: `LOCATION: [Specify exact location]
PROBLEM TYPE: [Overflowing bins, illegal dumping, collection delays, etc.]
WASTE TYPE: [Household, commercial, hazardous, organic, etc.]
COLLECTION SCHEDULE: [Normal collection frequency]
HEALTH IMPACT: [Sanitation and health concerns]
ENVIRONMENTAL IMPACT: [Effect on surroundings]
ADDITIONAL DETAILS: [Any other relevant information]`,
    placeholder: 'Describe the waste management problem...',
    example: 'LOCATION: Mathare North Market area\nPROBLEM TYPE: Overflowing garbage collection point\nWASTE TYPE: Mixed household and market waste\nCOLLECTION SCHEDULE: Should be collected twice weekly\nHEALTH IMPACT: Bad odors, attracting rats and flies\nENVIRONMENTAL IMPACT: Waste spilling into drainage\nADDITIONAL DETAILS: Collection missed for 10 days'
  },
  {
    category: 'security',
    title: 'Security Infrastructure Issue',
    template: `LOCATION: [Specify exact location]
PROBLEM TYPE: [Broken security lights, damaged barriers, non-functional CCTV, etc.]
SECURITY RISK: [What specific risks this creates]
INCIDENT HISTORY: [Any crimes/incidents related to this]
COMMUNITY IMPACT: [How it affects residents' safety]
TIME OF DAY: [When is the problem most noticeable]
ADDITIONAL DETAILS: [Any other relevant information]`,
    placeholder: 'Describe the security infrastructure problem...',
    example: 'LOCATION: Uhuru Park main entrance\nPROBLEM TYPE: Security lights not functioning\nSECURITY RISK: Poor visibility enabling criminal activity\nINCIDENT HISTORY: 3 mugging incidents last month\nCOMMUNITY IMPACT: People avoid area after dark\nTIME OF DAY: Problem critical during evening hours\nADDITIONAL DETAILS: Lights have been out for 3 weeks'
  },
  {
    category: 'other',
    title: 'Other Infrastructure Issue',
    template: `LOCATION: [Specify exact location]
PROBLEM TYPE: [Describe the type of infrastructure problem]
DESCRIPTION: [Detailed description of the issue]
COMMUNITY IMPACT: [Who is affected and how]
URGENCY LEVEL: [How urgent is this repair]
PREVIOUS ACTIONS: [Any attempts to address this]
ADDITIONAL DETAILS: [Any other relevant information]`,
    placeholder: 'Describe the infrastructure problem in detail...',
    example: 'LOCATION: City Stadium parking area\nPROBLEM TYPE: Damaged public restroom facilities\nDESCRIPTION: Broken doors, non-functional plumbing\nCOMMUNITY IMPACT: Visitors have no sanitation facilities\nURGENCY LEVEL: Moderate - affects public events\nPREVIOUS ACTIONS: Complained to stadium management\nADDITIONAL DETAILS: Problem persists for 2 months'
  }
];

export const getTemplateByCategory = (category: string): DescriptionTemplate | undefined => {
  return DESCRIPTION_TEMPLATES.find(template => template.category === category);
};