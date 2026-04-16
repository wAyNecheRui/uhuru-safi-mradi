import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock toast
const mockToast = { error: vi.fn(), success: vi.fn() };
vi.mock('sonner', () => ({ toast: mockToast }));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock auth context
const mockUser = null;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock supabase
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

// Mock WorkflowService
vi.mock('@/services/WorkflowService', () => ({
  WorkflowService: {
    submitProblemReport: vi.fn().mockResolvedValue({ id: 'report-1' }),
  },
}));

import { useProblemReporting } from '@/hooks/useProblemReporting';

describe('Problem Reporting - useProblemReporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty form data', () => {
    const { result } = renderHook(() => useProblemReporting());

    expect(result.current.reportData.title).toBe('');
    expect(result.current.reportData.category).toBe('roads');
    expect(result.current.reportData.description).toBe('');
    expect(result.current.reportData.photos).toEqual([]);
    expect(result.current.reportData.coordinates).toBe('');
    expect(result.current.reportData.gpsVerified).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('updates input fields', () => {
    const { result } = renderHook(() => useProblemReporting());

    act(() => {
      result.current.handleInputChange('title', 'Broken road in Kibera');
    });
    expect(result.current.reportData.title).toBe('Broken road in Kibera');

    act(() => {
      result.current.handleInputChange('category', 'water');
    });
    expect(result.current.reportData.category).toBe('water');
  });

  it('updates location data from GPS', () => {
    const { result } = renderHook(() => useProblemReporting());

    act(() => {
      result.current.handleLocationDataChange({
        county: 'Nairobi',
        constituency: 'Kibra',
        ward: 'Laini Saba',
        gpsVerified: true,
        coordinates: '-1.3128, 36.7853',
      });
    });

    expect(result.current.reportData.county).toBe('Nairobi');
    expect(result.current.reportData.constituency).toBe('Kibra');
    expect(result.current.reportData.ward).toBe('Laini Saba');
    expect(result.current.reportData.gpsVerified).toBe(true);
    expect(result.current.reportData.coordinates).toBe('-1.3128, 36.7853');
  });

  // ── Photo Management ──

  describe('Photo Management', () => {
    it('adds photos successfully', () => {
      const { result } = renderHook(() => useProblemReporting());
      const mockFile = new File(['photo'], 'road-damage.jpg', { type: 'image/jpeg' });

      act(() => {
        const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;
        result.current.handlePhotoUpload(event);
      });

      expect(result.current.reportData.photos).toHaveLength(1);
      expect(mockToast.success).toHaveBeenCalledWith('1 file(s) added successfully');
    });

    it('rejects more than 10 photos', () => {
      const { result } = renderHook(() => useProblemReporting());

      // Add 10 photos first
      for (let i = 0; i < 10; i++) {
        const file = new File(['p'], `photo${i}.jpg`, { type: 'image/jpeg' });
        act(() => {
          result.current.handlePhotoUpload({
            target: { files: [file] },
          } as unknown as React.ChangeEvent<HTMLInputElement>);
        });
      }
      expect(result.current.reportData.photos).toHaveLength(10);

      // Try adding 11th
      act(() => {
        result.current.handlePhotoUpload({
          target: { files: [new File(['p'], 'extra.jpg', { type: 'image/jpeg' })] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.reportData.photos).toHaveLength(10);
      expect(mockToast.error).toHaveBeenCalledWith('Maximum 10 photos/videos allowed');
    });

    it('removes a photo by index', () => {
      const { result } = renderHook(() => useProblemReporting());
      const files = [
        new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
        new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
      ];

      act(() => {
        result.current.handlePhotoUpload({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>);
      });
      expect(result.current.reportData.photos).toHaveLength(2);

      act(() => {
        result.current.handleRemovePhoto(0);
      });
      expect(result.current.reportData.photos).toHaveLength(1);
      expect(result.current.reportData.photos[0].name).toBe('b.jpg');
    });

    it('handles camera capture', () => {
      const { result } = renderHook(() => useProblemReporting());
      const capturedFile = new File(['camera'], 'capture.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.handleCameraCapture(capturedFile);
      });

      expect(result.current.reportData.photos).toHaveLength(1);
    });

    it('blocks camera capture at max photos', () => {
      const { result } = renderHook(() => useProblemReporting());

      // Fill to 10
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.handleCameraCapture(new File(['p'], `cam${i}.jpg`, { type: 'image/jpeg' }));
        });
      }

      act(() => {
        result.current.handleCameraCapture(new File(['p'], 'extra.jpg', { type: 'image/jpeg' }));
      });

      expect(result.current.reportData.photos).toHaveLength(10);
      expect(mockToast.error).toHaveBeenCalledWith('Maximum 10 photos/videos allowed');
    });
  });

  // ── Validation ──

  describe('Validation', () => {
    it('requires title', () => {
      const { result } = renderHook(() => useProblemReporting());
      const errors = result.current.getValidationErrors();
      expect(errors).toContain('Problem title is required');
    });

    it('requires description', () => {
      const { result } = renderHook(() => useProblemReporting());
      const errors = result.current.getValidationErrors();
      expect(errors).toContain('Description is required');
    });

    it('requires GPS coordinates', () => {
      const { result } = renderHook(() => useProblemReporting());
      const errors = result.current.getValidationErrors();
      expect(errors).toContain('GPS location is required — please allow location access');
    });

    it('requires at least one photo', () => {
      const { result } = renderHook(() => useProblemReporting());
      const errors = result.current.getValidationErrors();
      expect(errors).toContain('At least one photo or video is required');
    });

    it('requires priority', () => {
      const { result } = renderHook(() => useProblemReporting());
      const errors = result.current.getValidationErrors();
      expect(errors).toContain('Priority level is required');
    });

    it('passes validation with complete data', () => {
      const { result } = renderHook(() => useProblemReporting());

      act(() => {
        result.current.handleInputChange('title', 'Pothole on Mombasa Road');
        result.current.handleInputChange('description', 'Large pothole causing accidents near Nyayo Stadium');
        result.current.handleInputChange('category', 'roads');
        result.current.handleInputChange('priority', 'high');
        result.current.handleInputChange('coordinates', '-1.3028, 36.8219');
        result.current.handleCameraCapture(new File(['img'], 'pothole.jpg', { type: 'image/jpeg' }));
      });

      const errors = result.current.getValidationErrors();
      expect(errors).toHaveLength(0);
      expect(result.current.isFormValid()).toBe(true);
    });
  });

  // ── GPS ──

  describe('GPS Location', () => {
    it('calls navigator.geolocation.getCurrentPosition', () => {
      const { result } = renderHook(() => useProblemReporting());

      act(() => {
        result.current.getCurrentLocation();
      });

      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('handles GPS success', () => {
      const mockPosition = {
        coords: { latitude: -1.2921, longitude: 36.8219, accuracy: 10 },
      };
      (navigator.geolocation.getCurrentPosition as any).mockImplementation(
        (success: Function) => success(mockPosition)
      );

      const { result } = renderHook(() => useProblemReporting());

      act(() => {
        result.current.getCurrentLocation();
      });

      expect(result.current.reportData.coordinates).toBe('-1.2921, 36.8219');
      expect(mockToast.success).toHaveBeenCalledWith('GPS location captured successfully');
    });

    it('handles GPS error', () => {
      (navigator.geolocation.getCurrentPosition as any).mockImplementation(
        (_success: Function, error: Function) => error(new Error('denied'))
      );

      const { result } = renderHook(() => useProblemReporting());

      act(() => {
        result.current.getCurrentLocation();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Unable to get GPS location. Please enter manually.');
    });
  });

  // ── Submission ──

  describe('Submission', () => {
    it('requires authentication to submit', async () => {
      const { result } = renderHook(() => useProblemReporting());

      await act(async () => {
        await result.current.submitReport();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Please log in to submit a report');
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });
});
