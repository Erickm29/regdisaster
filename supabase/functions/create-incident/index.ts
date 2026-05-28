/**
 * createIncident — validate JSON body and insert into public.incidents
 * POST /functions/v1/create-incident
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { handleOptions, jsonResponse } from "../_shared/cors.ts"
import { createAdminClient } from "../_shared/supabase-admin.ts"
import { validateCreateIncident } from "../_shared/validate.ts"

export async function createIncident(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400)
  }

  const validation = validateCreateIncident(body)
  if (!validation.ok) {
    return jsonResponse({ error: "Validation failed", details: validation.errors }, 422)
  }

  const input = validation.data
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      title: input.title,
      description: input.description ?? null,
      disaster_type: input.disaster_type,
      severity: input.severity,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      source: input.source,
      status: input.status,
      image_url: input.image_url ?? null,
      ai_summary: input.ai_summary ?? null,
    })
    .select()
    .single()

  if (error) {
    return jsonResponse({ error: error.message }, 400)
  }

  return jsonResponse({ incident: data }, 201)
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    return await createIncident(req)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return jsonResponse({ error: message }, 500)
  }
})
