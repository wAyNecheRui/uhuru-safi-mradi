import { KENYA_COUNTIES } from '@/constants/kenyaAdministrativeUnits';

export const CATEGORIES = ['all', 'Road Construction', 'Water Infrastructure', 'Electrical Infrastructure', 'Building Construction'];

export const LOCATIONS = ['all', ...KENYA_COUNTIES.map(c => `${c} County`)];
