
-- Update the notifications category constraint to include all categories used by the system
-- Drop the existing constraint first, then add the expanded one
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_category_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_category_check 
CHECK (category = ANY (ARRAY[
  'report'::text,
  'project'::text, 
  'payment'::text, 
  'verification'::text, 
  'system'::text,
  'bid'::text,
  'bidding'::text,
  'milestone'::text,
  'escrow'::text,
  'vote'::text,
  'issue'::text,
  'rating'::text,
  'general'::text
]));
