
DROP POLICY "Contractors can submit milestone evidence" ON public.project_milestones;

CREATE POLICY "Contractors can update their project milestones"
ON public.project_milestones FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_milestones.project_id
    AND p.contractor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_milestones.project_id
    AND p.contractor_id = auth.uid()
  )
  AND status = ANY (ARRAY['pending', 'in_progress', 'submitted'])
  AND verified_at IS NULL
  AND verified_by IS NULL
);
