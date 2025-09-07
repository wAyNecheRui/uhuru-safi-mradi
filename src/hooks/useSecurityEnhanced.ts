import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  enhancedRateLimit, 
  validateFileUpload, 
  validateFileSignature,
  generateCSRFToken,
  validateCSRFToken,
  sanitizeInput,
  validateInputLength
} from '@/utils/securityEnhanced';

export const useSecurityEnhanced = () => {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState<number>(0);

  // Generate CSRF token on mount
  useEffect(() => {
    const token = generateCSRFToken();
    setCsrfToken(token);
    sessionStorage.setItem('csrf_token', token);
  }, []);

  // Enhanced rate limiting check
  const checkRateLimit = useCallback((key: string, maxRequests = 10, windowMs = 60000) => {
    const result = enhancedRateLimit.checkRateLimit(key, maxRequests, windowMs);
    
    if (!result.allowed) {
      setIsRateLimited(true);
      setRateLimitRetryAfter(result.retryAfter || 300000);
      
      toast.error('Too many requests. Please wait before trying again.');
      
      // Auto-reset after retry period
      setTimeout(() => {
        setIsRateLimited(false);
        setRateLimitRetryAfter(0);
      }, result.retryAfter || 300000);
      
      return false;
    }
    
    return true;
  }, []);

  // Enhanced file validation
  const validateFile = useCallback(async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Basic validation
    const basicValidation = validateFileUpload(file);
    if (!basicValidation.valid) {
      return basicValidation;
    }

    // Magic number validation
    try {
      const signatureValidation = await validateFileSignature(file);
      if (!signatureValidation.valid) {
        toast.error('File type validation failed. The file may be corrupted or not a valid format.');
        return signatureValidation;
      }
    } catch (error) {
      console.error('File signature validation error:', error);
      return { valid: false, error: 'File validation failed' };
    }

    return { valid: true };
  }, []);

  // CSRF token validation
  const validateCSRF = useCallback((token: string): boolean => {
    const storedToken = sessionStorage.getItem('csrf_token');
    if (!storedToken) {
      toast.error('Security token missing. Please refresh the page.');
      return false;
    }
    
    if (!validateCSRFToken(token, storedToken)) {
      toast.error('Security validation failed. Please refresh the page and try again.');
      return false;
    }
    
    return true;
  }, []);

  // Enhanced input sanitization
  const sanitizeAndValidateInput = useCallback((input: string, maxLength = 10000): { valid: boolean; sanitized: string; error?: string } => {
    if (!validateInputLength(input, maxLength)) {
      return { 
        valid: false, 
        sanitized: '', 
        error: `Input exceeds maximum length of ${maxLength} characters` 
      };
    }

    const sanitized = sanitizeInput(input);
    
    if (sanitized.length === 0 && input.length > 0) {
      return { 
        valid: false, 
        sanitized: '', 
        error: 'Input contains only invalid characters' 
      };
    }

    return { valid: true, sanitized };
  }, []);

  // Secure form submission wrapper
  const secureSubmit = useCallback(async (
    formData: any,
    submitFunction: (data: any, csrfToken: string) => Promise<any>,
    rateLimitKey: string
  ) => {
    // Check rate limit
    if (!checkRateLimit(rateLimitKey)) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    // Validate CSRF token
    if (!validateCSRF(csrfToken)) {
      return { success: false, error: 'Security validation failed' };
    }

    try {
      const result = await submitFunction(formData, csrfToken);
      return { success: true, data: result };
    } catch (error) {
      console.error('Secure submit error:', error);
      toast.error('Submission failed. Please try again.');
      return { success: false, error: 'Submission failed' };
    }
  }, [checkRateLimit, validateCSRF, csrfToken]);

  // Generate new CSRF token
  const refreshCSRFToken = useCallback(() => {
    const newToken = generateCSRFToken();
    setCsrfToken(newToken);
    sessionStorage.setItem('csrf_token', newToken);
  }, []);

  // Session timeout handler
  const handleSessionTimeout = useCallback(() => {
    toast.error('Session expired. Please log in again.');
    // Clear sensitive data
    sessionStorage.removeItem('csrf_token');
    setCsrfToken('');
    // Redirect to login could be handled by parent component
  }, []);

  // Monitor for suspicious activity
  const logSuspiciousActivity = useCallback((activity: string, details?: any) => {
    console.warn(`Suspicious activity detected: ${activity}`, details);
    // In a real application, this would send to a security monitoring service
  }, []);

  return {
    csrfToken,
    isRateLimited,
    rateLimitRetryAfter,
    checkRateLimit,
    validateFile,
    validateCSRF,
    sanitizeAndValidateInput,
    secureSubmit,
    refreshCSRFToken,
    handleSessionTimeout,
    logSuspiciousActivity
  };
};