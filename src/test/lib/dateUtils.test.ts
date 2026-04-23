import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDateTime,
  formatTime,
  formatDate,
  formatRelativeDateTime,
} from '@/lib/dateUtils';

/**
 * dateUtils underpins every timestamp shown to citizens, contractors, and
 * government users. These tests lock in:
 *   - graceful handling of invalid input (no crashes on malformed DB strings)
 *   - 12-hour AM/PM display (Kenyan civic-tech convention)
 *   - relative-time bucketing (Just now / mins / hours / days)
 */
describe('lib/dateUtils', () => {
  describe('invalid input', () => {
    it('formatDateTime returns "Invalid date" for garbage strings', () => {
      expect(formatDateTime('not-a-date')).toBe('Invalid date');
    });

    it('formatTime returns "Invalid time" for garbage strings', () => {
      expect(formatTime('not-a-date')).toBe('Invalid time');
    });

    it('formatDate returns "Invalid date" for garbage strings', () => {
      expect(formatDate('not-a-date')).toBe('Invalid date');
    });
  });

  describe('formatting', () => {
    it('formatDateTime produces a string containing AM or PM', () => {
      const out = formatDateTime('2026-04-23T09:30:00.000Z');
      expect(typeof out).toBe('string');
      expect(out).toMatch(/am|pm/i);
    });

    it('formatDate excludes time components', () => {
      const out = formatDate('2026-04-23T09:30:00.000Z');
      // No AM/PM and no colon-separated minutes in date-only format.
      expect(out).not.toMatch(/AM|PM/);
      expect(out).not.toMatch(/:\d{2}/);
    });
  });

  describe('formatRelativeDateTime', () => {
    const FROZEN_NOW = new Date('2026-04-23T12:00:00.000Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(FROZEN_NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "Just now" for sub-minute differences', () => {
      const t = new Date(FROZEN_NOW.getTime() - 30_000); // 30s ago
      expect(formatRelativeDateTime(t)).toBe('Just now');
    });

    it('returns minutes for sub-hour differences with correct pluralization', () => {
      const single = new Date(FROZEN_NOW.getTime() - 60_000); // 1 min
      const plural = new Date(FROZEN_NOW.getTime() - 5 * 60_000); // 5 min
      expect(formatRelativeDateTime(single)).toBe('1 min ago');
      expect(formatRelativeDateTime(plural)).toBe('5 mins ago');
    });

    it('returns hours for sub-day differences', () => {
      const t = new Date(FROZEN_NOW.getTime() - 3 * 3_600_000); // 3 hours
      expect(formatRelativeDateTime(t)).toBe('3 hours ago');
    });

    it('returns days for sub-week differences', () => {
      const t = new Date(FROZEN_NOW.getTime() - 2 * 86_400_000); // 2 days
      expect(formatRelativeDateTime(t)).toBe('2 days ago');
    });

    it('falls back to absolute date for older entries (>= 7 days)', () => {
      const t = new Date(FROZEN_NOW.getTime() - 30 * 86_400_000); // 30 days
      const out = formatRelativeDateTime(t);
      expect(out).not.toMatch(/ago|Just now/);
      expect(out).toMatch(/AM|PM/);
    });

    it('handles invalid input safely', () => {
      expect(formatRelativeDateTime('garbage')).toBe('Invalid date');
    });
  });
});
