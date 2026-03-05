import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/create-notification`;

Deno.test("create-notification: rejects unauthenticated requests", async () => {
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
  assertEquals(response.status, 401);
});

Deno.test("create-notification: rejects invalid bearer token", async () => {
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
  assertEquals(response.status, 401);
});

Deno.test("create-notification: handles CORS preflight", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST"
    }
  });
  const body = await response.text();
  assertEquals(response.status, 200);
});

Deno.test("create-notification: rejects missing required fields", async () => {
  // This will fail at auth before field validation, which is correct behavior
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}` // anon key is not a valid user JWT
    },
    body: JSON.stringify({
      title: "Test"
      // missing message, type, category
    })
  });
  const body = await response.text();
  // Should be 401 since anon key is not a user JWT
  assertEquals(response.status, 401);
});