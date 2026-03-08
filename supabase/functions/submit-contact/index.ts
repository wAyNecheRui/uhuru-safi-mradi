import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, user_type, subject, message } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "All required fields must be filled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate field lengths
    if (name.length > 200 || email.length > 255 || subject.length > 500 || message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Field length exceeds maximum allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
