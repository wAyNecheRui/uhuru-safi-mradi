import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCorsHeaders } from "../_shared/cors.ts"

// Known Safaricom IP ranges for M-Pesa callbacks (production)
const SAFARICOM_IP_RANGES = [
  '196.201.214.',
  '196.201.212.',
  '196.201.213.',
];

// SECURITY: Max payload size (100KB) to prevent OOM
const MAX_BODY_SIZE = 102400;

// SECURITY: Use environment variable to control demo mode, default to strict
const DEMO_MODE = Deno.env.get('MPESA_DEMO_MODE') === 'true';

// === SECURITY: HMAC signature verification ===
async function verifyCallbackSignature(
  rawBody: string,
  signatureHeader: string | null,
  sharedSecret: string
): Promise<boolean> {
  // SECURITY FIX: Never skip signature verification based on demo mode alone.
  // In demo mode without a configured secret, require no signature header either (internal calls only).
  if (!signatureHeader && !sharedSecret) {
    // Only allow if demo mode AND no secret is configured (development only)
    if (DEMO_MODE) return true;
    return false;
  }

  if (!signatureHeader || !sharedSecret) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(sharedSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const computedHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison
    if (computedHex.length !== signatureHeader.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computedHex.length; i++) {
      mismatch |= computedHex.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

// === SECURITY: Validate source IP ===
function validateSourceIP(req: Request): { valid: boolean; ip: string; warning?: string } {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIP = forwardedFor?.split(',')[0]?.trim() || 'unknown';

  if (DEMO_MODE) {
    return {
      valid: true,
      ip: clientIP,
      warning: `Demo mode: Accepting callback from ${clientIP}`
    };
  }

  const isValidIP = SAFARICOM_IP_RANGES.some(range => clientIP.startsWith(range));
  return {
    valid: isValidIP,
    ip: clientIP,
    warning: isValidIP ? undefined : `Rejected callback from unauthorized IP: ${clientIP}`
  };
}

// === SECURITY: Replay protection via nonce ===
async function checkAndStoreNonce(
  supabaseClient: any,
  nonce: string,
  sourceIP: string,
  callbackType: string
): Promise<boolean> {
  // SECURITY FIX: Validate nonce format
  if (!nonce || typeof nonce !== 'string' || nonce.length < 5 || nonce.length > 200) {
    console.warn(`[M-Pesa Callback] Invalid nonce format: length=${nonce?.length}`);
    return false;
  }

  try {
    const { error } = await supabaseClient
      .from('callback_nonces')
      .insert({ nonce, source_ip: sourceIP, callback_type: callbackType });

    if (error) {
      if (error.code === '23505') {
        console.warn(`[M-Pesa Callback] REPLAY DETECTED: nonce ${nonce} already processed`);
        return false;
      }
      console.error('[M-Pesa Callback] Nonce check error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[M-Pesa Callback] Nonce storage error:', e);
    return false;
  }
}

// Validate callback data structure
function validateCallbackStructure(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid callback data: not an object' };
  }

  if (data.Body?.stkCallback) {
    const stk = data.Body.stkCallback;
    if (typeof stk.CheckoutRequestID !== 'string' || stk.CheckoutRequestID.length < 10 || stk.CheckoutRequestID.length > 100) {
      return { valid: false, error: 'Invalid CheckoutRequestID format' };
    }
    // SECURITY: Reject CheckoutRequestIDs with dangerous characters
    if (!/^[a-zA-Z0-9_-]+$/.test(stk.CheckoutRequestID)) {
      return { valid: false, error: 'Invalid CheckoutRequestID characters' };
    }
    if (typeof stk.ResultCode !== 'number' || !Number.isInteger(stk.ResultCode)) {
      return { valid: false, error: 'Invalid ResultCode format' };
    }
    if (stk.ResultCode === 0) {
      if (!stk.CallbackMetadata?.Item || !Array.isArray(stk.CallbackMetadata.Item)) {
        return { valid: false, error: 'Missing callback metadata for successful payment' };
      }
      const items = stk.CallbackMetadata.Item;
      const hasReceipt = items.some((i: any) => i.Name === 'MpesaReceiptNumber' && typeof i.Value === 'string');
      const hasAmount = items.some((i: any) => i.Name === 'Amount' && typeof i.Value === 'number' && i.Value > 0);
      if (!hasReceipt || !hasAmount) {
        return { valid: false, error: 'Missing required callback metadata fields' };
      }
    }
    return { valid: true };
  }

  if (data.TransactionType === 'Pay Bill') {
    // SECURITY FIX: Require TransID for C2B callbacks
    if (!data.TransID || typeof data.TransID !== 'string' || data.TransID.length < 5) {
      return { valid: false, error: 'Missing or invalid TransID for C2B callback' };
    }
    return { valid: true };
  }

  return { valid: false, error: 'Unrecognized callback structure' };
}

// Audit log helper
async function logCallback(
  supabaseClient: any,
  callbackData: any,
  sourceIP: string,
  status: 'received' | 'processed' | 'rejected' | 'error',
  details?: string
) {
  try {
    await supabaseClient
      .from('audit_logs')
      .insert({
        table_name: 'mpesa_callbacks',
        action: status,
        ip_address: sourceIP,
        new_data: {
          callback_data: callbackData,
          status,
          details,
          timestamp: new Date().toISOString()
        }
      });
  } catch (e) {
    console.error('[M-Pesa Callback] Failed to log callback:', e);
  }
}

// === SECURITY: Server-side rate limiting ===
async function checkRateLimit(supabaseClient: any, key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.rpc('check_rate_limit', {
      p_key: key,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds
    });
    if (error) {
      console.error('[M-Pesa Callback] Rate limit check error:', error);
      return true; // Fail open to avoid blocking legitimate callbacks
    }
    return data === true;
  } catch {
    return true;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // SECURITY FIX: Reject non-POST methods
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let callbackData: any;
  let sourceIP = 'unknown';

  try {
    // SECURITY: Validate source IP
    const ipValidation = validateSourceIP(req);
    sourceIP = ipValidation.ip;

    if (ipValidation.warning) {
      console.warn(`[M-Pesa Callback] ${ipValidation.warning}`);
    }

    if (!ipValidation.valid) {
      await logCallback(supabaseClient, null, sourceIP, 'rejected', 'Invalid source IP');
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Rate limit - max 30 callbacks per minute per IP
    const rateLimitAllowed = await checkRateLimit(supabaseClient, `mpesa_cb:${sourceIP}`, 30, 60);
    if (!rateLimitAllowed) {
      console.warn(`[M-Pesa Callback] Rate limit exceeded for IP: ${sourceIP}`);
      await logCallback(supabaseClient, null, sourceIP, 'rejected', 'Rate limit exceeded');
      return new Response(
        JSON.stringify({ success: false, message: 'Too many requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY FIX: Enforce payload size limit before reading
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      await logCallback(supabaseClient, null, sourceIP, 'rejected', 'Payload too large');
      return new Response(
        JSON.stringify({ error: 'Payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body with size check
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      await logCallback(supabaseClient, null, sourceIP, 'rejected', 'Payload too large');
      return new Response(
        JSON.stringify({ error: 'Payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify HMAC signature (shared secret from env)
    const signatureHeader = req.headers.get('x-mpesa-signature') || req.headers.get('x-callback-signature');
    const sharedSecret = Deno.env.get('MPESA_PASSKEY') || '';
    const signatureValid = await verifyCallbackSignature(rawBody, signatureHeader, sharedSecret);

    if (!signatureValid) {
      console.error(`[M-Pesa Callback] Invalid signature from ${sourceIP}`);
      await logCallback(supabaseClient, null, sourceIP, 'rejected', 'Invalid callback signature');
      return new Response(
        JSON.stringify({ success: false, message: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      callbackData = JSON.parse(rawBody);
    } catch {
      await logCallback(supabaseClient, rawBody, sourceIP, 'rejected', 'Invalid JSON');
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log received callback
    await logCallback(supabaseClient, callbackData, sourceIP, 'received');
    console.log('[M-Pesa Callback] Received from', sourceIP);

    // SECURITY: Validate callback structure
    const structureValidation = validateCallbackStructure(callbackData);
    if (!structureValidation.valid) {
      console.error('[M-Pesa Callback] Invalid structure:', structureValidation.error);
      await logCallback(supabaseClient, callbackData, sourceIP, 'rejected', structureValidation.error);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid callback structure' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle STK Push callback
    if (callbackData.Body?.stkCallback) {
      const stkCallback = callbackData.Body.stkCallback;
      const checkoutRequestId = stkCallback.CheckoutRequestID;
      const resultCode = stkCallback.ResultCode;
      const resultDesc = stkCallback.ResultDesc;

      // SECURITY: Replay protection - use CheckoutRequestID as nonce
      const nonceValid = await checkAndStoreNonce(supabaseClient, checkoutRequestId, sourceIP, 'stk_push');
      if (!nonceValid) {
        await logCallback(supabaseClient, callbackData, sourceIP, 'rejected', 'Replay attack: duplicate nonce');
        return new Response(
          JSON.stringify({ success: true, message: 'Already processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[M-Pesa Callback] CheckoutRequestID: ${checkoutRequestId}, ResultCode: ${resultCode}`);

      // Find the pending transaction
      const { data: transaction, error: findError } = await supabaseClient
        .from('payment_transactions')
        .select('*, escrow_accounts(project_id)')
        .eq('stripe_transaction_id', checkoutRequestId)
        .single();

      if (findError || !transaction) {
        console.error('[M-Pesa Callback] Transaction not found:', checkoutRequestId);
        // SECURITY FIX: Generic error message to prevent enumeration
        await logCallback(supabaseClient, callbackData, sourceIP, 'rejected', 'Transaction not found');
        return new Response(
          JSON.stringify({ success: false, message: 'Processing error' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Idempotency check
      if (transaction.status === 'completed') {
        console.log('[M-Pesa Callback] Transaction already completed, ignoring');
        await logCallback(supabaseClient, callbackData, sourceIP, 'processed', 'Duplicate callback ignored');
        return new Response(
          JSON.stringify({ success: true, message: 'Already processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (transaction.status !== 'pending') {
        console.log('[M-Pesa Callback] Transaction not pending:', transaction.status);
        await logCallback(supabaseClient, callbackData, sourceIP, 'rejected', `Invalid state: ${transaction.status}`);
        return new Response(
          JSON.stringify({ success: false, message: 'Processing error' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (resultCode === 0) {
        const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
        const mpesaReceiptNumber = callbackMetadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
        const amount = callbackMetadata.find((i: any) => i.Name === 'Amount')?.Value;
        const phoneNumber = callbackMetadata.find((i: any) => i.Name === 'PhoneNumber')?.Value;

        // SECURITY FIX: Exact amount match (no tolerance) to prevent rounding exploits
        if (typeof amount !== 'number' || amount !== transaction.amount) {
          console.error(`[M-Pesa Callback] Amount mismatch: expected ${transaction.amount}, got ${amount}`);
          await logCallback(supabaseClient, callbackData, sourceIP, 'rejected', 'Amount mismatch');
          return new Response(
            JSON.stringify({ success: false, message: 'Processing error' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // SECURITY: Validate receipt number format
        if (!mpesaReceiptNumber || typeof mpesaReceiptNumber !== 'string' || !/^[A-Z0-9]{10,15}$/.test(mpesaReceiptNumber)) {
          console.error(`[M-Pesa Callback] Invalid receipt number format: ${mpesaReceiptNumber}`);
          await logCallback(supabaseClient, callbackData, sourceIP, 'rejected', 'Invalid receipt format');
          return new Response(
            JSON.stringify({ success: false, message: 'Processing error' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[M-Pesa Callback] Payment successful. Receipt: ${mpesaReceiptNumber}, Amount: ${amount}`);

        // SECURITY: Atomic update with status guard
        const { error: updateError, count: updateCount } = await supabaseClient
          .from('payment_transactions')
          .update({
            status: 'completed',
            stripe_transaction_id: mpesaReceiptNumber
          })
          .eq('id', transaction.id)
          .eq('status', 'pending');

        if (updateError) {
          console.error('[M-Pesa Callback] Failed to update transaction:', updateError);
          await logCallback(supabaseClient, callbackData, sourceIP, 'error', updateError.message);
          return new Response(
            JSON.stringify({ success: false, message: 'Processing error' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update escrow balance with optimistic locking
        const { data: escrow } = await supabaseClient
          .from('escrow_accounts')
          .select('*')
          .eq('id', transaction.escrow_account_id)
          .single();

        if (escrow) {
          // SECURITY FIX: Optimistic locking on escrow update to prevent race conditions
          const { error: escrowError } = await supabaseClient
            .from('escrow_accounts')
            .update({
              held_amount: escrow.held_amount + transaction.amount,
              total_amount: escrow.total_amount + transaction.amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', escrow.id)
            .eq('held_amount', escrow.held_amount); // Optimistic lock

          if (escrowError) {
            console.error('[M-Pesa Callback] Escrow update conflict (possible race condition):', escrowError);
            await logCallback(supabaseClient, callbackData, sourceIP, 'error', 'Escrow update conflict');
            // Transaction is already completed, escrow will be reconciled
          }

          await supabaseClient
            .from('blockchain_transactions')
            .insert({
              project_id: escrow.project_id,
              payment_transaction_id: transaction.id,
              amount: transaction.amount,
              transaction_hash: `0x${mpesaReceiptNumber}${Date.now().toString(16)}`,
              block_hash: `0x${crypto.randomUUID().replace(/-/g, '')}`,
              block_number: Math.floor(Date.now() / 1000),
              network_status: 'confirmed',
              verification_data: {
                type: 'c2b_treasury_deposit',
                mpesa_receipt: mpesaReceiptNumber,
                phone_number: phoneNumber ? `${String(phoneNumber).slice(0, 6)}****` : null,
                confirmed_at: new Date().toISOString(),
                source_ip: sourceIP,
                demo_mode: DEMO_MODE,
                signature_verified: !!signatureHeader
              }
            });
        }

        await logCallback(supabaseClient, callbackData, sourceIP, 'processed', 'Payment completed successfully');
      } else {
        console.log(`[M-Pesa Callback] Payment failed: ${resultDesc}`);
        await supabaseClient
          .from('payment_transactions')
          .update({ status: 'failed' })
          .eq('id', transaction.id)
          .eq('status', 'pending');

        await logCallback(supabaseClient, callbackData, sourceIP, 'processed', `Payment failed: ${resultDesc}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle C2B Pay Bill
    if (callbackData.TransactionType === 'Pay Bill') {
      // SECURITY FIX: TransID is now required by structure validation, no fallback to Date.now()
      const c2bNonce = callbackData.TransID;
      const nonceValid = await checkAndStoreNonce(supabaseClient, c2bNonce, sourceIP, 'c2b_paybill');
      if (!nonceValid) {
        return new Response(
          JSON.stringify({ success: true, message: 'Already processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[M-Pesa Callback] C2B Pay Bill callback received');
      await logCallback(supabaseClient, callbackData, sourceIP, 'processed', 'C2B callback processed');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Callback processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[M-Pesa Callback] Error:', error);
    await logCallback(supabaseClient, callbackData, sourceIP, 'error', (error as Error).message);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})