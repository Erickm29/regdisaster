const baseUrl = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey!,
    "Content-Type": "application/json",
  }
}

export async function createIncident(body: {
  title: string
  source: "news" | "telegram" | "manual" | "api"
  description?: string
  disaster_type?: string
  severity?: string
  latitude?: number
  longitude?: number
  image_url?: string
}) {
  const res = await fetch(`${baseUrl}/functions/v1/create-incident`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function processIncidentWithAI(incident_id: string) {
  const res = await fetch(`${baseUrl}/functions/v1/process-incident-with-ai`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ incident_id }),
  })
  return res.json()
}

export async function getRealtimeIncidents(params?: {
  limit?: number
  hours?: number
  severity?: string
  status?: string
}) {
  const q = new URLSearchParams()
  if (params?.limit) q.set("limit", String(params.limit))
  if (params?.hours) q.set("hours", String(params.hours))
  if (params?.severity) q.set("severity", params.severity)
  if (params?.status) q.set("status", params.status)

  const res = await fetch(
    `${baseUrl}/functions/v1/get-realtime-incidents?${q}`,
    { headers: headers() },
  )
  return res.json()
}
