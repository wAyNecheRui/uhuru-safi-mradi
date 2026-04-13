import { KENYA_COUNTIES } from '@/constants/kenyaAdministrativeUnits';
import { CATEGORIES as APP_CATEGORIES } from '@/constants/problemReporting';

export const CATEGORIES = ['all', ...APP_CATEGORIES.map(c => c.label)];

export const LOCATIONS = ['all', ...KENYA_COUNTIES.map(c => `${c} County`)];
