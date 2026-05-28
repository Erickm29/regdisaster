import { supabase } from "../supabase"
import {
  DEFAULT_INCIDENT_HOURS,
  DEFAULT_INCIDENT_LIMIT,
  DEFAULT_INCIDENT_STATUS_FILTER,
  INCIDENT_SELECT_COLUMNS,
} from "../realtime/constants"
import { hoursAgo } from "./filters"
import type { Incident, IncidentStats, IncidentStatus, Severity } from "../../types/incidents"

export interface FetchIncidentsParams {
  limit?: number
  hours?: number
  severity?: Severity
  status?: IncidentStatus[]
}

export async function fetchIncidents(
  params: FetchIncidentsParams = {},
): Promise<Incident[]> {
  const limit = params.limit ?? DEFAULT_INCIDENT_LIMIT
  const hours = params.hours ?? DEFAULT_INCIDENT_HOURS
  const status = params.status ?? [...DEFAULT_INCIDENT_STATUS_FILTER]
  const since = hoursAgo(hours).toISOString()

  let query = supabase
    .from("incidents")
    .select(INCIDENT_SELECT_COLUMNS)
    .in("status", status)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (params.severity) {
    query = query.eq("severity", params.severity)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Incident[]
}

export async function fetchIncidentStats(): Promise<IncidentStats> {
  const { data, error } = await supabase
    .from("incidents_stats")
    .select("*")
    .single()

  if (error) throw error
  return data as IncidentStats
}
