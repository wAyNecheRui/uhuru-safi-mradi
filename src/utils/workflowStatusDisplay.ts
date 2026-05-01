/**
 * Shared utility for displaying dynamic workflow stage labels across all pages/roles.
 * Maps the report.status (and optionally project data) to a human-readable label,
 * icon hint, and color class so every page stays consistent and auto-updates.
 */

export interface WorkflowStageDisplay {
  label: string;
  description: string;
  colorClass: string; // Tailwind bg + text classes
  icon: 'pending' | 'review' | 'approved' | 'bidding' | 'contractor' | 'progress' | 'verification' | 'completed' | 'rejected';
}

/**
 * Lifecycle bucket — coarse 5-stage grouping used for navigation tabs and filters.
 * Every canonical status maps to exactly one bucket.
 */
export type LifecycleBucket =
  | 'awaiting_action'
  | 'in_procurement'
  | 'active_delivery'
  | 'completed'
  | 'closed';

export const LIFECYCLE_BUCKETS: { key: LifecycleBucket; label: string; description: string }[] = [
  { key: 'awaiting_action', label: 'Awaiting Action', description: 'Pending validation, review or approval' },
  { key: 'in_procurement', label: 'In Procurement', description: 'Open for bids or contractor selected' },
  { key: 'active_delivery', label: 'Active Delivery', description: 'Funded, in progress or under verification' },
  { key: 'completed', label: 'Completed', description: 'All milestones paid and closed' },
  { key: 'closed', label: 'Closed / Rejected', description: 'Cancelled or rejected projects' },
];

/**
 * Normalise any legacy / UI-cased status string to the canonical workflow status key.
 * Keeps every consumer in sync with one source of truth.
 */
export const normaliseStatus = (status: string | null | undefined): string => {
  const s = (status || 'pending').toLowerCase().trim().replace(/\s+/g, '_');
  // Legacy aliases → canonical
  const aliases: Record<string, string> = {
    planning: 'bidding_open',          // legacy "planning" was used while bidding was open
    pending_review: 'under_review',
    active: 'in_progress',
    submitted: 'pending',
    community_review: 'pending',
    government_review: 'under_review',
  };
  return aliases[s] || s;
};

/**
 * Map a canonical (or legacy) status to its lifecycle bucket.
 */
export const getLifecycleBucket = (status: string | null | undefined): LifecycleBucket => {
  const s = normaliseStatus(status);
  if (['pending', 'under_review', 'approved'].includes(s)) return 'awaiting_action';
  if (['bidding_open', 'contractor_selected'].includes(s)) return 'in_procurement';
  if (['funded', 'in_progress', 'under_verification', 'verification', 'payment_released'].includes(s)) return 'active_delivery';
  if (s === 'completed') return 'completed';
  if (['rejected', 'cancelled'].includes(s)) return 'closed';
  return 'awaiting_action';
};

const STAGE_MAP: Record<string, WorkflowStageDisplay> = {
  pending: {
    label: 'Awaiting Community Votes',
    description: 'This report needs more community support before it can be reviewed.',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: 'pending',
  },
  under_review: {
    label: 'Under Government Review',
    description: 'This report has received sufficient community support and is being reviewed by government officials.',
    colorClass: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: 'review',
  },
  approved: {
    label: 'Government Approved',
    description: 'This report has been approved by the government. Bidding will open soon.',
    colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: 'approved',
  },
  bidding_open: {
    label: 'Open for Contractor Bids',
    description: 'Verified contractors can now submit bids for this project.',
    colorClass: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: 'bidding',
  },
  contractor_selected: {
    label: 'Contractor Selected',
    description: 'A contractor has been awarded this project. Escrow funding is being set up.',
    colorClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: 'contractor',
  },
  in_progress: {
    label: 'Work In Progress',
    description: 'The contractor is actively working on this project with milestone tracking.',
    colorClass: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: 'progress',
  },
  under_verification: {
    label: 'Awaiting Citizen Verification',
    description: 'Work is complete and awaiting citizen verification before final payment.',
    colorClass: 'bg-orange-50 text-orange-800 border-orange-200',
    icon: 'verification',
  },
  completed: {
    label: 'Project Completed',
    description: 'All milestones verified and payments released. This project is complete.',
    colorClass: 'bg-green-50 text-green-800 border-green-200',
    icon: 'completed',
  },
  rejected: {
    label: 'Report Rejected',
    description: 'This report was reviewed and rejected by government officials.',
    colorClass: 'bg-red-50 text-red-800 border-red-200',
    icon: 'rejected',
  },
};

/**
 * Get the current workflow stage display info for a report.
 * Uses report.status as the source of truth.
 */
export const getWorkflowStageDisplay = (status: string | null | undefined): WorkflowStageDisplay => {
  const normalised = normaliseStatus(status);
  return STAGE_MAP[normalised] || STAGE_MAP.pending;
};

/**
 * Get a short badge label for compact displays (e.g., card badges).
 */
export const getWorkflowBadgeLabel = (status: string | null | undefined): string => {
  return getWorkflowStageDisplay(status).label;
};
