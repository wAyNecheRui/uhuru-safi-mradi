export interface DescriptionTemplate {
  category: string;
  title: string;
  template: string;
  placeholder: string;
  example: string;
}

export interface CategoryGuidance {
  title: string;
  instruction: string;
  tips: string;
}

// Category-specific guidance for the description field
export const CATEGORY_GUIDANCE: Record<string, CategoryGuidance> = {
  roads: {
    title: "Road & Transportation Problems",
    instruction: "Describe the road condition, exact location, and how it affects commuters.",
    tips: "Include: specific location (road name, landmarks nearby), type of damage (pothole, crack, flooding), size/severity, and when you first noticed it."
  },
  water: {
    title: "Water & Sanitation Issues",
    instruction: "Explain the water supply problem, affected area, and health concerns.",
    tips: "Include: location (estate, building), problem type (burst pipe, no supply, sewage), how long it's been happening, and number of households affected."
  },
  healthcare: {
    title: "Healthcare Facility Problems",
    instruction: "Describe the facility issue, affected services, and patient impact.",
    tips: "Include: facility name, specific problem (equipment, infrastructure), which services are affected, and urgency level for patient care."
  },
  education: {
    title: "Education Infrastructure Issues",
    instruction: "Detail the school facility problem, student impact, and safety concerns.",
    tips: "Include: school name, problem description (leaking roof, broken facilities), number of students affected, and impact on learning."
  },
  electricity: {
    title: "Electrical Infrastructure Problems",
    instruction: "Describe the electrical issue, outage duration, and safety risks.",
    tips: "Include: exact location, problem type (power outage, broken poles, exposed wires), how long it's been affecting the area, and safety hazards."
  },
  waste: {
    title: "Waste Management Issues",
    instruction: "Explain the waste collection problem, health impact, and environmental concerns.",
    tips: "Include: location, waste type (household, commercial), collection schedule issues, and health/environmental hazards observed."
  },
  security: {
    title: "Security Infrastructure Problems",
    instruction: "Describe the security-related infrastructure issue and community impact.",
    tips: "Include: location, problem type (broken lights, damaged barriers), security risks, any incidents that have occurred, and time of day concerns."
  },
  other: {
    title: "Other Infrastructure Issues",
    instruction: "Provide a clear description of the problem and its community impact.",
    tips: "Include: exact location, detailed problem description, who is affected, urgency level, and any previous attempts to report or fix it."
  }
};

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
    placeholder: `Example: "There is a large pothole on Mombasa Road, approximately 50 meters before the Junction Mall entrance. The pothole is about 30cm deep and 1 meter wide. It has been causing vehicle damage and traffic slowdowns, especially during rush hour. The problem worsened significantly during the recent heavy rains. Several matatus have been damaged trying to avoid it."`,
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
    placeholder: `Example: "A water pipe has burst near Block C apartments in Kasarani Estate. The break has been flowing for 3 days now, flooding the common area and creating stagnant pools. Over 50 households have no water supply. Mosquitoes are breeding in the stagnant water. We have reported this to the water company twice but no action has been taken."`,
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
    placeholder: `Example: "The main elevator at Kiambu District Hospital has not been working for 2 weeks. This is severely affecting elderly and disabled patients who cannot climb stairs to reach the upper floors. Over 200 patients daily are forced to use the stairs. Emergency cases are also affected when they need to be moved between floors. Staff have been carrying patients manually which is unsafe."`,
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
    placeholder: `Example: "The roof of Classroom Block B at Kibera Primary School is leaking badly. Four classrooms are affected, impacting about 120 students. When it rains, classes have to be cancelled because water drips onto desks and electrical fixtures. With exams approaching next month, this is severely disrupting learning. The problem gets worse during heavy rains and water is pooling near electrical wiring."`,
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
    placeholder: `Example: "All 8 street lights along Tom Mboya Street in the CBD section between Kenya Cinema and Ambassadeur Hotel have not been working for 2 weeks. This 500-meter stretch is now very dark at night, leading to increased mugging incidents - 3 reported last week alone. Businesses are closing earlier due to safety concerns and pedestrians are at risk of accidents."`,
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
    placeholder: `Example: "The garbage collection point at Mathare North Market has been overflowing for 10 days. The bins are filled with household and market waste that should be collected twice weekly. The smell is terrible and rats and flies are now everywhere. Waste is spilling into the drainage channel, blocking water flow. This is a serious health hazard for market vendors and residents."`,
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
    placeholder: `Example: "The security lights at the main entrance of Uhuru Park have been off for 3 weeks. The area is now completely dark after 6pm, creating opportunities for criminal activity. Three mugging incidents were reported to police last month in this area. People now avoid the park entirely in the evening. This affects joggers, families, and workers passing through."`,
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
    placeholder: `Example: "The public restroom facilities at City Stadium parking area have been unusable for 2 months. The doors are broken, toilets are not flushing, and there is no running water. This affects thousands of visitors during events and daily users of the stadium. We have complained to stadium management multiple times but nothing has been done. Visitors are forced to use unhygienic alternatives."`,
    example: 'LOCATION: City Stadium parking area\nPROBLEM TYPE: Damaged public restroom facilities\nDESCRIPTION: Broken doors, non-functional plumbing\nCOMMUNITY IMPACT: Visitors have no sanitation facilities\nURGENCY LEVEL: Moderate - affects public events\nPREVIOUS ACTIONS: Complained to stadium management\nADDITIONAL DETAILS: Problem persists for 2 months'
  }
];

export const getTemplateByCategory = (category: string): DescriptionTemplate | undefined => {
  return DESCRIPTION_TEMPLATES.find(template => template.category === category);
};

export const getCategoryGuidance = (category: string): CategoryGuidance => {
  return CATEGORY_GUIDANCE[category] || CATEGORY_GUIDANCE['other'];
};