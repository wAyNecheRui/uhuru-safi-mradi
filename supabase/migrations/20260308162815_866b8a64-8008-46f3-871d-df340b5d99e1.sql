-- Table to store contact form submissions
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  user_type text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread',
  responded_at timestamptz,
  responded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Government users can view contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (public.get_user_type(auth.uid()) = 'government');

CREATE POLICY "Government users can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (public.get_user_type(auth.uid()) = 'government');