import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("Privilege escalation: cannot INSERT user_profile with government user_type", async () => {
  // Attempt to insert a profile with user_type='government' using anon key
  // This should fail because the INSERT policy restricts user_type to 'citizen'
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      user_id: "00000000-0000-0000-0000-000000000000",
      full_name: "Attacker",
      user_type: "government",
    }),
  });
  const body = await res.text();
  // Should be rejected (401 unauthenticated or 403 RLS violation)
  assertNotEquals(res.status, 201, "INSERT with government user_type should be blocked");
});

Deno.test("Rate limits table: direct client access denied", async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rate_limits?select=*&limit=1`, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const body = await res.text();
  // Should return empty or error due to RLS deny-all
  const data = JSON.parse(body);
  assertEquals(Array.isArray(data) ? data.length : -1, 0, "rate_limits should return no rows");
});

Deno.test("Callback nonces table: direct client access denied", async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/callback_nonces?select=*&limit=1`, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const body = await res.text();
  const data = JSON.parse(body);
  assertEquals(Array.isArray(data) ? data.length : -1, 0, "callback_nonces should return no rows");
});

Deno.test("Contractor profiles: anon cannot read KRA PIN", async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/contractor_profiles?select=kra_pin&limit=1`, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const body = await res.text();
  const data = JSON.parse(body);
  // Should return empty array - no access without being owner or government
  assertEquals(Array.isArray(data) ? data.length : -1, 0, "contractor_profiles should not expose KRA PIN to anon");
});
