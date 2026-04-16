import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { useAuthValidation } from '@/hooks/useAuthValidation';

describe('Auth Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getValidator = () => {
    const { result } = renderHook(() => useAuthValidation());
    return result.current.validateForm;
  };

  describe('Login Validation', () => {
    it('rejects empty email', () => {
      const validate = getValidator();
      const result = validate({ email: '', password: 'pass123', confirmPassword: '', name: '' }, true);
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Please enter your email address.');
    });

    it('rejects email without @', () => {
      const validate = getValidator();
      const result = validate({ email: 'invalid-email', password: 'pass123', confirmPassword: '', name: '' }, true);
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Please enter a valid email address.');
    });

    it('rejects empty password', () => {
      const validate = getValidator();
      const result = validate({ email: 'user@example.com', password: '', confirmPassword: '', name: '' }, true);
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Please enter your password.');
    });

    it('accepts valid login credentials', () => {
      const validate = getValidator();
      const result = validate({ email: 'wanjiku@example.co.ke', password: 'secure123', confirmPassword: '', name: '' }, true);
      expect(result).toBe(true);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('Registration Validation', () => {
    const baseData = {
      email: 'user@example.com',
      password: 'secure123',
      confirmPassword: 'secure123',
      name: 'Wanjiku Mwangi',
    };

    it('rejects empty name', () => {
      const validate = getValidator();
      const result = validate({ ...baseData, name: '' }, false);
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Please enter your full name.');
    });

    it('rejects name with only spaces', () => {
      const validate = getValidator();
      const result = validate({ ...baseData, name: '   ' }, false);
      expect(result).toBe(false);
    });

    it('rejects mismatched passwords', () => {
      const validate = getValidator();
      const result = validate({ ...baseData, confirmPassword: 'different' }, false);
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match.');
    });

    it('rejects password shorter than 6 characters', () => {
      const validate = getValidator();
      const result = validate({ ...baseData, password: '123', confirmPassword: '123' }, false);
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Password must be at least 6 characters long.');
    });

    it('accepts valid registration data', () => {
      const validate = getValidator();
      const result = validate(baseData, false);
      expect(result).toBe(true);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('accepts Swahili names with special characters', () => {
      const validate = getValidator();
      const result = validate({ ...baseData, name: "Ng'ang'a Wambũi" }, false);
      expect(result).toBe(true);
    });

    it('validates email first even with other errors', () => {
      const validate = getValidator();
      const result = validate({ email: '', password: '', confirmPassword: '', name: '' }, false);
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith('Please enter your email address.');
    });
  });
});
