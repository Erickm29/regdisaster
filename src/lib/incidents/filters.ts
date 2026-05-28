import type { Incident, IncidentStatus, Severity } from "../../types/incidents"
import type { IncidentFilters } from "../realtime/types"

export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000)
}

export function incidentMatchesFilters(
  incident: Incident,
  filters: IncidentFilters,
): boolean {
  if (filters.severity && incident.severity !== filters.severity) {
    return false
  }
  if (
    filters.status?.length &&
    !filters.status.includes(incident.status as IncidentStatus)
  ) {
    return false
  }
  if (filters.since && new Date(incident.created_at) < filters.since) {
    return false
  }
  return true
}

export function sortIncidentsByCreatedDesc(incidents: Incident[]): Incident[] {
  return [...incidents].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

export function capIncidents(
  incidents: Incident[],
  limit?: number,
): Incident[] {
  if (!limit || incidents.length <= limit) return incidents
  return incidents.slice(0, limit)
}
