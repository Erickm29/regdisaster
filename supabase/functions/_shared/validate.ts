import {
  DISASTER_TYPES,
  INCIDENT_SOURCES,
  INCIDENT_STATUSES,
  SEVERITY_LEVELS,
  type DisasterType,
  type IncidentSource,
  type IncidentStatus,
  type Severity,
} from "./constants.ts"

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] }

export interface CreateIncidentInput {
  title: string
  description?: string
  disaster_type?: DisasterType
  severity?: Severity
  latitude?: number
  longitude?: number
  source: IncidentSource
  status?: IncidentStatus
  image_url?: string
  ai_summary?: string
}

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
}

function isValidCoord(lat?: number, lng?: number): boolean {
  if (lat === undefined && lng === undefined) return true
  if (lat === undefined || lng === undefined) return false
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

export function validateCreateIncident(
  body: unknown,
): ValidationResult<CreateIncidentInput> {
  const errors: string[] = []

  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Body must be a JSON object"] }
  }

  const raw = body as Record<string, unknown>

  if (typeof raw.title !== "string" || raw.title.trim().length === 0) {
    errors.push("title is required (non-empty string)")
  }
  if (typeof raw.source !== "string" || !isOneOf(raw.source, INCIDENT_SOURCES)) {
    errors.push(`source is required (${INCIDENT_SOURCES.join(" | ")})`)
  }
  if (raw.disaster_type !== undefined && !isOneOf(raw.disaster_type, DISASTER_TYPES)) {
    errors.push(`invalid disaster_type`)
  }
  if (raw.severity !== undefined && !isOneOf(raw.severity, SEVERITY_LEVELS)) {
    errors.push(`invalid severity`)
  }
  if (raw.status !== undefined && !isOneOf(raw.status, INCIDENT_STATUSES)) {
    errors.push(`invalid status`)
  }
  if (raw.description !== undefined && typeof raw.description !== "string") {
    errors.push("description must be a string")
  }
  if (raw.image_url !== undefined && typeof raw.image_url !== "string") {
    errors.push("image_url must be a string")
  }
  if (raw.ai_summary !== undefined && typeof raw.ai_summary !== "string") {
    errors.push("ai_summary must be a string")
  }

  const lat = raw.latitude !== undefined ? Number(raw.latitude) : undefined
  const lng = raw.longitude !== undefined ? Number(raw.longitude) : undefined
  if (raw.latitude !== undefined && Number.isNaN(lat!)) {
    errors.push("latitude must be a number")
  }
  if (raw.longitude !== undefined && Number.isNaN(lng!)) {
    errors.push("longitude must be a number")
  }
  if (!isValidCoord(lat, lng)) {
    errors.push("latitude and longitude must both be set or both omitted")
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    data: {
      title: (raw.title as string).trim(),
      description: raw.description as string | undefined,
      source: raw.source as IncidentSource,
      disaster_type: (raw.disaster_type as DisasterType) ?? "other",
      severity: (raw.severity as Severity) ?? "medium",
      status: (raw.status as IncidentStatus) ?? "active",
      latitude: lat,
      longitude: lng,
      image_url: raw.image_url as string | undefined,
      ai_summary: raw.ai_summary as string | undefined,
    },
  }
}

export interface ProcessIncidentInput {
  incident_id: string
}

export function validateProcessIncident(
  body: unknown,
): ValidationResult<ProcessIncidentInput> {
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Body must be a JSON object"] }
  }
  const raw = body as Record<string, unknown>
  if (typeof raw.incident_id !== "string" || raw.incident_id.trim().length === 0) {
    return { ok: false, errors: ["incident_id is required (uuid string)"] }
  }
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRe.test(raw.incident_id.trim())) {
    return { ok: false, errors: ["incident_id must be a valid UUID"] }
  }
  return { ok: true, data: { incident_id: raw.incident_id.trim() } }
}

export interface RealtimeQueryParams {
  limit: number
  hours: number
  severity?: Severity
  status: IncidentStatus[]
}

export function parseRealtimeQuery(url: URL): ValidationResult<RealtimeQueryParams> {
  const errors: string[] = []
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50),
  )
  const hours = Math.min(
    168,
    Math.max(1, parseInt(url.searchParams.get("hours") ?? "24", 10) || 24),
  )

  const severityParam = url.searchParams.get("severity")
  let severity: Severity | undefined
  if (severityParam) {
    if (!isOneOf(severityParam, SEVERITY_LEVELS)) {
      errors.push("invalid severity filter")
    } else {
      severity = severityParam
    }
  }

  const statusParam = url.searchParams.get("status")
  let status: IncidentStatus[] = ["active", "verified"]
  if (statusParam) {
    const parts = statusParam.split(",").map((s) => s.trim())
    if (!parts.every((p) => isOneOf(p, INCIDENT_STATUSES))) {
      errors.push("invalid status filter")
    } else {
      status = parts as IncidentStatus[]
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, data: { limit, hours, severity, status } }
}
