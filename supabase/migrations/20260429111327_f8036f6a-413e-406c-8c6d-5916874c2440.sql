
-- =========================================
-- 1. AUTO-FUND ESCROW ON BID AWARD
-- =========================================
CREATE OR REPLACE FUNCTION public.auto_fund_escrow_on_award()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_treasury_wallet RECORD;
  v_escrow_wallet RECORD;
  v_escrow_account RECORD;
  v_existing_escrow RECORD;
BEGIN
  -- Only fire when contractor_id is being SET (transition from NULL to a value)
  -- and a budget is present
  IF NEW.contractor_id IS NULL OR NEW.budget IS NULL OR NEW.budget <= 0 THEN
    RETURN NEW;
  END IF;

  IF OLD.contractor_id IS NOT NULL THEN
    -- Already awarded previously, do nothing
    RETURN NEW;
  END IF;

  -- Get treasury wallet
  SELECT * INTO v_treasury_wallet
  FROM public.wallets WHERE wallet_type = 'treasury' LIMIT 1;
  IF NOT FOUND THEN
    RAISE LOG '[auto_fund_escrow] Treasury wallet not configured, skipping auto-fund for project %', NEW.id;
    RETURN NEW;
  END IF;

  -- Get or create escrow_accounts row
  SELECT * INTO v_existing_escrow
  FROM public.escrow_accounts
  WHERE project_id = NEW.id AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.escrow_accounts (
      project_id, total_amount, held_amount, released_amount, status
    ) VALUES (
      NEW.id, NEW.budget, NEW.budget, 0, 'active'
    )
    RETURNING * INTO v_escrow_account;
  ELSE
    v_escrow_account := v_existing_escrow;
    -- Top up held_amount to budget if under
    IF v_escrow_account.held_amount < NEW.budget THEN
      UPDATE public.escrow_accounts
      SET held_amount = NEW.budget, total_amount = NEW.budget
      WHERE id = v_escrow_account.id
      RETURNING * INTO v_escrow_account;
    END IF;
  END IF;

  -- Get or create escrow wallet linked to this account
  SELECT * INTO v_escrow_wallet
  FROM public.wallets
  WHERE escrow_account_id = v_escrow_account.id AND wallet_type = 'escrow'
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, wallet_type, balance, escrow_account_id, status)
    VALUES (NULL, 'escrow', 0, v_escrow_account.id, 'active')
    RETURNING * INTO v_escrow_wallet;
  END IF;

  -- Skip if already funded to (or above) budget
  IF v_escrow_wallet.balance >= NEW.budget THEN
    RETURN NEW;
  END IF;

  -- Mint from treasury into escrow wallet (delta only)
  PERFORM public.execute_wallet_transfer(
    v_treasury_wallet.id,
    v_escrow_wallet.id,
    NEW.budget - v_escrow_wallet.balance,
    'fund_escrow',
    'AUTO-FUND-' || NEW.id::text,
    'Auto-allocation on bid award for project ' || COALESCE(NEW.title, NEW.id::text),
    jsonb_build_object('project_id', NEW.id, 'auto', true)
  );

  RAISE LOG '[auto_fund_escrow] Project % funded with KES %', NEW.id, NEW.budget;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_fund_escrow_on_award ON public.projects;
CREATE TRIGGER trg_auto_fund_escrow_on_award
AFTER UPDATE OF contractor_id, budget ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.auto_fund_escrow_on_award();

-- Also fire on INSERT in case a project is created with contractor pre-assigned
CREATE OR REPLACE FUNCTION public.auto_fund_escrow_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fake_old projects%ROWTYPE;
BEGIN
  v_fake_old := NEW;
  v_fake_old.contractor_id := NULL;
  PERFORM public.auto_fund_escrow_on_award();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[auto_fund_escrow_on_insert] skipped: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- =========================================
-- 2. SEND BY BUSINESS REGISTRATION NUMBER
-- =========================================
CREATE OR REPLACE FUNCTION public.wallet_send_by_business_reg(
  p_business_reg text,
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
  v_clean text;
  v_tx_id uuid;
BEGIN
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  v_clean := upper(regexp_replace(coalesce(p_business_reg, ''), '\s', '', 'g'));
  IF length(v_clean) < 4 THEN
    RAISE EXCEPTION 'Invalid Business Registration Number';
  END IF;

  -- Look up contractor by business registration number
  SELECT user_id INTO v_recipient_user_id
  FROM public.contractor_profiles
  WHERE upper(regexp_replace(coalesce(business_registration_number, ''), '\s', '', 'g')) = v_clean
  LIMIT 1;

  IF v_recipient_user_id IS NULL THEN
    RAISE EXCEPTION 'No registered contractor found for that Business Registration Number';
  END IF;

  IF v_recipient_user_id = v_sender_id THEN
    RAISE EXCEPTION 'Cannot send to yourself';
  END IF;

  SELECT * INTO v_sender_wallet FROM public.wallets WHERE user_id = v_sender_id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender wallet not found';
  END IF;

  SELECT * INTO v_recipient_wallet FROM public.wallets WHERE user_id = v_recipient_user_id LIMIT 1;
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, wallet_type, balance)
    VALUES (v_recipient_user_id, 'contractor', 0)
    RETURNING * INTO v_recipient_wallet;
  END IF;

  v_tx_id := public.execute_wallet_transfer(
    v_sender_wallet.id,
    v_recipient_wallet.id,
    p_amount,
    'peer_transfer',
    'BRN-' || v_clean,
    coalesce(p_note, 'Send by Business Reg #'),
    jsonb_build_object('recipient_business_reg', v_clean)
  );

  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id, 'amount', p_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_send_by_business_reg(text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wallet_send_by_business_reg(text, numeric, text) TO authenticated;

-- =========================================
-- 3. MANUAL ALLOCATE / TOP-UP ESCROW
-- Government may add funds to a project escrow (e.g., cost overruns)
-- =========================================
CREATE OR REPLACE FUNCTION public.wallet_topup_project_escrow(
  p_project_id uuid,
  p_amount numeric,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_treasury RECORD;
  v_escrow_account RECORD;
  v_escrow_wallet RECORD;
  v_tx_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Government-only
  IF public.get_user_type(v_user_id) NOT IN ('government', 'admin') THEN
    RAISE EXCEPTION 'Only government users may allocate project funds';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT * INTO v_treasury FROM public.wallets WHERE wallet_type = 'treasury' LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Treasury wallet not configured';
  END IF;

  -- Find or create escrow_accounts row
  SELECT * INTO v_escrow_account
  FROM public.escrow_accounts
  WHERE project_id = p_project_id AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.escrow_accounts (project_id, total_amount, held_amount, status)
    VALUES (p_project_id, p_amount, p_amount, 'active')
    RETURNING * INTO v_escrow_account;
  ELSE
    UPDATE public.escrow_accounts
    SET total_amount = total_amount + p_amount,
        held_amount = held_amount + p_amount
    WHERE id = v_escrow_account.id
    RETURNING * INTO v_escrow_account;
  END IF;

  -- Find or create escrow wallet
  SELECT * INTO v_escrow_wallet
  FROM public.wallets
  WHERE escrow_account_id = v_escrow_account.id AND wallet_type = 'escrow'
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, wallet_type, balance, escrow_account_id, status)
    VALUES (NULL, 'escrow', 0, v_escrow_account.id, 'active')
    RETURNING * INTO v_escrow_wallet;
  END IF;

  v_tx_id := public.execute_wallet_transfer(
    v_treasury.id,
    v_escrow_wallet.id,
    p_amount,
    'fund_escrow',
    'TOPUP-' || p_project_id::text || '-' || extract(epoch from now())::bigint,
    coalesce(p_reason, 'Manual escrow top-up'),
    jsonb_build_object('project_id', p_project_id, 'manual', true, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'escrow_wallet_id', v_escrow_wallet.id,
    'amount', p_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_topup_project_escrow(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wallet_topup_project_escrow(uuid, numeric, text) TO authenticated;
