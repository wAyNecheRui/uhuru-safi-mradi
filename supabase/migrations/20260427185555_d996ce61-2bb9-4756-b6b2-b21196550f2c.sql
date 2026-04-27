CREATE OR REPLACE FUNCTION public.wallet_process_withdrawal(
  p_withdrawal_id uuid,
  p_new_status text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_withdrawal RECORD;
  v_treasury RECORD;
  v_refund_tx uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF get_user_type(v_actor) <> 'government' THEN
    RAISE EXCEPTION 'Only government users can process withdrawals';
  END IF;

  IF p_new_status NOT IN ('processing', 'paid', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  SELECT * INTO v_withdrawal
  FROM public.wallet_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF v_withdrawal.status IN ('paid', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Withdrawal already finalized as %', v_withdrawal.status;
  END IF;

  -- If marking failed/cancelled, refund coins from treasury back to user
  IF p_new_status IN ('failed', 'cancelled') THEN
    SELECT * INTO v_treasury FROM public.wallets WHERE wallet_type = 'treasury' LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Treasury wallet not configured';
    END IF;

    v_refund_tx := public.execute_wallet_transfer(
      v_treasury.id,
      v_withdrawal.wallet_id,
      v_withdrawal.amount,
      'refund',
      'REFUND-' || v_withdrawal.reference,
      'Refund: withdrawal ' || p_new_status,
      jsonb_build_object('original_withdrawal_id', v_withdrawal.id)
    );
  END IF;

  UPDATE public.wallet_withdrawals
  SET status = p_new_status,
      notes = COALESCE(p_notes, notes),
      processed_by = v_actor,
      processed_at = now(),
      updated_at = now()
  WHERE id = p_withdrawal_id;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', p_withdrawal_id,
    'status', p_new_status,
    'refund_transaction_id', v_refund_tx
  );
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_process_withdrawal(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wallet_process_withdrawal(uuid, text, text) TO authenticated;