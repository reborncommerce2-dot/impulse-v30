import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization") || "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "No autenticado" }, 401);

    const { message, context, history } = await req.json();
    if (!message || typeof message !== "string") return json({ error: "Mensaje requerido" }, 400);

    const system = `Sos Impulso, una asistente personal de crecimiento. Tu tarea es conversar con naturalidad, recordar el contexto que se te entrega, hacer preguntas cuando falta información y convertir problemas en acciones concretas. No inventes datos del usuario. Usá los registros como evidencia. Si aparece un tema de salud mental de riesgo, priorizá seguridad y recomendá apoyo humano/profesional. Contexto actual del usuario: ${JSON.stringify(context || {})}`;
    const input = [
      { role: "system", content: system },
      ...(Array.isArray(history) ? history.slice(-12).flatMap((h: any) => [
        { role: "user", content: String(h.q || "") },
        { role: "assistant", content: String(h.ans || "") },
      ]) : []),
      { role: "user", content: message },
    ];

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL");
    if (!apiKey || !model) return json({ error: "Falta configurar OPENAI_API_KEY u OPENAI_MODEL" }, 500);

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input }),
    });
    const j = await r.json();
    if (!r.ok) return json({ error: j?.error?.message || "Error del proveedor IA" }, 502);
    const answer = j.output_text || j.output?.flatMap((x: any) => x.content || []).map((x: any) => x.text || "").join("\n") || "No pude generar una respuesta.";
    return json({ answer });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
