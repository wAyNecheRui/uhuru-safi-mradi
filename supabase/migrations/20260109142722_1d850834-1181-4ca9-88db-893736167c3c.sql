-- Drop the overly restrictive INSERT policy
DROP POLICY IF EXISTS "Verified contractors bid" ON contractor_bids;

-- Create a new policy that allows any contractor to bid (verification shown in UI)
CREATE POLICY "Contractors can submit bids"
ON contractor_bids
FOR INSERT
WITH CHECK (
  auth.uid() = contractor_id
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.user_type = 'contractor'
  )
);

-- Also ensure DELETE policy exists for contractors to withdraw their own bids
DROP POLICY IF EXISTS "Contractors can delete own bids" ON contractor_bids;
CREATE POLICY "Contractors can delete own pending bids"
ON contractor_bids
FOR DELETE
USING (
  auth.uid() = contractor_id
  AND status = 'submitted'
  AND deleted_at IS NULL
);