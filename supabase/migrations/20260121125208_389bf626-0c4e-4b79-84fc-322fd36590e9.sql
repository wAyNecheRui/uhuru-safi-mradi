-- Allow contractors to create milestones for their own projects
CREATE POLICY "Contractors can create milestones for their projects"
ON project_milestones
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_milestones.project_id
    AND p.contractor_id = auth.uid()
  )
);

-- Allow contractors to delete milestones for their own projects (needed for reconfiguration)
CREATE POLICY "Contractors can delete milestones for their projects"
ON project_milestones
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_milestones.project_id
    AND p.contractor_id = auth.uid()
  )
  AND status = 'pending'
);

-- Also allow government to delete milestones
CREATE POLICY "Government can delete milestones"
ON project_milestones
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.user_type = 'government'
  )
);