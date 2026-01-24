/**
 * Unified progress calculation utility
 * 
 * This file provides a single source of truth for calculating project progress
 * based on milestone statuses. All components across the system should use this
 * to ensure consistency.
 */

export interface MilestoneForProgress {
  status: string;
  payment_percentage?: number;
}

/**
 * Calculate overall project progress based on milestone statuses.
 * 
 * Progress is calculated using a weighted system:
 * - 'paid' or 'completed': 100% credit for that milestone
 * - 'verified': 100% credit (verified means payment is imminent)
 * - 'submitted': 80% credit (work done, awaiting verification)
 * - 'in_progress': 40% credit (actively being worked on)
 * - 'pending': 0% credit
 * 
 * If milestones have payment_percentage, we use weighted calculation.
 * Otherwise, we use equal weight per milestone.
 */
export const calculateProjectProgress = (milestones: MilestoneForProgress[]): number => {
  if (!milestones || milestones.length === 0) return 0;

  // Check if milestones have payment percentages defined
  const hasPaymentWeights = milestones.some(m => m.payment_percentage && m.payment_percentage > 0);

  if (hasPaymentWeights) {
    // Weighted calculation based on payment_percentage
    let totalProgress = 0;
    let totalWeight = 0;

    milestones.forEach(milestone => {
      const weight = milestone.payment_percentage || 0;
      totalWeight += weight;
      
      const statusMultiplier = getStatusMultiplier(milestone.status);
      totalProgress += weight * statusMultiplier;
    });

    // Normalize to 100 if total weight doesn't equal 100
    if (totalWeight > 0) {
      return Math.round((totalProgress / totalWeight) * 100);
    }
    return 0;
  } else {
    // Equal weight calculation
    let totalProgress = 0;

    milestones.forEach(milestone => {
      totalProgress += getStatusMultiplier(milestone.status);
    });

    return Math.round((totalProgress / milestones.length) * 100);
  }
};

/**
 * Get the progress multiplier (0 to 1) based on milestone status
 */
const getStatusMultiplier = (status: string): number => {
  switch (status) {
    case 'paid':
    case 'completed':
    case 'verified':
      return 1.0; // 100% complete
    case 'submitted':
      return 0.8; // 80% - work done, awaiting verification
    case 'in_progress':
      return 0.4; // 40% - actively being worked on
    case 'pending':
    default:
      return 0; // Not started
  }
};

/**
 * Simple completion-based progress (only counts fully completed milestones)
 * Use this for summary statistics where you want to show X of Y milestones complete
 */
export const calculateCompletedMilestones = (milestones: MilestoneForProgress[]): { 
  completed: number; 
  total: number;
  percentage: number;
} => {
  if (!milestones || milestones.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const completed = milestones.filter(m => 
    m.status === 'paid' || m.status === 'completed' || m.status === 'verified'
  ).length;

  return {
    completed,
    total: milestones.length,
    percentage: Math.round((completed / milestones.length) * 100)
  };
};

/**
 * Determine if a project is effectively completed based on milestone status
 * A project is complete if:
 * 1. Its status is 'completed', OR
 * 2. All its milestones are in a completed state (paid/verified/completed)
 * 
 * This handles cases where all milestones are done but project status hasn't been updated
 */
export const isProjectEffectivelyCompleted = (
  projectStatus: string | null | undefined,
  milestones: MilestoneForProgress[]
): boolean => {
  // Check explicit completion status
  if (projectStatus === 'completed') return true;
  
  // If no milestones, rely on project status
  if (!milestones || milestones.length === 0) return false;
  
  // Check if all milestones are in a completed state
  const completedMilestones = milestones.filter(m => 
    m.status === 'paid' || m.status === 'completed' || m.status === 'verified'
  ).length;
  
  return completedMilestones === milestones.length;
};

/**
 * Get effective project status based on milestones
 * Returns 'completed' if all milestones are done, otherwise returns original status
 */
export const getEffectiveProjectStatus = (
  originalStatus: string | null | undefined,
  milestones: MilestoneForProgress[]
): string => {
  if (isProjectEffectivelyCompleted(originalStatus, milestones)) {
    return 'completed';
  }
  return originalStatus || 'planning';
};
