import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FUNCTIONS = {
  submitReport: `${SUPABASE_URL}/functions/v1/submit-report`,
  submitBid: `${SUPABASE_URL}/functions/v1/submit-bid`,
  createEscrow: `${SUPABASE_URL}/functions/v1/create-escrow-account`,
  releaseMilestone: `${SUPABASE_URL}/functions/v1/release-milestone-payment`,
  createNotification: `${SUPABASE_URL}/functions/v1/create-notification`,
  mpesaCallback: `${SUPABASE_URL}/functions/v1/mpesa-callback`,
};

async function post(url: string, body: string | object, token?: string): Promise<{ status: number; text: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text };
}

// ================================================================
// MALFORMED JSON — Every function must return 400, never 500
// ================================================================

const MALFORMED_JSONS = [
  { name: "truncated object", body: '{"title": "test' },
  { name: "trailing comma", body: '{"title": "test",}' },
  { name: "single quotes", body: "{'title': 'test'}" },
  { name: "bare string", body: "just a string" },
  { name: "empty string", body: "" },
  { name: "null literal", body: "null" },
  { name: "number literal", body: "42" },
  { name: "array literal", body: "[1,2,3]" },
  { name: "binary garbage", body: "\x00\x01\x02\x03\xff\xfe" },
  { name: "nested broken", body: '{"a":{"b":{"c":' },
  { name: "unicode bomb", body: '{"title": "\uD800"}' },  // lone surrogate
  { name: "backslash flood", body: '{"t": "' + '\\'.repeat(1000) + '"}' },
];

const FUZZ_TARGETS = [
  { name: "submit-report", url: FUNCTIONS.submitReport },
  { name: "submit-bid", url: FUNCTIONS.submitBid },
  { name: "create-escrow", url: FUNCTIONS.createEscrow },
  { name: "release-milestone", url: FUNCTIONS.releaseMilestone },
  { name: "create-notification", url: FUNCTIONS.createNotification },
];

for (const target of FUZZ_TARGETS) {
  for (const malformed of MALFORMED_JSONS) {
    Deno.test(`FUZZ-JSON [${target.name}]: ${malformed.name} → no 500`, async () => {
      const { status } = await post(target.url, malformed.body, "fake-token");
      assertNotEquals(status, 500, `${target.name} returned 500 on malformed JSON: ${malformed.name}`);
      // Should be 400 (invalid JSON) or 401 (auth checked first)
      assertEquals(
        [400, 401, 413].includes(status), true,
        `Expected 400/401/413, got ${status} for ${target.name} with ${malformed.name}`
      );
    });
  }
}

// ================================================================
// EXTREME VALUES — numeric overflow, huge strings, deep nesting
// ================================================================

Deno.test("FUZZ-EXTREME [submit-report]: Number.MAX_SAFE_INTEGER as estimatedCost", async () => {
  const { status } = await post(FUNCTIONS.submitReport, {
    title: "Test report with extreme cost",
    description: "This is a sufficiently long description for validation purposes to pass the minimum check.",
    category: "water",
    priority: "high",
    estimatedCost: Number.MAX_SAFE_INTEGER,
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-EXTREME [submit-report]: NaN as estimatedCost", async () => {
  const { status } = await post(FUNCTIONS.submitReport, {
    title: "Test report with NaN cost",
    description: "This is a sufficiently long description for validation purposes to pass the minimum check.",
    estimatedCost: "NaN",
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-EXTREME [submit-report]: Infinity as estimatedCost", async () => {
  // JSON.stringify converts Infinity to null, so we send the string
  const { status } = await post(FUNCTIONS.submitReport, '{"title":"Test","description":"Long enough description for the validation check","estimatedCost":"Infinity"}', "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-EXTREME [submit-bid]: bidAmount = 0", async () => {
  const { status } = await post(FUNCTIONS.submitBid, {
    reportId: "00000000-0000-0000-0000-000000000000",
    bidAmount: 0,
    proposal: "This is a valid proposal text for the bid submission test to pass minimum length.",
    estimatedDuration: 30,
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-EXTREME [submit-bid]: bidAmount = -1", async () => {
  const { status } = await post(FUNCTIONS.submitBid, {
    reportId: "00000000-0000-0000-0000-000000000000",
    bidAmount: -1,
    proposal: "This is a valid proposal text for the bid submission test to pass minimum length.",
    estimatedDuration: 30,
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-EXTREME [submit-bid]: estimatedDuration = 999999", async () => {
  const { status } = await post(FUNCTIONS.submitBid, {
    reportId: "00000000-0000-0000-0000-000000000000",
    bidAmount: 1000,
    proposal: "This is a valid proposal text for the bid submission test to pass minimum length.",
    estimatedDuration: 999999,
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-EXTREME [submit-bid]: estimatedDuration = 0.5 (non-integer)", async () => {
  const { status } = await post(FUNCTIONS.submitBid, {
    reportId: "00000000-0000-0000-0000-000000000000",
    bidAmount: 1000,
    proposal: "This is a valid proposal text for the bid submission test to pass minimum length.",
    estimatedDuration: 0.5,
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-EXTREME [create-escrow]: total_amount = 1e15 (above cap)", async () => {
  const { status } = await post(FUNCTIONS.createEscrow, {
    project_id: "00000000-0000-0000-0000-000000000000",
    total_amount: 1e15,
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-EXTREME [create-escrow]: total_amount = Number.MIN_VALUE", async () => {
  const { status } = await post(FUNCTIONS.createEscrow, {
    project_id: "00000000-0000-0000-0000-000000000000",
    total_amount: Number.MIN_VALUE,
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-EXTREME [release-milestone]: milestoneId = empty string", async () => {
  const { status } = await post(FUNCTIONS.releaseMilestone, { milestoneId: "" }, "fake-token");
  assertNotEquals(status, 500);
});

// ================================================================
// NULL NESTING & TYPE CONFUSION
// ================================================================

Deno.test("FUZZ-NULL [submit-report]: all fields null", async () => {
  const { status } = await post(FUNCTIONS.submitReport, {
    title: null,
    description: null,
    category: null,
    priority: null,
    location: null,
    coordinates: null,
    estimatedCost: null,
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-NULL [submit-report]: nested null objects", async () => {
  const { status } = await post(FUNCTIONS.submitReport, {
    title: { nested: { deep: null } },
    description: [null, null, null],
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-TYPE [submit-report]: title as number", async () => {
  const { status } = await post(FUNCTIONS.submitReport, {
    title: 12345,
    description: "This is a sufficiently long description for validation purposes to pass the minimum check.",
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-TYPE [submit-report]: title as boolean", async () => {
  const { status } = await post(FUNCTIONS.submitReport, {
    title: true,
    description: false,
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-TYPE [submit-report]: title as array", async () => {
  const { status } = await post(FUNCTIONS.submitReport, {
    title: ["a", "b", "c"],
    description: { key: "value" },
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-TYPE [submit-bid]: reportId as number", async () => {
  const { status } = await post(FUNCTIONS.submitBid, {
    reportId: 12345,
    bidAmount: "not a number",
    proposal: 42,
    estimatedDuration: "thirty",
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-TYPE [submit-bid]: all fields as arrays", async () => {
  const { status } = await post(FUNCTIONS.submitBid, {
    reportId: [1, 2, 3],
    bidAmount: [1000],
    proposal: ["a", "b"],
    estimatedDuration: [30],
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-TYPE [create-escrow]: project_id as number", async () => {
  const { status } = await post(FUNCTIONS.createEscrow, {
    project_id: 12345,
    total_amount: "one million",
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-TYPE [create-escrow]: milestones as string instead of array", async () => {
  const { status } = await post(FUNCTIONS.createEscrow, {
    project_id: "00000000-0000-0000-0000-000000000000",
    total_amount: 1000,
    milestones: "not an array",
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-TYPE [release-milestone]: milestoneId as object", async () => {
  const { status } = await post(FUNCTIONS.releaseMilestone, {
    milestoneId: { id: "00000000-0000-0000-0000-000000000000" },
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-TYPE [release-milestone]: milestoneId as array", async () => {
  const { status } = await post(FUNCTIONS.releaseMilestone, {
    milestoneId: ["00000000-0000-0000-0000-000000000000"],
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-NULL [create-notification]: all fields null", async () => {
  const { status } = await post(FUNCTIONS.createNotification, {
    title: null,
    message: null,
    type: null,
    category: null,
    userId: null,
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-TYPE [create-notification]: title as object", async () => {
  const { status } = await post(FUNCTIONS.createNotification, {
    title: { xss: "<script>alert(1)</script>" },
    message: 42,
    type: [],
    category: true,
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-TYPE [create-notification]: payload is array", async () => {
  const { status } = await post(FUNCTIONS.createNotification, [
    { title: "a", message: "b", type: "info", category: "system" }
  ], "fake-token");
  assertNotEquals(status, 500);
});

// ================================================================
// DEEP NESTING — potential stack overflow / OOM
// ================================================================

Deno.test("FUZZ-DEPTH [submit-report]: 100-level nested object", async () => {
  let obj: any = { value: "bottom" };
  for (let i = 0; i < 100; i++) {
    obj = { nested: obj };
  }
  const { status } = await post(FUNCTIONS.submitReport, { title: obj, description: obj }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-DEPTH [create-escrow]: deeply nested milestones", async () => {
  let obj: any = { title: "m" };
  for (let i = 0; i < 50; i++) {
    obj = { inner: obj };
  }
  const { status } = await post(FUNCTIONS.createEscrow, {
    project_id: "00000000-0000-0000-0000-000000000000",
    total_amount: 1000,
    milestones: [obj, obj, obj],
  }, "fake-token");
  assertNotEquals(status, 500);
});

// ================================================================
// PROTOTYPE POLLUTION ATTEMPTS
// ================================================================

Deno.test("FUZZ-PROTO [submit-report]: __proto__ pollution attempt", async () => {
  const { status } = await post(FUNCTIONS.submitReport, {
    title: "Valid title for testing",
    description: "This is a sufficiently long description for validation purposes to pass the minimum check.",
    "__proto__": { "isAdmin": true },
    "constructor": { "prototype": { "isAdmin": true } },
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-PROTO [create-escrow]: __proto__ in milestones", async () => {
  const { status } = await post(FUNCTIONS.createEscrow, {
    project_id: "00000000-0000-0000-0000-000000000000",
    total_amount: 1000,
    milestones: [{ "__proto__": { "isAdmin": true }, title: "m1", payment_percentage: 100 }],
  }, "fake-token");
  assertNotEquals(status, 500);
});

// ================================================================
// SPECIAL CHARACTERS & ENCODING ATTACKS
// ================================================================

Deno.test("FUZZ-ENCODING [submit-report]: unicode control characters", async () => {
  const { status } = await post(FUNCTIONS.submitReport, {
    title: "Test \u0000\u0001\u0002\u001F\u007F\u200B\u200C\u200D\uFEFF report title",
    description: "Description with zero-width \u200B\u200C\u200D joiners and BOM \uFEFF characters everywhere in the text.",
    category: "water",
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-ENCODING [submit-report]: RTL override characters", async () => {
  const { status } = await post(FUNCTIONS.submitReport, {
    title: "Normal \u202E\u202Dtext\u202C with RTL override",
    description: "This description contains \u202E right-to-left override \u202C that could cause display issues in the text.",
    category: "roads",
  }, "fake-token");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-ENCODING [submit-bid]: emoji-heavy proposal", async () => {
  const { status } = await post(FUNCTIONS.submitBid, {
    reportId: "00000000-0000-0000-0000-000000000000",
    bidAmount: 1000,
    proposal: "🔥".repeat(100) + " This is our proposal with lots of emojis 🚀🎉💰",
    estimatedDuration: 30,
  }, "fake-token");
  assertNotEquals(status, 500);
});

// ================================================================
// MPESA CALLBACK FUZZING
// ================================================================

Deno.test("FUZZ-MPESA: completely empty body", async () => {
  const { status } = await post(FUNCTIONS.mpesaCallback, "");
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-MPESA: valid structure but absurd ResultCode", async () => {
  const { status } = await post(FUNCTIONS.mpesaCallback, {
    Body: {
      stkCallback: {
        CheckoutRequestID: "ws_CO_FUZZ_" + Date.now(),
        ResultCode: 999999999,
        ResultDesc: "Fuzzing",
      },
    },
  });
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-MPESA: CheckoutRequestID with SQL injection", async () => {
  const { status } = await post(FUNCTIONS.mpesaCallback, {
    Body: {
      stkCallback: {
        CheckoutRequestID: "'; DROP TABLE payment_transactions; --",
        ResultCode: 0,
        ResultDesc: "Success",
        CallbackMetadata: {
          Item: [
            { Name: "MpesaReceiptNumber", Value: "FUZZ123456" },
            { Name: "Amount", Value: 100 },
          ],
        },
      },
    },
  });
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-MPESA: negative Amount in callback", async () => {
  const { status } = await post(FUNCTIONS.mpesaCallback, {
    Body: {
      stkCallback: {
        CheckoutRequestID: "ws_CO_FUZZ_NEG_" + Date.now(),
        ResultCode: 0,
        ResultDesc: "Success",
        CallbackMetadata: {
          Item: [
            { Name: "MpesaReceiptNumber", Value: "FUZZ123457" },
            { Name: "Amount", Value: -500 },
          ],
        },
      },
    },
  });
  assertNotEquals(status, 500);
});

Deno.test("FUZZ-MPESA: C2B with null TransID", async () => {
  const { status } = await post(FUNCTIONS.mpesaCallback, {
    TransactionType: "Pay Bill",
    TransID: null,
    TransAmount: "1000",
    BusinessShortCode: "174379",
    BillRefNumber: "test",
  });
  assertNotEquals(status, 500);
});

// ================================================================
// EMPTY OBJECTS & MISSING REQUIRED FIELDS
// ================================================================

for (const target of FUZZ_TARGETS) {
  Deno.test(`FUZZ-EMPTY [${target.name}]: empty object → no 500`, async () => {
    const { status } = await post(target.url, {}, "fake-token");
    assertNotEquals(status, 500, `${target.name} returned 500 on empty object`);
  });
}

// ================================================================
// CROSS-CUTTING: Ensure no internal error leaks
// ================================================================

Deno.test("FUZZ-LEAK: submit-report error response has no stack trace", async () => {
  const { status, text } = await post(FUNCTIONS.submitReport, {
    title: null, description: null,
  }, "fake-token");
  assertEquals(text.includes("at "), false, "Response should not contain stack traces");
  assertEquals(text.includes("index.ts"), false, "Response should not contain file paths");
});

Deno.test("FUZZ-LEAK: create-escrow error response has no Postgres details", async () => {
  const { text } = await post(FUNCTIONS.createEscrow, {
    project_id: "not-a-uuid", total_amount: -1,
  }, "fake-token");
  assertEquals(text.includes("Postgres"), false);
  assertEquals(text.includes("relation"), false);
  assertEquals(text.includes("column"), false);
});

Deno.test("FUZZ-LEAK: release-milestone error response has no internals", async () => {
  const { status, text } = await post(FUNCTIONS.releaseMilestone, {
    milestoneId: "'; DROP TABLE projects; --",
  }, "fake-token");
  // Cloudflare WAF may block this request (403 with HTML) — that's acceptable security behavior.
  // We only check the JSON body for leaks if the function itself handled the request.
  if (status === 403 && text.includes("Cloudflare")) {
    // WAF blocked — acceptable, no leak from our function
    return;
  }
  let body: any;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  const bodyStr = JSON.stringify(body).toLowerCase();
  assertEquals(bodyStr.includes("postgres"), false, "Body should not contain Postgres refs");
  assertEquals(bodyStr.includes("stack"), false, "Body should not contain stack traces");
});
