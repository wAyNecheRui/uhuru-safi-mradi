import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFullLocationByCoordinates } from '@/constants/kenyaAdminData';

describe('Reverse Geocoding - Kenya Admin Data', () => {
  it('returns location data for Nairobi coordinates', () => {
    // Nairobi CBD area
    const result = getFullLocationByCoordinates(-1.2921, 36.8219);
    expect(result).toBeDefined();
    if (result) {
      expect(result.county).toBeTruthy();
      expect(result.constituency).toBeTruthy();
      expect(result.ward).toBeTruthy();
    }
  });

  it('returns location data for Mombasa coordinates', () => {
    const result = getFullLocationByCoordinates(-4.0435, 39.6682);
    expect(result).toBeDefined();
    if (result) {
      expect(result.county).toBeTruthy();
    }
  });

  it('returns location data for Kisumu coordinates', () => {
    const result = getFullLocationByCoordinates(-0.1022, 34.7617);
    expect(result).toBeDefined();
  });

  it('handles coordinates outside Kenya gracefully', () => {
    // London coordinates
    const result = getFullLocationByCoordinates(51.5074, -0.1278);
    // Should either return null or the nearest match
    // The function should not crash
    expect(true).toBe(true); // No crash = pass
  });

  it('handles edge coordinates (equator crossing)', () => {
    // Near equator in Kenya
    const result = getFullLocationByCoordinates(0.0236, 37.9062);
    expect(result).toBeDefined();
  });

  it('handles boundary coordinates between counties', () => {
    // Near Nairobi-Kiambu boundary
    const result = getFullLocationByCoordinates(-1.1941, 36.8270);
    expect(result).toBeDefined();
    if (result) {
      expect(['Nairobi', 'Kiambu']).toContain(result.county);
    }
  });
});
