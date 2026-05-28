import type { Database } from "./database"

export type Incident = Database["public"]["Tables"]["incidents"]["Row"]
export type IncidentInsert = Database["public"]["Tables"]["incidents"]["Insert"]
export type IncidentUpdate = Database["public"]["Tables"]["incidents"]["Update"]
export type IncidentStats = Database["public"]["Views"]["incidents_stats"]["Row"]

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
export const INCIDENT_STATUSES = ["active", "verified", "resolved", "false_alarm"] as const
export const INCIDENT_SOURCES = ["news", "telegram", "manual", "api"] as const

export type DisasterType = (typeof DISASTER_TYPES)[number]
export type Severity = (typeof SEVERITY_LEVELS)[number]
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]
export type IncidentSource = (typeof INCIDENT_SOURCES)[number]
