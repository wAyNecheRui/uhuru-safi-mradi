/**
 * Notification Category Utilities
 * Normalizes various notification categories to match the standardized tab filters
 */

// Standard notification categories that match our UI tabs
export type StandardCategory = 'project' | 'payment' | 'bid' | 'report' | 'system';

// Mapping of all possible categories to standard categories
const categoryMap: Record<string, StandardCategory> = {
  // Project-related
  'project': 'project',
  'milestone': 'project',
  'issue': 'project',
  'rating': 'project',
  'verification': 'project',
  
  // Payment-related
  'payment': 'payment',
  'escrow': 'payment',
  
  // Bid-related
  'bid': 'bid',
  'bidding': 'bid',
  
  // Report-related
  'report': 'report',
  'vote': 'report',
  
  // System-related
  'system': 'system',
  'security': 'system',
  'workflow': 'system',
  'compliance': 'system',
};

/**
 * Normalize a notification category to one of the standard categories
 */
export const normalizeCategory = (category: string): StandardCategory => {
  return categoryMap[category] || 'system';
};

/**
 * Get display label for a standard category
 */
export const getCategoryLabel = (category: string): string => {
  const normalized = normalizeCategory(category);
  const labels: Record<StandardCategory, string> = {
    project: 'Project',
    payment: 'Payment',
    bid: 'Bid',
    report: 'Report',
    system: 'System',
  };
  return labels[normalized];
};

/**
 * Get category badge color classes
 */
export const getCategoryBadgeColor = (category: string): string => {
  const normalized = normalizeCategory(category);
  const colors: Record<StandardCategory, string> = {
    project: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    payment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    bid: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    report: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    system: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  return colors[normalized];
};

/**
 * Filter notifications by category with normalization
 */
export const filterNotificationsByCategory = <T extends { category?: string; read?: boolean; type?: string }>(
  notifications: T[],
  category: string
): T[] => {
  if (category === 'all') return notifications;
  if (category === 'unread') return notifications.filter(n => !n.read);
  if (category === 'urgent') {
    return notifications.filter(n => 
      n.type === 'error' || n.type === 'warning' || n.category === 'security'
    );
  }
  
  // Filter by normalized category
  return notifications.filter(n => normalizeCategory(n.category || 'system') === category);
};
