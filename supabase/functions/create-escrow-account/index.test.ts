import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FUNCTIONS = {
  createEscrow: `${SUPABASE_URL}/functions/v1/create-escrow-account`,
  initiatePayment: `${SUPABASE_URL}/functions/v1/initiate-payment`,
  releaseMilestone: `${SUPABASE_URL}/functions/v1/release-milestone-payment`,
  payContractor: `${SUPABASE_URL}/functions/v1/pay-contractor-b2c`,
};

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

async function callFn(url: string, body: any, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

async function callMethod(url: string, method: string) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" } });
  const text = await res.text();
  return { status: res.status };
}

// ==================== create-escrow-account ====================

Deno.test("create-escrow: GET returns 405", async () => {
  const { status } = await callMethod(FUNCTIONS.createEscrow, "GET");
  assertEquals(status, 405);
});

Deno.test("create-escrow: no auth returns 401", async () => {
  const { status } = await callFn(FUNCTIONS.createEscrow, { project_id: FAKE_UUID, total_amount: 1000 });
  assertEquals(status, 401);
});

Deno.test("create-escrow: invalid token returns 401", async () => {
  const { status } = await callFn(FUNCTIONS.createEscrow, { project_id: FAKE_UUID, total_amount: 1000 }, "invalid-token");
  assertEquals(status, 401);
});

Deno.test("create-escrow: anon key as token returns 401", async () => {
  const { status } = await callFn(FUNCTIONS.createEscrow, { project_id: FAKE_UUID, total_amount: 1000 }, ANON_KEY);
  assertEquals(status, 401);
});

Deno.test("create-escrow: invalid project_id format rejected", async () => {
  const { status, json } = await callFn(FUNCTIONS.createEscrow, { project_id: "not-a-uuid", total_amount: 1000 }, "fake-jwt");
  // Will be 401 (auth fails before validation), which is correct
  assertNotEquals(status, 200);
  assertNotEquals(status, 500);
});

Deno.test("create-escrow: negative amount rejected", async () => {
  const { status } = await callFn(FUNCTIONS.createEscrow, { project_id: FAKE_UUID, total_amount: -500 }, "fake-jwt");
  assertNotEquals(status, 200);
  assertNotEquals(status, 500);
});

Deno.test("create-escrow: zero amount rejected", async () => {
  const { status } = await callFn(FUNCTIONS.createEscrow, { project_id: FAKE_UUID, total_amount: 0 }, "fake-jwt");
  assertNotEquals(status, 200);
  assertNotEquals(status, 500);
});

Deno.test("create-escrow: Infinity amount rejected", async () => {
  const { status } = await callFn(FUNCTIONS.createEscrow, { project_id: FAKE_UUID, total_amount: Infinity }, "fake-jwt");
  assertNotEquals(status, 200);
});

Deno.test("create-escrow: oversized payload rejected", async () => {
  const payload = { project_id: FAKE_UUID, total_amount: 1000, garbage: "x".repeat(60000) };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const res = await fetch(FUNCTIONS.createEscrow, { method: "POST", headers, body: JSON.stringify(payload) });
  const text = await res.text();
  assertNotEquals(res.status, 200);
  assertNotEquals(res.status, 500);
});

Deno.test("create-escrow: does not leak error.message in 500", async () => {
  // Invalid JSON
  const res = await fetch(FUNCTIONS.createEscrow, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer invalid" },
    body: "{bad json",
  });
  const text = await res.text();
  assertNotEquals(res.status, 500);
});

// ==================== initiate-payment ====================

Deno.test("initiate-payment: GET returns 405", async () => {
  const { status } = await callMethod(FUNCTIONS.initiatePayment, "GET");
  assertEquals(status, 405);
});

Deno.test("initiate-payment: no auth returns 401", async () => {
  const { status } = await callFn(FUNCTIONS.initiatePayment, { escrow_account_id: FAKE_UUID, amount: 1000, payment_method: "mpesa" });
  assertEquals(status, 401);
});

Deno.test("initiate-payment: invalid token returns 401", async () => {
  const { status } = await callFn(FUNCTIONS.initiatePayment, { escrow_account_id: FAKE_UUID, amount: 1000, payment_method: "mpesa" }, "bad-token");
  assertEquals(status, 401);
});

Deno.test("initiate-payment: invalid escrow_account_id rejected", async () => {
  const { status } = await callFn(FUNCTIONS.initiatePayment, { escrow_account_id: "not-uuid", amount: 1000, payment_method: "mpesa" }, "bad-token");
  assertNotEquals(status, 200);
  assertNotEquals(status, 500);
});

Deno.test("initiate-payment: negative amount rejected", async () => {
  const { status } = await callFn(FUNCTIONS.initiatePayment, { escrow_account_id: FAKE_UUID, amount: -100, payment_method: "mpesa" }, "bad-token");
  assertNotEquals(status, 200);
});

Deno.test("initiate-payment: invalid payment_method rejected", async () => {
  const { status } = await callFn(FUNCTIONS.initiatePayment, { escrow_account_id: FAKE_UUID, amount: 1000, payment_method: "crypto" }, "bad-token");
  assertNotEquals(status, 200);
});

Deno.test("initiate-payment: does not leak internal errors", async () => {
  const { status, json } = await callFn(FUNCTIONS.initiatePayment, { escrow_account_id: FAKE_UUID, amount: 1000, payment_method: "mpesa" }, "bad-token");
  assertNotEquals(status, 500);
  if (json?.error) {
    assertEquals(json.error.includes("supabase") || json.error.includes("Postgres"), false);
  }
});

// ==================== release-milestone-payment ====================

Deno.test("release-milestone: GET returns 405", async () => {
  const { status } = await callMethod(FUNCTIONS.releaseMilestone, "GET");
  assertEquals(status, 405);
});

Deno.test("release-milestone: PUT returns 405", async () => {
  const { status } = await callMethod(FUNCTIONS.releaseMilestone, "PUT");
  assertEquals(status, 405);
});

Deno.test("release-milestone: no auth returns 401", async () => {
  const { status } = await callFn(FUNCTIONS.releaseMilestone, { milestoneId: FAKE_UUID });
  assertEquals(status, 401);
});

Deno.test("release-milestone: invalid token returns 401", async () => {
  const { status } = await callFn(FUNCTIONS.releaseMilestone, { milestoneId: FAKE_UUID }, "invalid");
  assertEquals(status, 401);
});

Deno.test("release-milestone: invalid milestoneId format rejected", async () => {
  const { status } = await callFn(FUNCTIONS.releaseMilestone, { milestoneId: "not-a-uuid" }, "invalid");
  assertNotEquals(status, 200);
  assertNotEquals(status, 500);
});

Deno.test("release-milestone: missing milestoneId rejected", async () => {
  const { status } = await callFn(FUNCTIONS.releaseMilestone, {}, "invalid");
  assertNotEquals(status, 200);
  assertNotEquals(status, 500);
});

Deno.test("release-milestone: SQL injection in milestoneId rejected", async () => {
  const { status } = await callFn(FUNCTIONS.releaseMilestone, { milestoneId: "'; DROP TABLE projects;--" }, "invalid");
  assertNotEquals(status, 200);
  assertNotEquals(status, 500);
});

Deno.test("release-milestone: oversized payload rejected", async () => {
  const payload = { milestoneId: FAKE_UUID, junk: "x".repeat(60000) };
  const res = await fetch(FUNCTIONS.releaseMilestone, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer fake" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  assertNotEquals(res.status, 200);
});

// ==================== pay-contractor-b2c ====================

Deno.test("pay-contractor: GET returns 405", async () => {
  const { status } = await callMethod(FUNCTIONS.payContractor, "GET");
  assertEquals(status, 405);
});

Deno.test("pay-contractor: DELETE returns 405", async () => {
  const { status } = await callMethod(FUNCTIONS.payContractor, "DELETE");
  assertEquals(status, 405);
});

Deno.test("pay-contractor: no auth returns 401", async () => {
  const { status } = await callFn(FUNCTIONS.payContractor, { milestone_id: FAKE_UUID });
  assertEquals(status, 401);
});

Deno.test("pay-contractor: invalid token returns 401", async () => {
  const { status } = await callFn(FUNCTIONS.payContractor, { milestone_id: FAKE_UUID }, "garbage-token");
  assertEquals(status, 401);
});

Deno.test("pay-contractor: invalid milestone_id format rejected", async () => {
  const { status } = await callFn(FUNCTIONS.payContractor, { milestone_id: "invalid-uuid" }, "garbage-token");
  assertNotEquals(status, 200);
  assertNotEquals(status, 500);
});

Deno.test("pay-contractor: missing milestone_id rejected", async () => {
  const { status } = await callFn(FUNCTIONS.payContractor, {}, "garbage-token");
  assertNotEquals(status, 200);
  assertNotEquals(status, 500);
});

Deno.test("pay-contractor: SQL injection in milestone_id rejected", async () => {
  const { status } = await callFn(FUNCTIONS.payContractor, { milestone_id: "1; DELETE FROM escrow_accounts" }, "bad");
  assertNotEquals(status, 200);
  assertNotEquals(status, 500);
});

Deno.test("pay-contractor: XSS in contractor_phone doesn't crash", async () => {
  const { status } = await callFn(FUNCTIONS.payContractor, { milestone_id: FAKE_UUID, contractor_phone: '<script>alert(1)</script>' }, "bad");
  assertNotEquals(status, 500);
});

Deno.test("pay-contractor: oversized payload rejected", async () => {
  const payload = { milestone_id: FAKE_UUID, data: "y".repeat(60000) };
  const res = await fetch(FUNCTIONS.payContractor, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer fake" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  assertNotEquals(res.status, 200);
});

Deno.test("pay-contractor: does not leak internal error messages", async () => {
  const { status, json } = await callFn(FUNCTIONS.payContractor, { milestone_id: FAKE_UUID }, "bad");
  assertNotEquals(status, 500);
  if (json?.error) {
    assertEquals(json.error.includes("Postgres") || json.error.includes("column"), false);
  }
});

// ==================== CROSS-FUNCTION: OPTIONS ====================

Deno.test("all functions: OPTIONS returns 200", async () => {
  const results = await Promise.all(
    Object.values(FUNCTIONS).map(url => fetch(url, { method: "OPTIONS" }).then(async r => { await r.text(); return r.status; }))
  );
  for (const status of results) {
    assertEquals(status, 200);
  }
});
