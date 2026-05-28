import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "../supabase"
import type { Incident } from "../../types/incidents"
import type {
  IncidentRealtimeEvent,
  IncidentRealtimePayload,
  SubscribeIncidentsOptions,
} from "./types"

function toIncident(row: Record<string, unknown> | null): Incident | null {
  if (!row || typeof row.id !== "string") return null
  return row as unknown as Incident
}

function parsePayload(
  eventType: string,
  newRecord: Record<string, unknown> | null,
  oldRecord: Record<string, unknown> | null,
): IncidentRealtimePayload | null {
  const incident = toIncident(newRecord) ?? toIncident(oldRecord)
  if (!incident) return null

  return {
    eventType: eventType as IncidentRealtimeEvent,
    incident,
    old: toIncident(oldRecord) ?? undefined,
  }
}

/**
 * Subscribe to `public.incidents` postgres changes.
 * Returns cleanup — call on unmount or when deps change.
 */
export function subscribeToIncidents(
  options: SubscribeIncidentsOptions,
): () => void {
  const channelName = `incidents-${
    options.channelId ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`)
  }`

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "incidents",
        ...(options.postgresFilter
          ? { filter: options.postgresFilter }
          : {}),
      },
      (payload) => {
        const parsed = parsePayload(
          payload.eventType,
          payload.new as Record<string, unknown> | null,
          payload.old as Record<string, unknown> | null,
        )
        if (parsed) options.onEvent(parsed)
      },
    )
    .subscribe((status) => {
      options.onStatusChange?.(status)
    })

  return () => {
    void supabase.removeChannel(channel)
  }
}
