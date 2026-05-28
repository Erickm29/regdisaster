import { useCallback, useEffect, useState } from "react"
import { fetchIncidentStats } from "../lib/incidents/queries"
import { useIncidentsRealtime } from "./useIncidentsRealtime"
import type { IncidentStats } from "../types/incidents"

export interface UseIncidentStatsResult {
  stats: IncidentStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * KPI header hook — refetches stats when any incident changes.
 */
export function useIncidentStats(enabled = true): UseIncidentStatsResult {
  const [stats, setStats] = useState<IncidentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!enabled) return
    setError(null)
    try {
      const data = await fetchIncidentStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats")
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchIncidentStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load stats")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  useIncidentsRealtime({
    enabled,
    onEvent: () => {
      void refetch()
    },
  })

  return { stats, loading, error, refetch }
}
