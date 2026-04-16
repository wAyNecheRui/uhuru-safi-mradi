import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
      }),
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
  },
}));

vi.mock('@/services/WorkflowService', () => ({
  WorkflowService: {
    submitProblemReport: vi.fn().mockResolvedValue({ id: 'report-1' }),
  },
}));

import { toast } from 'sonner';
import { useProblemReporting } from '@/hooks/useProblemReporting';

describe('Problem Reporting - useProblemReporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty form data', () => {
    const { result } = renderHook(() => useProblemReporting());
    expect(result.current.reportData.title).toBe('');
    expect(result.current.reportData.category).toBe('roads');
    expect(result.current.reportData.photos).toEqual([]);
    expect(result.current.reportData.coordinates).toBe('');
    expect(result.current.reportData.gpsVerified).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('updates input fields', () => {
    const { result } = renderHook(() => useProblemReporting());
    act(() => { result.current.handleInputChange('title', 'Broken road in Kibera'); });
    expect(result.current.reportData.title).toBe('Broken road in Kibera');
  });

  it('updates location data from GPS', () => {
    const { result } = renderHook(() => useProblemReporting());
    act(() => {
      result.current.handleLocationDataChange({
        county: 'Nairobi', constituency: 'Kibra', ward: 'Laini Saba',
        gpsVerified: true, coordinates: '-1.3128, 36.7853',
      });
    });
    expect(result.current.reportData.county).toBe('Nairobi');
    expect(result.current.reportData.constituency).toBe('Kibra');
    expect(result.current.reportData.ward).toBe('Laini Saba');
    expect(result.current.reportData.gpsVerified).toBe(true);
  });

  describe('Photo Management', () => {
    it('adds photos successfully', () => {
      const { result } = renderHook(() => useProblemReporting());
      act(() => {
        result.current.handlePhotoUpload({
          target: { files: [new File(['photo'], 'road.jpg', { type: 'image/jpeg' })] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });
      expect(result.current.reportData.photos).toHaveLength(1);
      expect(toast.success).toHaveBeenCalledWith('1 file(s) added successfully');
    });

    it('rejects more than 10 photos', () => {
      const { result } = renderHook(() => useProblemReporting());
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.handlePhotoUpload({
            target: { files: [new File(['p'], `p${i}.jpg`, { type: 'image/jpeg' })] },
          } as unknown as React.ChangeEvent<HTMLInputElement>);
        });
      }
      act(() => {
        result.current.handlePhotoUpload({
          target: { files: [new File(['p'], 'extra.jpg', { type: 'image/jpeg' })] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });
      expect(result.current.reportData.photos).toHaveLength(10);
      expect(toast.error).toHaveBeenCalledWith('Maximum 10 photos/videos allowed');
    });

    it('removes a photo by index', () => {
      const { result } = renderHook(() => useProblemReporting());
      act(() => {
        result.current.handlePhotoUpload({
          target: { files: [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });
      act(() => { result.current.handleRemovePhoto(0); });
      expect(result.current.reportData.photos).toHaveLength(1);
      expect(result.current.reportData.photos[0].name).toBe('b.jpg');
    });

    it('blocks camera capture at max photos', () => {
      const { result } = renderHook(() => useProblemReporting());
      for (let i = 0; i < 10; i++) {
        act(() => { result.current.handleCameraCapture(new File(['p'], `cam${i}.jpg`)); });
      }
      act(() => { result.current.handleCameraCapture(new File(['p'], 'extra.jpg')); });
      expect(result.current.reportData.photos).toHaveLength(10);
      expect(toast.error).toHaveBeenCalledWith('Maximum 10 photos/videos allowed');
    });
  });

  describe('Validation', () => {
    it('requires all mandatory fields', () => {
      const { result } = renderHook(() => useProblemReporting());
      const errors = result.current.getValidationErrors();
      expect(errors).toContain('Problem title is required');
      expect(errors).toContain('Description is required');
      expect(errors).toContain('GPS location is required — please allow location access');
      expect(errors).toContain('At least one photo or video is required');
      expect(errors).toContain('Priority level is required');
    });

    it('passes validation with complete data', () => {
      const { result } = renderHook(() => useProblemReporting());
      act(() => {
        result.current.handleInputChange('title', 'Pothole on Mombasa Road');
        result.current.handleInputChange('description', 'Large pothole near Nyayo Stadium');
        result.current.handleInputChange('priority', 'high');
        result.current.handleInputChange('coordinates', '-1.3028, 36.8219');
        result.current.handleCameraCapture(new File(['img'], 'pothole.jpg'));
      });
      expect(result.current.getValidationErrors()).toHaveLength(0);
      expect(result.current.isFormValid()).toBe(true);
    });
  });

  describe('GPS Location', () => {
    it('calls geolocation API', () => {
      const { result } = renderHook(() => useProblemReporting());
      act(() => { result.current.getCurrentLocation(); });
      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('handles GPS success', () => {
      (navigator.geolocation.getCurrentPosition as any).mockImplementation(
        (success: Function) => success({ coords: { latitude: -1.2921, longitude: 36.8219 } })
      );
      const { result } = renderHook(() => useProblemReporting());
      act(() => { result.current.getCurrentLocation(); });
      expect(result.current.reportData.coordinates).toBe('-1.2921, 36.8219');
      expect(toast.success).toHaveBeenCalledWith('GPS location captured successfully');
    });

    it('handles GPS error', () => {
      (navigator.geolocation.getCurrentPosition as any).mockImplementation(
        (_s: Function, err: Function) => err(new Error('denied'))
      );
      const { result } = renderHook(() => useProblemReporting());
      act(() => { result.current.getCurrentLocation(); });
      expect(toast.error).toHaveBeenCalledWith('Unable to get GPS location. Please enter manually.');
    });
  });

  describe('Submission', () => {
    it('requires authentication to submit', async () => {
      const { result } = renderHook(() => useProblemReporting());
      await act(async () => { await result.current.submitReport(); });
      expect(toast.error).toHaveBeenCalledWith('Please log in to submit a report');
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });
});
