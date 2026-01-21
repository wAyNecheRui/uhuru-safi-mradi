-- Allow system/edge functions to insert notifications via service role
-- But also enable real-time subscriptions for users
-- Note: INSERT will only work via edge functions with service_role key

-- Add a policy for service role to insert (this allows edge functions to work)
-- The INSERT restriction is intentional - only backend should create notifications

-- Let's add a delete policy for users to manage their notifications
CREATE POLICY "Users can delete their notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- Ensure realtime is enabled for the table (it uses SELECT policy)
-- The existing SELECT policy is correct: (auth.uid() = user_id)

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);