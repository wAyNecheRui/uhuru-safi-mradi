import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

// SECURITY: Strict input schema (Phase 7 hardening)
const ContactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  user_type: z.string().trim().max(50).optional().nullable(),
  subject: z.string().trim().min(1).max(500),
  message: z.string().trim().min(1).max(5000),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store",
};

const MAX_BODY_SIZE = 51200; // 50KB

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // SECURITY: Body size validation before parsing
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return new Response(
        JSON.stringify({ error: "Payload too large" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validated = ContactSchema.safeParse(parsed);
    if (!validated.success) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validated.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { name, email, user_type, subject, message } = validated.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store the contact message
    const { data: contactMsg, error: insertError } = await supabase
      .from("contact_messages")
      .insert({
        name: name.trim(),
        email: email.trim(),
        user_type: user_type?.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Notify all government users
    const { data: govUsers } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("user_type", "government");

    if (govUsers && govUsers.length > 0) {
      const notifications = govUsers.map((u: { user_id: string }) => ({
        user_id: u.user_id,
        title: `New Contact Message: ${subject.trim().substring(0, 50)}`,
        message: `${name.trim()} (${email.trim()}) sent a message: "${message.trim().substring(0, 100)}..."`,
        type: "info",
        category: "system",
        action_url: "/government/reports",
      }));

      await supabase.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({ success: true, id: contactMsg.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
