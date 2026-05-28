import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { Incident } from "../types/incidents"

export type IncidentRealtimeEvent = "INSERT" | "UPDATE" | "DELETE"

export type IncidentChangeHandler = (payload: {
  eventType: IncidentRealtimeEvent
  incident: Incident
  old?: Incident
}) => void

/**
 * Subscribe to live incident changes for the Lovable dashboard.
 * Call the returned unsubscribe function on component unmount.
 */
export function subscribeToIncidents(
  onChange: IncidentChangeHandler,
  filter?: { severity?: string; status?: string }
): () => void {
  const channel: RealtimeChannel = supabase
    .channel("incidents-live")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "incidents",
        ...(filter?.severity
          ? { filter: `severity=eq.${filter.severity}` }
          : {}),
      },
      (payload) => {
        onChange({
          eventType: payload.eventType as IncidentRealtimeEvent,
          incident: payload.new as Incident,
          old: payload.old as Incident | undefined,
        })
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

/** Example: React hook usage */
export function useIncidentsRealtime(onChange: IncidentChangeHandler) {
  // In React:
  // useEffect(() => subscribeToIncidents(onChange), [onChange])
  return subscribeToIncidents(onChange)
}
