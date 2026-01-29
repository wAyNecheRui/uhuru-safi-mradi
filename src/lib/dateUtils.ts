/**
 * Date/Time formatting utilities for consistent display across the application
 * All times include AM/PM markers for clarity
 */

/**
 * Format a date string to a localized date with time including AM/PM
 */
export const formatDateTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true // Ensures AM/PM display
  });
};

/**
 * Format time only with AM/PM
 */
export const formatTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid time';
  
  return date.toLocaleTimeString('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format a date string to a readable date only
 */
export const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format a date for display with relative time if recent
 */
export const formatRelativeDateTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDateTime(date);
};

/**
 * Get current time formatted with AM/PM
 */
export const getCurrentTime = (): string => {
  return new Date().toLocaleTimeString('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Get current date and time formatted with AM/PM
 */
export const getCurrentDateTime = (): string => {
  return formatDateTime(new Date());
};
