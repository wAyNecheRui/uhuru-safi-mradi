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
    template: `PROBLEM LOCATION: 
PROBLEM TYPE: 
SEVERITY: 
IMPACT: 
WHEN NOTICED: 
ADDITIONAL DETAILS: `,
    placeholder: 'PROBLEM LOCATION: e.g., Mombasa Road, 50m before Junction Mall\nPROBLEM TYPE: e.g., Potholes, cracked surface, poor drainage\nSEVERITY: e.g., Minor / Moderate / Severe\nIMPACT: e.g., Daily commuters, matatu damage, traffic delays\nWHEN NOTICED: e.g., Problem worsened during recent rains\nADDITIONAL DETAILS: Any other relevant information',
    example: 'PROBLEM LOCATION: Mombasa Road, 50m before Junction Mall entrance\nPROBLEM TYPE: Large potholes causing vehicle damage\nSEVERITY: Severe - holes are 30cm deep\nIMPACT: Daily commuters, matatu damage, traffic delays\nWHEN NOTICED: Problem worsened during recent rains\nADDITIONAL DETAILS: Water collects in holes making them deeper'
  },
  {
    category: 'water',
    title: 'Water & Sanitation Issue',
    template: `PROBLEM LOCATION: 
PROBLEM TYPE: 
DURATION: 
AFFECTED AREA: 
HEALTH IMPACT: 
PREVIOUS REPORTS: 
ADDITIONAL DETAILS: `,
    placeholder: 'PROBLEM LOCATION: e.g., Kasarani Estate, Block C apartments\nPROBLEM TYPE: e.g., Pipe burst, no water supply, sewage overflow\nDURATION: e.g., Started 3 days ago\nAFFECTED AREA: e.g., 50+ households\nHEALTH IMPACT: e.g., Stagnant water breeding mosquitoes\nPREVIOUS REPORTS: e.g., Reported to water company twice',
    example: 'PROBLEM LOCATION: Kasarani Estate, Block C apartments\nPROBLEM TYPE: Burst water pipe flooding the area\nDURATION: Started 3 days ago, getting worse\nAFFECTED AREA: 50+ households without water\nHEALTH IMPACT: Stagnant water breeding mosquitoes\nPREVIOUS REPORTS: Reported to water company twice\nADDITIONAL DETAILS: Pipe appears to be corroded'
  },
  {
    category: 'healthcare',
    title: 'Healthcare Facility Issue',
    template: `FACILITY NAME: 
PROBLEM TYPE: 
SERVICES AFFECTED: 
PATIENT IMPACT: 
URGENCY: 
SAFETY CONCERNS: 
ADDITIONAL DETAILS: `,
    placeholder: 'FACILITY NAME: e.g., Kiambu District Hospital\nPROBLEM TYPE: e.g., Equipment failure, infrastructure damage\nSERVICES AFFECTED: e.g., Access to upper floors\nPATIENT IMPACT: e.g., 200+ patients daily\nURGENCY: e.g., High - emergency patients affected\nSAFETY CONCERNS: e.g., Patients with mobility issues at risk',
    example: 'FACILITY NAME: Kiambu District Hospital\nPROBLEM TYPE: Non-functional elevator\nSERVICES AFFECTED: Access to upper floors for elderly/disabled\nPATIENT IMPACT: 200+ patients daily use stairs\nURGENCY: High - emergency patients affected\nSAFETY CONCERNS: Patients with mobility issues at risk\nADDITIONAL DETAILS: Elevator broke down 2 weeks ago'
  },
  {
    category: 'education',
    title: 'Education Infrastructure Issue',
    template: `SCHOOL NAME: 
PROBLEM TYPE: 
STUDENTS AFFECTED: 
LEARNING IMPACT: 
SAFETY CONCERNS: 
TERM IMPACT: 
ADDITIONAL DETAILS: `,
    placeholder: 'SCHOOL NAME: e.g., Kibera Primary School\nPROBLEM TYPE: e.g., Leaking roof, broken windows\nSTUDENTS AFFECTED: e.g., 120 students\nLEARNING IMPACT: e.g., Classes cancelled during rain\nSAFETY CONCERNS: e.g., Electrical fixtures getting wet\nTERM IMPACT: e.g., Critical - exams approaching',
    example: 'SCHOOL NAME: Kibera Primary School\nPROBLEM TYPE: Leaking roof in classroom block\nSTUDENTS AFFECTED: 120 students in 4 classrooms\nLEARNING IMPACT: Classes cancelled during rain\nSAFETY CONCERNS: Electrical fixtures getting wet\nTERM IMPACT: Critical - exams approaching\nADDITIONAL DETAILS: Problem worsens during heavy rains'
  },
  {
    category: 'electricity',
    title: 'Electrical Infrastructure Issue',
    template: `LOCATION: 
PROBLEM TYPE: 
OUTAGE DURATION: 
AREA AFFECTED: 
SAFETY IMPACT: 
BUSINESS IMPACT: 
ADDITIONAL DETAILS: `,
    placeholder: 'LOCATION: e.g., Tom Mboya Street, CBD section\nPROBLEM TYPE: e.g., Power outages, broken poles\nOUTAGE DURATION: e.g., 2 weeks without lighting\nAREA AFFECTED: e.g., 500m stretch of street\nSAFETY IMPACT: e.g., Increased crime, accidents\nBUSINESS IMPACT: e.g., Shops closing early',
    example: 'LOCATION: Tom Mboya Street, CBD section\nPROBLEM TYPE: Street lights not functioning\nOUTAGE DURATION: 2 weeks without lighting\nAREA AFFECTED: 500m stretch of busy street\nSAFETY IMPACT: Increased crime, pedestrian accidents\nBUSINESS IMPACT: Shops closing early, reduced customers\nADDITIONAL DETAILS: All 8 streetlights in section affected'
  },
  {
    category: 'waste',
    title: 'Waste Management Issue',
    template: `LOCATION: 
PROBLEM TYPE: 
WASTE TYPE: 
COLLECTION SCHEDULE: 
HEALTH IMPACT: 
ENVIRONMENTAL IMPACT: 
ADDITIONAL DETAILS: `,
    placeholder: 'LOCATION: e.g., Mathare North Market area\nPROBLEM TYPE: e.g., Overflowing bins, illegal dumping\nWASTE TYPE: e.g., Household, commercial waste\nCOLLECTION SCHEDULE: e.g., Should be twice weekly\nHEALTH IMPACT: e.g., Bad odors, attracting rats\nENVIRONMENTAL IMPACT: e.g., Waste spilling into drainage',
    example: 'LOCATION: Mathare North Market area\nPROBLEM TYPE: Overflowing garbage collection point\nWASTE TYPE: Mixed household and market waste\nCOLLECTION SCHEDULE: Should be collected twice weekly\nHEALTH IMPACT: Bad odors, attracting rats and flies\nENVIRONMENTAL IMPACT: Waste spilling into drainage\nADDITIONAL DETAILS: Collection missed for 10 days'
  },
  {
    category: 'security',
    title: 'Security Infrastructure Issue',
    template: `LOCATION: 
PROBLEM TYPE: 
SECURITY RISK: 
INCIDENT HISTORY: 
COMMUNITY IMPACT: 
TIME OF DAY: 
ADDITIONAL DETAILS: `,
    placeholder: 'LOCATION: e.g., Uhuru Park main entrance\nPROBLEM TYPE: e.g., Broken security lights, damaged barriers\nSECURITY RISK: e.g., Poor visibility enabling crime\nINCIDENT HISTORY: e.g., 3 mugging incidents last month\nCOMMUNITY IMPACT: e.g., People avoid area after dark\nTIME OF DAY: e.g., Problem critical during evening hours',
    example: 'LOCATION: Uhuru Park main entrance\nPROBLEM TYPE: Security lights not functioning\nSECURITY RISK: Poor visibility enabling criminal activity\nINCIDENT HISTORY: 3 mugging incidents last month\nCOMMUNITY IMPACT: People avoid area after dark\nTIME OF DAY: Problem critical during evening hours\nADDITIONAL DETAILS: Lights have been out for 3 weeks'
  },
  {
    category: 'other',
    title: 'Other Infrastructure Issue',
    template: `LOCATION: 
PROBLEM TYPE: 
DESCRIPTION: 
COMMUNITY IMPACT: 
URGENCY LEVEL: 
PREVIOUS ACTIONS: 
ADDITIONAL DETAILS: `,
    placeholder: 'LOCATION: e.g., City Stadium parking area\nPROBLEM TYPE: e.g., Damaged public restroom facilities\nDESCRIPTION: e.g., Broken doors, non-functional plumbing\nCOMMUNITY IMPACT: e.g., Visitors have no sanitation facilities\nURGENCY LEVEL: e.g., Moderate - affects public events\nPREVIOUS ACTIONS: e.g., Complained to stadium management',
    example: 'LOCATION: City Stadium parking area\nPROBLEM TYPE: Damaged public restroom facilities\nDESCRIPTION: Broken doors, non-functional plumbing\nCOMMUNITY IMPACT: Visitors have no sanitation facilities\nURGENCY LEVEL: Moderate - affects public events\nPREVIOUS ACTIONS: Complained to stadium management\nADDITIONAL DETAILS: Problem persists for 2 months'
  }
];

export const getTemplateByCategory = (category: string): DescriptionTemplate | undefined => {
  return DESCRIPTION_TEMPLATES.find(template => template.category === category);
};