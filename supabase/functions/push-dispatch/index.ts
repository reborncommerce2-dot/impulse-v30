import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-dispatch-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const secret = req.headers.get("x-dispatch-secret") || "";
  if (!secret || secret !== Deno.env.get("PUSH_DISPATCH_SECRET")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SECRET_KEY")!);
  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com",
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!
  );

  const now = new Date().toISOString();
  const { data: reminders, error } = await supabase
    .from("scheduled_reminders")
    .select("id,user_id,title,due_at")
    .eq("completed", false)
    .eq("sent", false)
    .lte("due_at", now)
    .limit(100);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });

  let sent = 0;
  for (const r of reminders || []) {
    const { data: subs } = await supabase.from("push_subscriptions").select("id,subscription").eq("user_id", r.user_id);
    for (const sub of subs || []) {
      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify({ title: "Impulso", body: r.title, data: { reminderId: r.id } }), { TTL: 3600, urgency: "high" });
        sent++;
      } catch (e) {
        const msg = String(e);
        if (msg.includes("410") || msg.includes("404")) await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
    await supabase.from("scheduled_reminders").update({ sent: true, sent_at: new Date().toISOString() }).eq("id", r.id);
  }
  return new Response(JSON.stringify({ ok: true, processed: reminders?.length || 0, sent }), { headers: { ...cors, "Content-Type": "application/json" } });
});
