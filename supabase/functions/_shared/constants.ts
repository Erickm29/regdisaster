export const DISASTER_TYPES = [
  "earthquake",
  "flood",
  "wildfire",
  "hurricane",
  "tornado",
  "landslide",
  "tsunami",
  "volcanic",
  "drought",
  "other",
] as const

export const SEVERITY_LEVELS = ["low", "medium", "high", "critical"] as const
export const INCIDENT_STATUSES = [
  "active",
  "verified",
  "resolved",
  "false_alarm",
] as const
export const INCIDENT_SOURCES = ["news", "telegram", "manual", "api"] as const

export type DisasterType = (typeof DISASTER_TYPES)[number]
export type Severity = (typeof SEVERITY_LEVELS)[number]
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]
export type IncidentSource = (typeof INCIDENT_SOURCES)[number]

/** Columns returned by get-realtime-incidents (minimal payload for live dashboard) */
export const REALTIME_INCIDENT_COLUMNS =
  "id,title,disaster_type,severity,latitude,longitude,source,status,ai_summary,image_url,created_at" as const
