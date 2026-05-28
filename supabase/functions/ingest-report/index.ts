/**
 * Edge Function skeleton: ingest raw report → AI classify → insert incident
 * Deploy: supabase functions deploy ingest-report
 *
 * Body: { title, description, source, latitude?, longitude?, image_url? }
 */
import { createAdminClient } from "../_shared/supabase-admin.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const supabase = createAdminClient()

    // TODO: call OpenAI / your classifier here
    const ai = {
      disaster_type: body.disaster_type ?? "other",
      severity: body.severity ?? "medium",
      ai_summary: body.ai_summary ?? `Summary: ${body.description?.slice(0, 200) ?? ""}`,
    }

    const { data, error } = await supabase
      .from("incidents")
      .insert({
        title: body.title,
        description: body.description,
        source: body.source ?? "api",
        latitude: body.latitude,
        longitude: body.longitude,
        image_url: body.image_url,
        disaster_type: ai.disaster_type,
        severity: ai.severity,
        ai_summary: ai.ai_summary,
        status: "active",
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ incident: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
