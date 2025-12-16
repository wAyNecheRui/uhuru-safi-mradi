import DOMPurify from 'dompurify';
import { z } from 'zod';

// Enhanced input sanitization with more comprehensive cleaning
export const sanitizeInput = (input: string): string => {
  if (!input) return input;
  
  // Remove HTML tags and normalize whitespace
  let sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  
  // Remove potential XSS vectors
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
  
  return sanitized;
};

// Enhanced HTML sanitization with stricter rules
export const sanitizeHtml = (input: string): string => {
  if (!input) return input;
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    FORBID_ATTR: ['style', 'class', 'id'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form']
  });
};

// Enhanced file validation with magic number checking
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  
  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed' };
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Invalid file extension' };
  }
  
  return { valid: true };
};

// Enhanced magic number validation for files
export const validateFileSignature = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer.slice(0, 16));
  
  // Magic numbers for common file types
  const signatures = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    webp: [0x52, 0x49, 0x46, 0x46], // RIFF header for WebP
    pdf: [0x25, 0x50, 0x44, 0x46] // %PDF
  };
  
  const checkSignature = (sig: number[]) => {
    return sig.every((byte, index) => bytes[index] === byte);
  };
  
  const isValid = Object.values(signatures).some(checkSignature);
  
  return {
    valid: isValid,
    error: isValid ? undefined : 'File signature does not match expected format'
  };
};

// Enhanced rate limiting with exponential backoff
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockUntil?: number;
}

class EnhancedRateLimit {
  private storage = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.storage.entries()) {
        if (now - entry.lastAttempt > 300000) { // 5 minutes
          this.storage.delete(key);
        }
      }
    }, 300000);
  }

  checkRateLimit(
    key: string, 
    maxRequests: number = 10, 
    windowMs: number = 60000,
    blockDurationMs: number = 300000 // 5 minutes
  ): { allowed: boolean; retryAfter?: number; remainingRequests?: number } {
    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry) {
      this.storage.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false
      });
      return { allowed: true, remainingRequests: maxRequests - 1 };
    }

    // Check if currently blocked
    if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
      return { allowed: false, retryAfter: entry.blockUntil - now };
    }

    // Reset window if expired
    if (now - entry.firstAttempt > windowMs) {
      entry.count = 1;
      entry.firstAttempt = now;
      entry.blocked = false;
      entry.blockUntil = undefined;
    } else {
      entry.count++;
    }

    entry.lastAttempt = now;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      entry.blocked = true;
      entry.blockUntil = now + blockDurationMs;
      this.storage.set(key, entry);
      return { allowed: false, retryAfter: blockDurationMs };
    }

    this.storage.set(key, entry);
    return { allowed: true, remainingRequests: maxRequests - entry.count };
  }

  cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.storage.clear();
  }
}

export const enhancedRateLimit = new EnhancedRateLimit();

// Enhanced validation schemas with stricter rules
export const enhancedReportValidationSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters')
    .refine(val => sanitizeInput(val) === val, 'Title contains invalid characters'),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .refine(val => sanitizeHtml(val).length > 0, 'Description is required'),
  
  location: z.string()
    .min(5, 'Location must be at least 5 characters')
    .max(200, 'Location must not exceed 200 characters')
    .refine(val => sanitizeInput(val) === val, 'Location contains invalid characters'),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  
  category: z.string()
    .min(3, 'Category must be at least 3 characters')
    .max(50, 'Category must not exceed 50 characters'),
  
  coordinates: z.string().optional(),
  
  gps_coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional()
});

export const enhancedBidValidationSchema = z.object({
  bid_amount: z.number()
    .min(1000, 'Minimum bid amount is KSh 1,000')
    .max(10000000, 'Maximum bid amount is KSh 10,000,000'),
  
  estimated_duration: z.number()
    .min(1, 'Minimum duration is 1 day')
    .max(365, 'Maximum duration is 365 days'),
  
  proposal: z.string()
    .min(100, 'Proposal must be at least 100 characters')
    .max(5000, 'Proposal must not exceed 5000 characters')
    .refine(val => sanitizeHtml(val).length >= 100, 'Proposal content is too short'),
  
  technical_approach: z.string()
    .max(3000, 'Technical approach must not exceed 3000 characters')
    .optional()
});

// CSRF token generation and validation
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  if (!token || !storedToken || token.length !== storedToken.length) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
};

// Secure session validation
export const validateSession = (sessionId: string): boolean => {
  // Basic session ID format validation
  const sessionRegex = /^[a-zA-Z0-9\-_]{32,128}$/;
  return sessionRegex.test(sessionId);
};

// Input length validation to prevent DoS
export const validateInputLength = (input: string, maxLength: number = 10000): boolean => {
  return input.length <= maxLength;
};

// Phone number validation for Kenya
export const validateKenyanPhoneNumber = (phone: string): boolean => {
  const sanitized = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  const kenyanPhoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
  return kenyanPhoneRegex.test(sanitized);
};

// KRA PIN validation
export const validateKRAPIN = (pin: string): boolean => {
  const sanitized = pin.replace(/\s+/g, '').toUpperCase();
  const kraRegex = /^[ABCDEFGHJKLMNPQRST]\d{9}[A-Z]$/;
  return kraRegex.test(sanitized);
};

// National ID validation for Kenya
export const validateKenyanNationalID = (id: string): boolean => {
  const sanitized = id.replace(/\s+/g, '');
  const idRegex = /^\d{7,8}$/;
  return idRegex.test(sanitized);
};