import type { Incident, IncidentStatus, Severity } from "../../types/incidents"

export type IncidentRealtimeEvent = "INSERT" | "UPDATE" | "DELETE"

export interface IncidentRealtimePayload {
  eventType: IncidentRealtimeEvent
  incident: Incident
  old?: Incident
}

export interface IncidentFilters {
  severity?: Severity
  status?: IncidentStatus[]
  /** Only incidents created after this time */
  since?: Date
  limit?: number
}

export interface SubscribeIncidentsOptions {
  /** Unique channel name suffix (defaults to random) */
  channelId?: string
  /** Postgres filter, e.g. severity=eq.critical */
  postgresFilter?: string
  onEvent: (payload: IncidentRealtimePayload) => void
  onStatusChange?: (status: string) => void
}
