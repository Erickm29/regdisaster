/**
 * processIncidentWithAI — Gemini classification → update incident
 * POST /functions/v1/process-incident-with-ai
 * Body: { "incident_id": "uuid" }
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { handleOptions, jsonResponse } from "../_shared/cors.ts"
import { processIncidentWithAI as classifyWithGemini } from "../_shared/gemini.ts"
import { createAdminClient } from "../_shared/supabase-admin.ts"
import { validateProcessIncident } from "../_shared/validate.ts"

export async function processIncidentWithAI(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400)
  }

  const validation = validateProcessIncident(body)
  if (!validation.ok) {
    return jsonResponse({ error: "Validation failed", details: validation.errors }, 422)
  }

  const { incident_id } = validation.data
  const supabase = createAdminClient()

  const { data: incident, error: fetchError } = await supabase
    .from("incidents")
    .select("id, title, description")
    .eq("id", incident_id)
    .single()

  if (fetchError || !incident) {
    return jsonResponse({ error: "Incident not found" }, 404)
  }

  const ai = await classifyWithGemini({
    title: incident.title,
    description: incident.description,
  })

  const { data: updated, error: updateError } = await supabase
    .from("incidents")
    .update({
      disaster_type: ai.disaster_type,
      severity: ai.severity,
      ai_summary: ai.summary,
      status: "verified",
    })
    .eq("id", incident_id)
    .select()
    .single()

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 400)
  }

  return jsonResponse({
    incident: updated,
    ai: {
      disaster_type: ai.disaster_type,
      severity: ai.severity,
      summary: ai.summary,
    },
  })
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    return await processIncidentWithAI(req)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return jsonResponse({ error: message }, 500)
  }
})
