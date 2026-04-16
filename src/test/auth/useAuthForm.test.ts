import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthForm } from '@/hooks/useAuthForm';

describe('Auth Form State Management', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useAuthForm());
    
    expect(result.current.formData.email).toBe('');
    expect(result.current.formData.password).toBe('');
    expect(result.current.formData.name).toBe('');
    expect(result.current.formData.type).toBe('citizen');
    expect(result.current.formData.country).toBe('KE');
  });

  it('updates individual fields correctly', () => {
    const { result } = renderHook(() => useAuthForm());
    
    act(() => {
      result.current.handleInputChange('email', 'wanjiku@example.co.ke');
    });
    expect(result.current.formData.email).toBe('wanjiku@example.co.ke');

    act(() => {
      result.current.handleInputChange('name', 'Wanjiku Mwangi');
    });
    expect(result.current.formData.name).toBe('Wanjiku Mwangi');
  });

  it('handles role selection', () => {
    const { result } = renderHook(() => useAuthForm());
    
    act(() => {
      result.current.handleInputChange('type', 'contractor');
    });
    expect(result.current.formData.type).toBe('contractor');

    act(() => {
      result.current.handleInputChange('type', 'government');
    });
    expect(result.current.formData.type).toBe('government');
  });

  it('resets only password fields on resetForm', () => {
    const { result } = renderHook(() => useAuthForm());

    act(() => {
      result.current.handleInputChange('email', 'test@test.com');
      result.current.handleInputChange('password', 'secret123');
      result.current.handleInputChange('confirmPassword', 'secret123');
      result.current.handleInputChange('name', 'Test User');
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.password).toBe('');
    expect(result.current.formData.confirmPassword).toBe('');
    expect(result.current.formData.email).toBe('test@test.com');
    expect(result.current.formData.name).toBe('Test User');
  });

  it('handles Kenya-specific fields', () => {
    const { result } = renderHook(() => useAuthForm());

    act(() => {
      result.current.handleInputChange('national_id', '12345678');
      result.current.handleInputChange('county', 'Nairobi');
      result.current.handleInputChange('sub_county', 'Westlands');
      result.current.handleInputChange('ward', 'Parklands');
    });

    expect(result.current.formData.national_id).toBe('12345678');
    expect(result.current.formData.county).toBe('Nairobi');
    expect(result.current.formData.sub_county).toBe('Westlands');
    expect(result.current.formData.ward).toBe('Parklands');
  });

  it('handles contractor-specific fields (AGPO)', () => {
    const { result } = renderHook(() => useAuthForm());

    act(() => {
      result.current.handleInputChange('type', 'contractor');
      result.current.handleInputChange('organization', 'ABC Construction Ltd');
      result.current.handleInputChange('kra_pin', 'A123456789Z');
      result.current.handleInputChange('is_agpo', true as any);
      result.current.handleInputChange('agpo_category', 'youth');
    });

    expect(result.current.formData.organization).toBe('ABC Construction Ltd');
    expect(result.current.formData.kra_pin).toBe('A123456789Z');
    expect(result.current.formData.is_agpo).toBe(true);
    expect(result.current.formData.agpo_category).toBe('youth');
  });

  it('handles government-specific fields (GHRIS)', () => {
    const { result } = renderHook(() => useAuthForm());

    act(() => {
      result.current.handleInputChange('type', 'government');
      result.current.handleInputChange('department', 'Ministry of Roads');
      result.current.handleInputChange('position', 'County Engineer');
      result.current.handleInputChange('employee_number', 'GOV-2024-001');
      result.current.handleInputChange('clearance_level', 'elevated');
    });

    expect(result.current.formData.department).toBe('Ministry of Roads');
    expect(result.current.formData.position).toBe('County Engineer');
    expect(result.current.formData.employee_number).toBe('GOV-2024-001');
    expect(result.current.formData.clearance_level).toBe('elevated');
  });
});
