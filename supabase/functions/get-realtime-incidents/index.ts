/**
 * getRealtimeIncidents — optimized snapshot for dashboard + realtime bootstrap
 * GET /functions/v1/get-realtime-incidents?limit=50&hours=24&severity=critical
 *
 * Returns minimal columns for fast map/feed loads before client subscribes to Realtime.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { handleOptions, jsonResponse } from "../_shared/cors.ts"
import { REALTIME_INCIDENT_COLUMNS } from "../_shared/constants.ts"
import { createAdminClient } from "../_shared/supabase-admin.ts"
import { parseRealtimeQuery } from "../_shared/validate.ts"

export async function getRealtimeIncidents(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed. Use GET." }, 405)
  }

  const url = new URL(req.url)
  const validation = parseRealtimeQuery(url)
  if (!validation.ok) {
    return jsonResponse({ error: "Invalid query params", details: validation.errors }, 422)
  }

  const { limit, hours, severity, status } = validation.data
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const supabase = createAdminClient()

  let query = supabase
    .from("incidents")
    .select(REALTIME_INCIDENT_COLUMNS)
    .in("status", status)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (severity) {
    query = query.eq("severity", severity)
  }

  const { data, error } = await query

  if (error) {
    return jsonResponse({ error: error.message }, 400)
  }

  return jsonResponse({
    incidents: data ?? [],
    meta: {
      count: data?.length ?? 0,
      limit,
      hours,
      status,
      severity: severity ?? null,
      since,
      realtime_channel: "incidents",
      realtime_table: "public.incidents",
    },
  })
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    return await getRealtimeIncidents(req)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return jsonResponse({ error: message }, 500)
  }
})
