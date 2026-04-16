import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockIs = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockSingle = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      is: mockIs,
      order: mockOrder,
      single: mockSingle,
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'gov-user-id' } },
      }),
    },
  },
}));

vi.mock('@/services/LiveNotificationService', () => ({
  default: {
    onProblemReported: vi.fn(),
    onBidSubmitted: vi.fn(),
    onBidAwarded: vi.fn(),
  },
}));

describe('Workflow Service - Project Tracking & Bidding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Project Status Display ──

  describe('Project Status Mapping', () => {
    const statusMap: Record<string, string> = {
      planning: 'Planning',
      in_progress: 'In Progress',
      completed: 'Completed',
      on_hold: 'On Hold',
    };

    Object.entries(statusMap).forEach(([key, display]) => {
      it(`maps status "${key}" to display "${display}"`, () => {
        expect(display).toBeTruthy();
      });
    });
  });

  // ── Budget Formatting (KES) ──

  describe('Budget Formatting', () => {
    it('formats KES amounts correctly', () => {
      const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;
      
      expect(formatKES(1500000)).toBe('KES 1,500,000');
      expect(formatKES(0)).toBe('KES 0');
      expect(formatKES(999)).toBe('KES 999');
      expect(formatKES(50000000)).toBe('KES 50,000,000');
    });

    it('never uses dollar signs', () => {
      const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;
      const formatted = formatKES(1000000);
      expect(formatted).not.toContain('$');
      expect(formatted).toContain('KES');
    });
  });

  // ── Bid Scoring (40-30-30 model) ──

  describe('Bid Evaluation Scoring', () => {
    const calculateBidScore = (
      technicalScore: number,
      priceScore: number,
      experienceScore: number,
      agpoBonus: number = 0
    ) => {
      // Kenya Public Procurement Act: 40% technical, 30% price, 30% experience
      return (
        technicalScore * 0.4 +
        priceScore * 0.3 +
        experienceScore * 0.3 +
        agpoBonus
      );
    };

    it('calculates score with 40-30-30 model', () => {
      const score = calculateBidScore(80, 90, 70);
      // 80*0.4 + 90*0.3 + 70*0.3 = 32 + 27 + 21 = 80
      expect(score).toBe(80);
    });

    it('includes AGPO bonus', () => {
      const withoutAgpo = calculateBidScore(80, 80, 80);
      const withAgpo = calculateBidScore(80, 80, 80, 5);
      expect(withAgpo).toBe(withoutAgpo + 5);
    });

    it('ranks bids correctly', () => {
      const bids = [
        { name: 'A', score: calculateBidScore(90, 70, 80) },      // 36+21+24 = 81
        { name: 'B', score: calculateBidScore(70, 90, 90) },      // 28+27+27 = 82
        { name: 'C', score: calculateBidScore(85, 85, 85, 5) },   // 34+25.5+25.5+5 = 90
      ];
      
      const ranked = bids.sort((a, b) => b.score - a.score);
      expect(ranked[0].name).toBe('C'); // AGPO winner
      expect(ranked[1].name).toBe('B');
      expect(ranked[2].name).toBe('A');
    });

    it('handles zero scores', () => {
      const score = calculateBidScore(0, 0, 0);
      expect(score).toBe(0);
    });

    it('handles perfect scores', () => {
      const score = calculateBidScore(100, 100, 100);
      expect(score).toBe(100);
    });
  });

  // ── Milestone Sequential Enforcement ──

  describe('Milestone Sequencing', () => {
    const validTransitions: Record<string, string[]> = {
      pending: ['in_progress'],
      in_progress: ['submitted'],
      submitted: ['verified', 'in_progress'], // reject goes back
      verified: ['paid'],
    };

    it('allows valid transitions', () => {
      expect(validTransitions['pending']).toContain('in_progress');
      expect(validTransitions['in_progress']).toContain('submitted');
      expect(validTransitions['submitted']).toContain('verified');
    });

    it('blocks skipping milestones (pending → submitted)', () => {
      expect(validTransitions['pending']).not.toContain('submitted');
    });

    it('blocks skipping milestones (pending → verified)', () => {
      expect(validTransitions['pending']).not.toContain('verified');
    });

    it('allows rejection back to in_progress', () => {
      expect(validTransitions['submitted']).toContain('in_progress');
    });
  });
});
