import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { applyRealtimeEvent } from "../lib/incidents/merge-incidents"
import { fetchIncidents, type FetchIncidentsParams } from "../lib/incidents/queries"
import { hoursAgo, sortIncidentsByCreatedDesc } from "../lib/incidents/filters"
import { subscribeToIncidents } from "../lib/realtime/subscribe-incidents"
import {
  DEFAULT_INCIDENT_HOURS,
  DEFAULT_INCIDENT_LIMIT,
  DEFAULT_INCIDENT_STATUS_FILTER,
} from "../lib/realtime/constants"
import type { IncidentFilters } from "../lib/realtime/types"
import type { Incident, IncidentStatus, Severity } from "../types/incidents"

export interface UseIncidentsOptions {
  limit?: number
  hours?: number
  severity?: Severity
  status?: IncidentStatus[]
  enabled?: boolean
}

export interface UseIncidentsResult {
  incidents: Incident[]
  loading: boolean
  error: string | null
  isConnected: boolean
  refetch: () => Promise<void>
}

/**
 * Dashboard hook for Lovable:
 * 1. Initial fetch from Supabase
 * 2. Realtime subscription auto-updates the list (INSERT / UPDATE / DELETE)
 * 3. Cleanup on unmount
 *
 * @example
 * const { incidents, loading, error } = useIncidents({ limit: 50, hours: 24 })
 */
export function useIncidents(options: UseIncidentsOptions = {}): UseIncidentsResult {
  const {
    limit = DEFAULT_INCIDENT_LIMIT,
    hours = DEFAULT_INCIDENT_HOURS,
    severity,
    status = [...DEFAULT_INCIDENT_STATUS_FILTER],
    enabled = true,
  } = options

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const filters = useMemo<IncidentFilters>(
    () => ({
      severity,
      status,
      since: hoursAgo(hours),
      limit,
    }),
    [severity, status, hours, limit],
  )

  const fetchParams = useMemo<FetchIncidentsParams>(
    () => ({ limit, hours, severity, status }),
    [limit, hours, severity, status],
  )

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const refetch = useCallback(async () => {
    setError(null)
    try {
      const data = await fetchIncidents(fetchParams)
      setIncidents(sortIncidentsByCreatedDesc(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents")
    }
  }, [fetchParams])

  // Initial load
  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchIncidents(fetchParams)
      .then((data) => {
        if (!cancelled) {
          setIncidents(sortIncidentsByCreatedDesc(data))
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load incidents")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, fetchParams])

  // Realtime auto-refresh
  useEffect(() => {
    if (!enabled) return

    const cleanup = subscribeToIncidents({
      channelId: "dashboard",
      postgresFilter: severity ? `severity=eq.${severity}` : undefined,
      onEvent: (payload) => {
        setIncidents((current) =>
          applyRealtimeEvent(current, payload, filtersRef.current),
        )
      },
      onStatusChange: (status) => {
        setIsConnected(status === "SUBSCRIBED")
      },
    })

    return cleanup
  }, [enabled, severity])

  return { incidents, loading, error, isConnected, refetch }
}
