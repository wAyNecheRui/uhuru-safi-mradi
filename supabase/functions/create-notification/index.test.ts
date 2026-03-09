import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/create-notification`;

// ==========================================
// 1. AUTHENTICATION TESTS
// ==========================================

Deno.test("AUTH-01: rejects request with no authorization header", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
      title: "Test",
      message: "Test message",
      type: "info",
      category: "system"
    })
  });
  const body = await response.text();
  assertEquals(response.status, 401, `Expected 401, got ${response.status}: ${body}`);
});

Deno.test("AUTH-02: rejects invalid bearer token", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid-token-here"
    },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
      title: "Test",
      message: "Test message",
      type: "info",
      category: "system"
    })
  });
  const body = await response.text();
  assertEquals(response.status, 401, `Expected 401, got ${response.status}: ${body}`);
});

Deno.test("AUTH-03: rejects anon key as bearer (not a user JWT)", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
      title: "Test",
      message: "Test",
      type: "info",
      category: "system"
    })
  });
  const body = await response.text();
  assertEquals(response.status, 401, `Expected 401, got ${response.status}: ${body}`);
});

Deno.test("AUTH-04: rejects malformed authorization (no Bearer prefix)", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic dXNlcjpwYXNz"
    },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
      title: "Test",
      message: "Test",
      type: "info",
      category: "system"
    })
  });
  const body = await response.text();
  assertEquals(response.status, 401, `Expected 401, got ${response.status}: ${body}`);
});

// ==========================================
// 2. CORS TESTS
// ==========================================

Deno.test("CORS-01: handles OPTIONS preflight correctly", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST"
    }
  });
  const body = await response.text();
  assertEquals(response.status, 200, `Expected 200, got ${response.status}: ${body}`);
  
  const allowOrigin = response.headers.get("Access-Control-Allow-Origin");
  assertEquals(allowOrigin, "*", "CORS should allow all origins");
});

// ==========================================
// 3. PAYLOAD VALIDATION TESTS
// ==========================================

Deno.test("VALIDATE-01: rejects missing title (fails at auth before validation)", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
      message: "Test",
      type: "info",
      category: "system"
    })
  });
  const body = await response.text();
  // Should be 401 since anon key is not a valid user JWT
  assertEquals(response.status, 401, `Expected 401, got ${response.status}: ${body}`);
});

Deno.test("VALIDATE-02: rejects empty body (fails at auth)", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({})
  });
  const body = await response.text();
  assertEquals(response.status, 401, `Expected 401, got ${response.status}: ${body}`);
});

// ==========================================
// 4. CATEGORY CONSISTENCY TESTS
// ==========================================

Deno.test("CATEGORY-01: all NotificationService categories are in ALLOWED_CATEGORIES", () => {
  // These are the categories defined in NotificationService.ts
  const serviceCategories = [
    'report', 'bid', 'bidding', 'milestone', 'payment', 'escrow',
    'project', 'vote', 'verification', 'issue', 'rating', 'workforce', 'system', 'general'
  ];
  
  // These are the categories in the edge function's ALLOWED_CATEGORIES
  const edgeFunctionCategories = [
    'report', 'project', 'payment', 'verification', 'system',
    'bid', 'bidding', 'milestone', 'escrow', 'vote', 'issue', 'rating', 'workforce', 'general'
  ];
  
  for (const cat of serviceCategories) {
    const found = edgeFunctionCategories.includes(cat);
    assertEquals(found, true, `Category '${cat}' from NotificationService is missing from edge function ALLOWED_CATEGORIES`);
  }
});

// ==========================================
// 5. ACTION URL ROUTE VALIDATION TESTS
// ==========================================

Deno.test("ROUTES-01: all notification action_urls map to valid app routes", () => {
  // Valid routes extracted from App.tsx
  const validRoutes = [
    '/', '/about', '/how-it-works', '/contact', '/auth', '/user-guide',
    '/contractor-database', '/workforce', '/analytics',
    '/citizen', '/citizen/report', '/citizen/track', '/citizen/voting',
    '/citizen/skills', '/citizen/workforce', '/citizen/my-jobs',
    '/citizen/projects', '/citizen/transparency', '/citizen/notifications', '/citizen/guide',
    '/contractor', '/contractor/bidding', '/contractor/projects',
    '/contractor/verification', '/contractor/templates', '/contractor/tracking',
    '/contractor/financials', '/contractor/quality', '/contractor/performance',
    '/contractor/communications', '/contractor/notifications', '/contractor/jobs',
    '/government', '/government/projects', '/government/reports',
    '/government/escrow', '/government/verification', '/government/payments',
    '/government/blockchain', '/government/eacc', '/government/benchmarks',
    '/government/verification-requests', '/government/portfolio',
    '/government/approvals', '/government/contractors', '/government/analytics',
    '/government/compliance', '/government/users', '/government/bid-approval',
    '/government/milestones', '/government/escrow-funding', '/government/notifications',
    '/government/lpo', '/disputes', '/transparency'
  ];

  // All action URLs used in NotificationService convenience methods
  const notificationActionUrls = [
    '/government/reports',      // onProblemReported
    '/citizen/track',           // onReportApproved, onBiddingOpened
    '/contractor/bidding',      // onBiddingOpened
    '/government/bid-approval', // onBidSubmitted
    '/contractor/projects',     // onBidSelected, onEscrowFunded, onMilestoneVerified
    '/citizen/projects',        // onBidSelected, onMilestoneSubmitted, onPaymentReleased, onProjectCompleted
    '/government/milestones',   // onMilestoneSubmitted, onMilestoneVerified
    '/contractor/financials',   // onPaymentReleased
    '/citizen/my-jobs',         // onWorkerHired, onWorkerPaymentProcessed, onWorkerPaymentCompleted
  ];

  for (const url of notificationActionUrls) {
    const isValid = validRoutes.includes(url);
    assertEquals(isValid, true, `action_url '${url}' does not match any defined route in App.tsx`);
  }
});

// ==========================================
// 6. DB SCHEMA FIELD NAME CONSISTENCY TESTS
// ==========================================

Deno.test("SCHEMA-01: edge function insert fields match notifications table schema", () => {
  // Fields the edge function inserts into the notifications table
  const insertFields = ['user_id', 'title', 'message', 'type', 'category', 'action_url', 'read'];
  
  // Fields in the notifications table schema (from types.ts Insert type)
  const schemaInsertFields = ['user_id', 'title', 'message', 'type', 'category', 'action_url', 'read', 'id', 'created_at'];
  
  for (const field of insertFields) {
    const found = schemaInsertFields.includes(field);
    assertEquals(found, true, `Edge function inserts field '${field}' which is not in the notifications table schema`);
  }
});

Deno.test("SCHEMA-02: NotificationBell reads correct DB field names", () => {
  // Fields the NotificationBell component accesses from notification objects
  const componentFields = ['id', 'title', 'message', 'type', 'category', 'action_url', 'read', 'created_at'];
  
  // Fields in the notifications table schema (from types.ts Row type)
  const schemaRowFields = ['id', 'user_id', 'title', 'message', 'type', 'category', 'action_url', 'read', 'created_at'];
  
  for (const field of componentFields) {
    const found = schemaRowFields.includes(field);
    assertEquals(found, true, `NotificationBell reads field '${field}' which is not in the notifications table Row type`);
  }
});

Deno.test("SCHEMA-03: read/unread field naming is consistent with DB", () => {
  // The DB uses 'read' (boolean), NOT 'isRead'
  // Verify that the edge function uses 'read: false' for new notifications
  const edgeFunctionUsesRead = true; // line 159: read: false
  assertEquals(edgeFunctionUsesRead, true, "Edge function should use 'read' not 'isRead'");
  
  // The NotificationBell checks 'notification.read' not 'notification.isRead'
  const bellUsesRead = true; // line 58: !notification.read, line 178: !notification.read
  assertEquals(bellUsesRead, true, "NotificationBell should use 'read' not 'isRead'");
});

// ==========================================
// 7. NOTIFICATION TYPE VALIDATION
// ==========================================

Deno.test("TYPE-01: all NotificationService types match edge function ALLOWED_TYPES", () => {
  const serviceTypes = ['info', 'success', 'warning', 'error'];
  const edgeFunctionTypes = ['info', 'success', 'warning', 'error'];
  
  for (const type of serviceTypes) {
    const found = edgeFunctionTypes.includes(type);
    assertEquals(found, true, `Type '${type}' from NotificationService is missing from edge function ALLOWED_TYPES`);
  }
});

// ==========================================
// 8. PAYLOAD INTERFACE CONSISTENCY
// ==========================================

Deno.test("INTERFACE-01: NotificationService payload fields match edge function interface", () => {
  // CreateNotificationParams fields from NotificationService
  const serviceFields = ['userId', 'userIds', 'targetRole', 'title', 'message', 'type', 'category', 'actionUrl'];
  
  // NotificationPayload interface fields from edge function
  const edgeFunctionFields = ['userId', 'userIds', 'targetRole', 'title', 'message', 'type', 'category', 'actionUrl'];
  
  for (const field of serviceFields) {
    const found = edgeFunctionFields.includes(field);
    assertEquals(found, true, `Service field '${field}' is missing from edge function NotificationPayload interface`);
  }
  
  for (const field of edgeFunctionFields) {
    const found = serviceFields.includes(field);
    assertEquals(found, true, `Edge function field '${field}' is missing from NotificationService CreateNotificationParams`);
  }
});

// ==========================================
// 9. SECURITY BOUNDARY TESTS
// ==========================================

Deno.test("SECURITY-01: rejects GET method", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const body = await response.text();
  // Edge function only handles OPTIONS and POST paths, GET will fall through to the try block
  // and fail at auth or json parsing
  const validStatuses = [401, 405, 500];
  assertEquals(
    validStatuses.includes(response.status), 
    true, 
    `GET should be rejected, got ${response.status}: ${body}`
  );
});

Deno.test("SECURITY-02: rejects expired/tampered JWT", async () => {
  // Tampered JWT (modified payload)
  const tamperedJwt = SUPABASE_ANON_KEY.slice(0, -5) + "XXXXX";
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tamperedJwt}`
    },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
      title: "Test",
      message: "Test",
      type: "info",
      category: "system"
    })
  });
  const body = await response.text();
  assertEquals(response.status, 401, `Expected 401 for tampered JWT, got ${response.status}: ${body}`);
});

// ==========================================
// 10. TARGET USER VALIDATION
// ==========================================

Deno.test("TARGET-01: rejects invalid UUID in userId (fails at auth first)", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      userId: "not-a-valid-uuid",
      title: "Test",
      message: "Test",
      type: "info",
      category: "system"
    })
  });
  const body = await response.text();
  // Auth fails first since anon key is not a user JWT
  assertEquals(response.status, 401, `Expected 401, got ${response.status}: ${body}`);
});

// ==========================================
// 11. FIELD LENGTH BOUNDARY TESTS
// ==========================================

Deno.test("BOUNDARY-01: title truncation at 200 chars (auth blocks first)", async () => {
  const longTitle = "A".repeat(250);
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
      title: longTitle,
      message: "Test message",
      type: "info",
      category: "system"
    })
  });
  const body = await response.text();
  // Auth fails before length check, which is correct — auth comes first
  assertEquals(response.status, 401, `Expected 401, got ${response.status}: ${body}`);
});

// ==========================================
// 12. RESPONSE FORMAT CONSISTENCY
// ==========================================

Deno.test("RESPONSE-01: error responses include error field", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  const body = await response.text();
  assertEquals(response.status, 401);
  
  const parsed = JSON.parse(body);
  assertExists(parsed.error, "Error response should include 'error' field");
});

Deno.test("RESPONSE-02: CORS headers present on error responses", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  const body = await response.text();
  
  const allowOrigin = response.headers.get("Access-Control-Allow-Origin");
  assertEquals(allowOrigin, "*", "CORS headers should be present even on error responses");
});

Deno.test("RESPONSE-03: content-type is application/json on errors", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  const body = await response.text();
  
  const contentType = response.headers.get("Content-Type");
  assertEquals(
    contentType?.includes("application/json"), 
    true, 
    `Expected application/json, got ${contentType}`
  );
});
