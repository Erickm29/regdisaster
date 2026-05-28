import type { Incident } from "../../types/incidents"
import {
  capIncidents,
  incidentMatchesFilters,
  sortIncidentsByCreatedDesc,
} from "./filters"
import type { IncidentFilters, IncidentRealtimePayload } from "../realtime/types"

/**
 * Pure reducer: apply a Realtime event to the current incidents list.
 * Used by hooks to auto-refresh the dashboard without refetching.
 */
export function applyRealtimeEvent(
  incidents: Incident[],
  payload: IncidentRealtimePayload,
  filters: IncidentFilters,
): Incident[] {
  const { eventType, incident, old } = payload

  if (eventType === "DELETE") {
    const id = old?.id ?? incident?.id
    if (!id) return incidents
    return incidents.filter((row) => row.id !== id)
  }

  if (!incident?.id) return incidents

  if (eventType === "INSERT") {
    if (!incidentMatchesFilters(incident, filters)) return incidents
    if (incidents.some((row) => row.id === incident.id)) return incidents
    return capIncidents(
      sortIncidentsByCreatedDesc([incident, ...incidents]),
      filters.limit,
    )
  }

  // UPDATE
  const without = incidents.filter((row) => row.id !== incident.id)
  if (!incidentMatchesFilters(incident, filters)) {
    return without
  }
  return capIncidents(
    sortIncidentsByCreatedDesc([incident, ...without]),
    filters.limit,
  )
}
