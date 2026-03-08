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
  const normalised = (status || 'pending').toLowerCase().trim();
  return STAGE_MAP[normalised] || STAGE_MAP.pending;
};

/**
 * Get a short badge label for compact displays (e.g., card badges).
 */
export const getWorkflowBadgeLabel = (status: string | null | undefined): string => {
  return getWorkflowStageDisplay(status).label;
};
