-- =========================================
-- WITHDRAWALS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.wallet_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  destination_type text NOT NULL CHECK (destination_type IN ('mpesa', 'bank')),
  destination_account text NOT NULL,
  destination_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  reference text UNIQUE NOT NULL,
  transaction_id uuid REFERENCES public.wallet_transactions(id),
  notes text,
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.wallet_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.wallet_withdrawals(status);

ALTER TABLE public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own withdrawals"
  ON public.wallet_withdrawals FOR SELECT
  USING (auth.uid() = user_id OR get_user_type(auth.uid()) = 'government');

CREATE POLICY "Users insert own withdrawals"
  ON public.wallet_withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Government can update withdrawals"
  ON public.wallet_withdrawals FOR UPDATE
  USING (get_user_type(auth.uid()) = 'government');

CREATE TRIGGER update_wallet_withdrawals_updated_at
  BEFORE UPDATE ON public.wallet_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- SEND BY NATIONAL ID
-- Resolves recipient via national_id without exposing the user_id to the sender
-- =========================================
CREATE OR REPLACE FUNCTION public.wallet_send_by_national_id(
  p_recipient_national_id text,
  p_amount numeric,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid := auth.uid();
  v_sender_wallet RECORD;
  v_recipient_user_id uuid;
  v_recipient_wallet RECORD;
  v_tx_id uuid;
  v_clean_id text;
BEGIN
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Normalize ID (digits only, 7-9 chars typical for Kenyan ID)
  v_clean_id := regexp_replace(coalesce(p_recipient_national_id, ''), '\D', '', 'g');
  IF length(v_clean_id) < 6 OR length(v_clean_id) > 12 THEN
    RAISE EXCEPTION 'Invalid National ID format';
  END IF;

  -- Look up recipient by national_id across worker + contractor profiles
  SELECT user_id INTO v_recipient_user_id
  FROM public.citizen_workers
  WHERE regexp_replace(coalesce(national_id, ''), '\D', '', 'g') = v_clean_id
  LIMIT 1;

  IF v_recipient_user_id IS NULL THEN
    -- Fallback: contractor KRA-PIN style or other future identity tables can be added here
    RAISE EXCEPTION 'No registered user found for that National ID';
  END IF;

  IF v_recipient_user_id = v_sender_id THEN
    RAISE EXCEPTION 'Cannot send to yourself';
  END IF;

  -- Get sender wallet
  SELECT * INTO v_sender_wallet
  FROM public.wallets
  WHERE user_id = v_sender_id
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender wallet not found';
  END IF;

  -- Get or create recipient wallet
  SELECT * INTO v_recipient_wallet
  FROM public.wallets
  WHERE user_id = v_recipient_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, wallet_type, balance)
    VALUES (v_recipient_user_id, 'citizen', 0)
    RETURNING * INTO v_recipient_wallet;
  END IF;

  -- Execute transfer atomically
  v_tx_id := public.execute_wallet_transfer(
    v_sender_wallet.id,
    v_recipient_wallet.id,
    p_amount,
    'peer_transfer',
    'NID-' || v_clean_id,
    coalesce(p_note, 'Send by National ID'),
    jsonb_build_object('recipient_national_id', v_clean_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'amount', p_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_send_by_national_id(text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wallet_send_by_national_id(text, numeric, text) TO authenticated;

-- =========================================
-- REQUEST WITHDRAWAL
-- Locks coins (debit to treasury) and creates a withdrawal record
-- =========================================
CREATE OR REPLACE FUNCTION public.wallet_request_withdrawal(
  p_amount numeric,
  p_destination_type text,
  p_destination_account text,
  p_destination_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_wallet RECORD;
  v_treasury RECORD;
  v_tx_id uuid;
  v_withdrawal_id uuid;
  v_reference text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  IF p_destination_type NOT IN ('mpesa', 'bank') THEN
    RAISE EXCEPTION 'Invalid destination type';
  END IF;

  IF length(coalesce(p_destination_account, '')) < 4 THEN
    RAISE EXCEPTION 'Destination account is required';
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  SELECT * INTO v_treasury FROM public.wallets WHERE wallet_type = 'treasury' LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Treasury wallet not configured';
  END IF;

  v_reference := 'WDR-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6);

  -- Debit user wallet, credit treasury (coins are returned to treasury, real cash leaves system)
  v_tx_id := public.execute_wallet_transfer(
    v_wallet.id,
    v_treasury.id,
    p_amount,
    'withdrawal',
    v_reference,
    'Withdrawal to ' || p_destination_type,
    jsonb_build_object('destination_type', p_destination_type, 'destination_account', p_destination_account)
  );

  INSERT INTO public.wallet_withdrawals (
    wallet_id, user_id, amount, destination_type, destination_account, destination_name,
    reference, transaction_id, status
  ) VALUES (
    v_wallet.id, v_user_id, p_amount, p_destination_type, p_destination_account, p_destination_name,
    v_reference, v_tx_id, 'pending'
  ) RETURNING id INTO v_withdrawal_id;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'reference', v_reference,
    'amount', p_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_request_withdrawal(numeric, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wallet_request_withdrawal(numeric, text, text, text) TO authenticated;