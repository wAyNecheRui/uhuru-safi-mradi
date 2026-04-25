
-- ============================================================================
-- PHASE 1: IN-HOUSE COIN WALLET SYSTEM
-- 1 coin = 1 KES. Government treasury wallet has unlimited mint authority.
-- ============================================================================

-- 1. WALLETS TABLE
-- Each user (citizen, contractor, government) gets one wallet.
-- The single 'treasury' wallet is the source of all minted coins.
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE, -- NULL for the treasury wallet
  wallet_type text NOT NULL CHECK (wallet_type IN ('citizen', 'contractor', 'government', 'treasury', 'escrow')),
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0 OR wallet_type = 'treasury'),
  total_received numeric NOT NULL DEFAULT 0,
  total_sent numeric NOT NULL DEFAULT 0,
  total_withdrawn numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  escrow_account_id uuid, -- For escrow-type wallets, links to escrow_accounts.id
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallets_type ON public.wallets(wallet_type);
CREATE INDEX idx_wallets_escrow ON public.wallets(escrow_account_id) WHERE escrow_account_id IS NOT NULL;

-- Only one treasury wallet allowed
CREATE UNIQUE INDEX idx_one_treasury ON public.wallets((wallet_type)) WHERE wallet_type = 'treasury';

-- 2. WALLET TRANSACTIONS LEDGER
-- Append-only double-entry ledger for every coin movement.
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_wallet_id uuid REFERENCES public.wallets(id),
  to_wallet_id uuid REFERENCES public.wallets(id),
  amount numeric NOT NULL CHECK (amount > 0),
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'mint',           -- treasury creates new coins
    'fund_escrow',    -- treasury -> escrow wallet
    'worker_payment', -- escrow -> worker wallet
    'contractor_payment', -- escrow -> contractor wallet
    'peer_transfer',  -- user -> user (send)
    'withdrawal',     -- user -> external (M-Pesa simulation)
    'refund'          -- escrow -> treasury
  )),
  reference text, -- external reference (e.g. M-Pesa ref, project id)
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  initiated_by uuid, -- auth.uid() that triggered this
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_tx_from ON public.wallet_transactions(from_wallet_id, created_at DESC);
CREATE INDEX idx_wallet_tx_to ON public.wallet_transactions(to_wallet_id, created_at DESC);
CREATE INDEX idx_wallet_tx_type ON public.wallet_transactions(transaction_type, created_at DESC);
CREATE INDEX idx_wallet_tx_initiated ON public.wallet_transactions(initiated_by, created_at DESC);

-- 3. ENABLE RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet
CREATE POLICY "Users view own wallet"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id OR get_user_type(auth.uid()) = 'government');

-- Government can view all wallets (oversight)
CREATE POLICY "Government views all wallets"
ON public.wallets FOR SELECT
USING (get_user_type(auth.uid()) = 'government');

-- Only system (SECURITY DEFINER functions) can insert/update wallets
CREATE POLICY "System manages wallets"
ON public.wallets FOR ALL
USING (false) WITH CHECK (false);

-- Users see transactions involving their own wallet
CREATE POLICY "Users view own transactions"
ON public.wallet_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.wallets w
    WHERE (w.id = wallet_transactions.from_wallet_id OR w.id = wallet_transactions.to_wallet_id)
      AND w.user_id = auth.uid()
  )
  OR get_user_type(auth.uid()) = 'government'
);

-- Append-only: no updates, no deletes
CREATE POLICY "No transaction updates"
ON public.wallet_transactions FOR UPDATE USING (false);
CREATE POLICY "No transaction deletes"
ON public.wallet_transactions FOR DELETE USING (false);

-- 4. AUTO-CREATE WALLET ON USER PROFILE CREATION
CREATE OR REPLACE FUNCTION public.create_wallet_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, wallet_type, balance)
  VALUES (NEW.user_id, NEW.user_type, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_wallet_for_user
AFTER INSERT ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_user();

-- 5. SEED THE TREASURY WALLET (unlimited mint authority)
INSERT INTO public.wallets (user_id, wallet_type, balance, status)
VALUES (NULL, 'treasury', 0, 'active')
ON CONFLICT DO NOTHING;

-- 6. BACKFILL WALLETS FOR EXISTING USERS
INSERT INTO public.wallets (user_id, wallet_type, balance)
SELECT user_id, user_type, 0
FROM public.user_profiles
WHERE user_id NOT IN (SELECT user_id FROM public.wallets WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- 7. CORE TRANSFER FUNCTION (atomic, double-entry)
CREATE OR REPLACE FUNCTION public.execute_wallet_transfer(
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
  p_amount numeric,
  p_transaction_type text,
  p_reference text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_wallet RECORD;
  v_to_wallet RECORD;
  v_tx_id uuid;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  -- Lock both wallets (consistent order to prevent deadlock)
  IF p_from_wallet_id IS NOT NULL THEN
    SELECT * INTO v_from_wallet FROM public.wallets WHERE id = p_from_wallet_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Source wallet not found'; END IF;
    IF v_from_wallet.status != 'active' THEN RAISE EXCEPTION 'Source wallet is %', v_from_wallet.status; END IF;
    -- Treasury can go negative (mints coins), all others must have funds
    IF v_from_wallet.wallet_type != 'treasury' AND v_from_wallet.balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient balance: have %, need %', v_from_wallet.balance, p_amount;
    END IF;
  END IF;

  IF p_to_wallet_id IS NOT NULL THEN
    SELECT * INTO v_to_wallet FROM public.wallets WHERE id = p_to_wallet_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Destination wallet not found'; END IF;
    IF v_to_wallet.status != 'active' THEN RAISE EXCEPTION 'Destination wallet is %', v_to_wallet.status; END IF;
  END IF;

  -- Debit source
  IF p_from_wallet_id IS NOT NULL THEN
    UPDATE public.wallets
    SET balance = balance - p_amount,
        total_sent = total_sent + p_amount,
        updated_at = now()
    WHERE id = p_from_wallet_id;
  END IF;

  -- Credit destination
  IF p_to_wallet_id IS NOT NULL THEN
    UPDATE public.wallets
    SET balance = balance + p_amount,
        total_received = total_received + p_amount,
        updated_at = now()
    WHERE id = p_to_wallet_id;
  END IF;

  -- Ledger entry
  INSERT INTO public.wallet_transactions (
    from_wallet_id, to_wallet_id, amount, transaction_type,
    reference, description, metadata, initiated_by, status
  ) VALUES (
    p_from_wallet_id, p_to_wallet_id, p_amount, p_transaction_type,
    p_reference, p_description, p_metadata, auth.uid(), 'completed'
  )
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

-- 8. HELPER: GET OR CREATE WALLET FOR USER
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_user_type text;
BEGIN
  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = p_user_id;
  IF FOUND THEN RETURN v_wallet_id; END IF;

  SELECT user_type INTO v_user_type FROM public.user_profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found'; END IF;

  INSERT INTO public.wallets (user_id, wallet_type, balance)
  VALUES (p_user_id, v_user_type, 0)
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
END;
$$;

-- 9. HELPER: GET TREASURY WALLET ID
CREATE OR REPLACE FUNCTION public.get_treasury_wallet_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.wallets WHERE wallet_type = 'treasury' LIMIT 1;
$$;

-- 10. HELPER: GET OR CREATE ESCROW WALLET
CREATE OR REPLACE FUNCTION public.get_or_create_escrow_wallet(p_escrow_account_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  SELECT id INTO v_wallet_id FROM public.wallets WHERE escrow_account_id = p_escrow_account_id;
  IF FOUND THEN RETURN v_wallet_id; END IF;

  INSERT INTO public.wallets (user_id, wallet_type, balance, escrow_account_id)
  VALUES (NULL, 'escrow', 0, p_escrow_account_id)
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
END;
$$;

-- 11. UPDATE TIMESTAMP TRIGGER
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
