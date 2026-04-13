// All 47 Kenya Counties as per the 2010 Constitution
export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
  'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
  'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
  'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
  'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans-Nzoia', 'Turkana', 'Uasin Gishu',
  'Vihiga', 'Wajir', 'West Pokot'
] as const;

// Government Ministries and Departments (Based on Kenya's current government structure)
export const GOVERNMENT_DEPARTMENTS = [
  'Ministry of Interior and National Administration',
  'Ministry of Finance and Economic Planning',
  'Ministry of Health',
  'Ministry of Education',
  'Ministry of Roads, Transport and Public Works',
  'Ministry of Water, Sanitation and Irrigation',
  'Ministry of Energy and Petroleum',
  'Ministry of Agriculture and Livestock Development',
  'Ministry of Environment and Forestry',
  'Ministry of ICT, Innovation and Youth Affairs',
  'Ministry of Defence',
  'Ministry of Foreign Affairs',
  'Ministry of Labour and Social Protection',
  'Ministry of Lands and Physical Planning',
  'Ministry of Mining, Blue Economy and Maritime Affairs',
  'Ministry of Trade, Investment and Industry',
  'Ministry of Tourism and Wildlife',
  'Ministry of Sports, Culture and Heritage',
  'Ministry of Public Service and Human Capital Development',
  'National Treasury',
  'Kenya Revenue Authority (KRA)',
  'Ethics and Anti-Corruption Commission (EACC)',
  'Public Procurement Regulatory Authority (PPRA)',
  'National Construction Authority (NCA)',
  'Kenya Bureau of Standards (KEBS)',
  'County Government Administration',
  'Other Government Agency'
] as const;

// Government Positions/Designations
export const GOVERNMENT_POSITIONS = [
  'Cabinet Secretary',
  'Principal Secretary',
  'Director General',
  'Director',
  'Deputy Director',
  'County Executive Committee Member (CECM)',
  'Chief Officer',
  'County Director',
  'Assistant Director',
  'Senior Principal Superintendent',
  'Principal Superintendent',
  'Senior Superintendent',
  'Superintendent',
  'Senior Assistant Superintendent',
  'Assistant Superintendent',
  'Chief',
  'Senior Officer',
  'Officer',
  'Assistant Officer',
  'Procurement Officer',
  'Project Manager',
  'Engineer',
  'Technical Officer',
  'Administrative Officer',
  'Other'
] as const;

// Clearance Levels for Government Officials
export const CLEARANCE_LEVELS = [
  { value: 'standard', label: 'Standard - Basic access to public information' },
  { value: 'elevated', label: 'Elevated - Access to procurement data' },
  { value: 'senior', label: 'Senior - Project approval authority' },
  { value: 'executive', label: 'Executive - Full administrative access' }
] as const;

// NCA Contractor Categories (National Construction Authority)
export const NCA_CATEGORIES = [
  { value: 'NCA1', label: 'NCA 1 - Unlimited Value (Above KES 500M)' },
  { value: 'NCA2', label: 'NCA 2 - Up to KES 500 Million' },
  { value: 'NCA3', label: 'NCA 3 - Up to KES 300 Million' },
  { value: 'NCA4', label: 'NCA 4 - Up to KES 200 Million' },
  { value: 'NCA5', label: 'NCA 5 - Up to KES 100 Million' },
  { value: 'NCA6', label: 'NCA 6 - Up to KES 50 Million' },
  { value: 'NCA7', label: 'NCA 7 - Up to KES 20 Million' },
  { value: 'NCA8', label: 'NCA 8 - Up to KES 10 Million' },
  { value: 'pending', label: 'Pending NCA Registration' }
] as const;

// AGPO Categories (Access to Government Procurement Opportunities)
export const AGPO_CATEGORIES = [
  { value: 'youth', label: 'Youth (18-35 years)' },
  { value: 'women', label: 'Women' },
  { value: 'pwd', label: 'Persons with Disabilities (PWD)' },
  { value: 'not_applicable', label: 'Not Applicable' }
] as const;

// Contractor Specializations aligned with unified project categories
export const CONTRACTOR_SPECIALIZATIONS = [
  'Roads & Transportation',
  'Water & Sanitation',
  'Building Construction',
  'Electricity & Lighting',
  'Healthcare Facilities',
  'Education Infrastructure',
  'Waste Management',
  'Security Infrastructure',
  'Other Infrastructure',
  'Telecommunications Infrastructure',
  'Environmental Services',
  'Mechanical Engineering',
  'Civil Engineering',
  'Plumbing and Drainage',
  'Painting and Decorating',
  'Landscaping and Fencing',
  'General Supplies',
  'Consultancy Services',
  'IT and Software Services'
] as const;

// ID Types recognized in Kenya
export const ID_TYPES = [
  { value: 'national_id', label: 'National ID Card' },
  { value: 'passport', label: 'Kenyan Passport' },
  { value: 'alien_id', label: 'Alien ID Card' },
  { value: 'military_id', label: 'Military ID' }
] as const;

// Gender options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
] as const;
