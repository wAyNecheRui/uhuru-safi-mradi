import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

// All edge function endpoints categorized by access pattern
const BROWSER_FUNCTIONS: Record<string, string> = {
  "submit-report": `${SUPABASE_URL}/functions/v1/submit-report`,
  "submit-bid": `${SUPABASE_URL}/functions/v1/submit-bid`,
  "create-escrow-account": `${SUPABASE_URL}/functions/v1/create-escrow-account`,
  "release-milestone-payment": `${SUPABASE_URL}/functions/v1/release-milestone-payment`,
  "create-notification": `${SUPABASE_URL}/functions/v1/create-notification`,
  "initiate-payment": `${SUPABASE_URL}/functions/v1/initiate-payment`,
  "vote-report": `${SUPABASE_URL}/functions/v1/vote-report`,
  "verify-kra-pin": `${SUPABASE_URL}/functions/v1/verify-kra-pin`,
  "submit-contact": `${SUPABASE_URL}/functions/v1/submit-contact`,
  "fund-escrow-c2b": `${SUPABASE_URL}/functions/v1/fund-escrow-c2b`,
  "pay-contractor-b2c": `${SUPABASE_URL}/functions/v1/pay-contractor-b2c`,
  "pay-worker-from-escrow": `${SUPABASE_URL}/functions/v1/pay-worker-from-escrow`,
  "auto-release-milestone-payment": `${SUPABASE_URL}/functions/v1/auto-release-milestone-payment`,
  "secure-submit-report": `${SUPABASE_URL}/functions/v1/secure-submit-report`,
};

const SERVER_ONLY_FUNCTIONS: Record<string, string> = {
  "mpesa-callback": `${SUPABASE_URL}/functions/v1/mpesa-callback`,
};

const ALL_FUNCTIONS = { ...BROWSER_FUNCTIONS, ...SERVER_ONLY_FUNCTIONS };

// ================================================================
// 1. OPTIONS PREFLIGHT — all functions must respond properly
// ================================================================

for (const [name, url] of Object.entries(ALL_FUNCTIONS)) {
  Deno.test(`CORS-PREFLIGHT [${name}]: OPTIONS returns 200`, async () => {
    const res = await fetch(url, { method: "OPTIONS" });
    await res.text();
    assertEquals(res.status, 200, `${name} OPTIONS should return 200`);
  });
}

// ================================================================
// 2. CORS HEADERS ON PREFLIGHT — browser-facing functions
// ================================================================

for (const [name, url] of Object.entries(BROWSER_FUNCTIONS)) {
  Deno.test(`CORS-HEADERS [${name}]: preflight has Allow-Origin`, async () => {
    const res = await fetch(url, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://example.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization, content-type, apikey",
      },
    });
    await res.text();
    const allowOrigin = res.headers.get("access-control-allow-origin");
    assertNotEquals(allowOrigin, null, `${name} missing Access-Control-Allow-Origin`);
  });

  Deno.test(`CORS-HEADERS [${name}]: preflight allows required headers`, async () => {
    const res = await fetch(url, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://example.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization, content-type, apikey",
      },
    });
    await res.text();
    const allowHeaders = res.headers.get("access-control-allow-headers")?.toLowerCase() || "";
    assertEquals(allowHeaders.includes("authorization"), true, `${name} must allow 'authorization' header`);
    assertEquals(allowHeaders.includes("content-type"), true, `${name} must allow 'content-type' header`);
    assertEquals(allowHeaders.includes("apikey"), true, `${name} must allow 'apikey' header`);
  });
}

// ================================================================
// 3. CORS HEADERS ON ERROR RESPONSES — critical for browser error handling
// ================================================================

for (const [name, url] of Object.entries(BROWSER_FUNCTIONS)) {
  Deno.test(`CORS-ERROR [${name}]: error response includes CORS headers`, async () => {
    // Send unauthenticated POST — should get 401 but WITH CORS headers
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://example.com",
      },
      body: JSON.stringify({}),
    });
    await res.text();
    const allowOrigin = res.headers.get("access-control-allow-origin");
    assertNotEquals(allowOrigin, null, `${name} error response missing Access-Control-Allow-Origin — browser cannot read error details`);
  });
}

// ================================================================
// 4. CROSS-ORIGIN WITH AUTH TOKEN — simulate real browser call
// ================================================================

Deno.test("CORS-AUTH: submit-report with Origin + valid-format auth returns CORS headers", async () => {
  const res = await fetch(BROWSER_FUNCTIONS["submit-report"], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://my-app.lovable.app",
      "Authorization": `Bearer ${ANON_KEY}`,
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({
      title: "CORS test report title here",
      description: "This is a CORS test description that meets minimum length requirements for validation.",
      category: "water",
      priority: "medium",
    }),
  });
  await res.text();
  // Will be 401 (anon key not a user JWT), but CORS headers must be present
  const allowOrigin = res.headers.get("access-control-allow-origin");
  assertNotEquals(allowOrigin, null, "Auth error response must include CORS headers");
});

Deno.test("CORS-AUTH: submit-bid with Origin + auth returns CORS headers", async () => {
  const res = await fetch(BROWSER_FUNCTIONS["submit-bid"], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://my-app.lovable.app",
      "Authorization": "Bearer fake-user-jwt",
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({
      reportId: "00000000-0000-0000-0000-000000000000",
      bidAmount: 50000,
      proposal: "This is a test bid proposal that meets the minimum character requirements for validation.",
      estimatedDuration: 30,
    }),
  });
  await res.text();
  assertNotEquals(res.headers.get("access-control-allow-origin"), null);
});

// ================================================================
// 5. SECURITY RESPONSE HEADERS — should be present on all responses
// ================================================================

for (const [name, url] of Object.entries(BROWSER_FUNCTIONS)) {
  Deno.test(`SECURITY-HEADERS [${name}]: X-Content-Type-Options present`, async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    await res.text();
    const xcto = res.headers.get("x-content-type-options");
    assertEquals(xcto, "nosniff", `${name} should set X-Content-Type-Options: nosniff`);
  });
}

// ================================================================
// 6. MPESA CALLBACK — should NOT have wildcard CORS in production
// ================================================================

Deno.test("CORS-MPESA: mpesa-callback still responds to OPTIONS (for health checks)", async () => {
  const res = await fetch(SERVER_ONLY_FUNCTIONS["mpesa-callback"], { method: "OPTIONS" });
  await res.text();
  assertEquals(res.status, 200);
});

Deno.test("CORS-MPESA: mpesa-callback POST without Safaricom IP is rejected", async () => {
  const res = await fetch(SERVER_ONLY_FUNCTIONS["mpesa-callback"], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Body: { stkCallback: { CheckoutRequestID: "test123test", ResultCode: 1, ResultDesc: "Failed" } } }),
  });
  await res.text();
  // Should be 403 (IP rejected) or 400 (structure validation)
  assertNotEquals(res.status, 200, "mpesa-callback should not accept requests from non-Safaricom IPs in production");
});

// ================================================================
// 7. CROSS-ORIGIN METHOD RESTRICTION — only POST should work
// ================================================================

const METHODS_TO_REJECT = ["GET", "PUT", "DELETE", "PATCH"];

for (const method of METHODS_TO_REJECT) {
  Deno.test(`CORS-METHOD: submit-report rejects ${method}`, async () => {
    const res = await fetch(BROWSER_FUNCTIONS["submit-report"], {
      method,
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://example.com",
      },
    });
    await res.text();
    assertNotEquals(res.status, 200, `${method} should not return 200`);
    // CORS headers should still be present for browser error handling
    assertNotEquals(
      res.headers.get("access-control-allow-origin"), null,
      `${method} error response should still have CORS headers`
    );
  });
}

// ================================================================
// 8. WILDCARD ORIGIN CHECK — verify current state for audit record
// ================================================================

Deno.test("CORS-AUDIT: document wildcard origin usage across functions", async () => {
  const wildcardFunctions: string[] = [];
  const restrictedFunctions: string[] = [];

  for (const [name, url] of Object.entries(ALL_FUNCTIONS)) {
    const res = await fetch(url, {
      method: "OPTIONS",
      headers: { "Origin": "https://evil-site.com" },
    });
    await res.text();
    const origin = res.headers.get("access-control-allow-origin");
    if (origin === "*") {
      wildcardFunctions.push(name);
    } else {
      restrictedFunctions.push(name);
    }
  }

  console.log(`\n=== CORS ORIGIN AUDIT ===`);
  console.log(`Wildcard (*) origin: ${wildcardFunctions.length} functions`);
  wildcardFunctions.forEach(f => console.log(`  ⚠️  ${f}`));
  console.log(`Restricted origin: ${restrictedFunctions.length} functions`);
  restrictedFunctions.forEach(f => console.log(`  ✅ ${f}`));
  console.log(`========================\n`);

  // This test always passes — it's an audit log
  assertEquals(true, true);
});

// ================================================================
// 9. SUPABASE CLIENT HEADERS — verify x-supabase-client-* headers are allowed
// ================================================================

Deno.test("CORS-SUPABASE: preflight with x-supabase-client-* headers succeeds", async () => {
  const res = await fetch(BROWSER_FUNCTIONS["create-notification"], {
    method: "OPTIONS",
    headers: {
      "Origin": "https://my-app.lovable.app",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization, content-type, apikey, x-supabase-client-platform, x-supabase-client-runtime",
    },
  });
  await res.text();
  assertEquals(res.status, 200);
  const allowHeaders = res.headers.get("access-control-allow-headers")?.toLowerCase() || "";
  assertEquals(
    allowHeaders.includes("x-supabase-client-platform"), true,
    "create-notification should allow x-supabase-client-platform header"
  );
});
