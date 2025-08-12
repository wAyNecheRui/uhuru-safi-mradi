import DOMPurify from 'dompurify';
import { z } from 'zod';

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
};

// Validation schemas
export const reportValidationSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .refine(val => sanitizeInput(val) === val, 'Title contains invalid characters'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  
  location: z.string()
    .min(1, 'Location is required')
    .max(500, 'Location must be less than 500 characters'),
  
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  
  coordinates: z.string()
    .optional()
    .refine(val => {
      if (!val) return true;
      const coords = val.split(',');
      if (coords.length !== 2) return false;
      const [lat, lng] = coords.map(Number);
      return !isNaN(lat) && !isNaN(lng) && 
             lat >= -90 && lat <= 90 && 
             lng >= -180 && lng <= 180;
    }, 'Invalid coordinates format'),
});

export const bidValidationSchema = z.object({
  bid_amount: z.number()
    .positive('Bid amount must be positive')
    .max(10000000, 'Bid amount too large'),
  
  estimated_duration: z.number()
    .int('Duration must be a whole number')
    .positive('Duration must be positive')
    .max(365, 'Duration cannot exceed 365 days'),
  
  proposal: z.string()
    .min(50, 'Proposal must be at least 50 characters')
    .max(5000, 'Proposal must be less than 5000 characters'),
  
  technical_approach: z.string()
    .max(3000, 'Technical approach must be less than 3000 characters')
    .optional(),
});

export const userProfileValidationSchema = z.object({
  full_name: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .refine(val => /^[a-zA-Z\s'-]+$/.test(val), 'Name contains invalid characters'),
  
  phone_number: z.string()
    .optional()
    .refine(val => {
      if (!val) return true;
      return /^\+?[\d\s-()]+$/.test(val) && val.replace(/\D/g, '').length >= 10;
    }, 'Invalid phone number format'),
  
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters'),
});

// Rate limiting (simple client-side implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests = 5, windowMs = 60000): boolean => {
  const now = Date.now();
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// File validation
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed. Use JPEG, PNG, WebP, or PDF' };
  }
  
  return { valid: true };
};