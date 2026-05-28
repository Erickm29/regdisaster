import { useEffect, useRef } from "react"
import { subscribeToIncidents } from "../lib/realtime/subscribe-incidents"
import type { IncidentRealtimePayload } from "../lib/realtime/types"
import type { Severity } from "../types/incidents"

export interface UseIncidentsRealtimeOptions {
  enabled?: boolean
  severity?: Severity
  onEvent: (payload: IncidentRealtimePayload) => void
}

/**
 * Low-level hook: listen to incidents table changes only.
 * Prefer `useIncidents` for a full dashboard list with auto-refresh.
 */
export function useIncidentsRealtime({
  enabled = true,
  severity,
  onEvent,
}: UseIncidentsRealtimeOptions): void {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!enabled) return

    const cleanup = subscribeToIncidents({
      postgresFilter: severity ? `severity=eq.${severity}` : undefined,
      onEvent: (payload) => onEventRef.current(payload),
    })

    return cleanup
  }, [enabled, severity])
}
