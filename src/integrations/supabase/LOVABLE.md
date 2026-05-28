# Lovable + Supabase Realtime

## 1. Environment variables

In Lovable project settings:

```
VITE_SUPABASE_URL=https://hhurrytpyuujjvrlizzi.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
```

## 2. Copy hooks into Lovable

Copy these folders into your Lovable `src/`:

- `src/hooks/`
- `src/lib/` (supabase, realtime, incidents)
- `src/types/`
- `src/integrations/supabase/`

## 3. Dashboard example

```tsx
import { useIncidents, useIncidentStats } from "@/hooks"

export function DisasterDashboard() {
  const { incidents, loading, error, isConnected } = useIncidents({
    limit: 50,
    hours: 24,
  })

  const { stats } = useIncidentStats()

  if (loading) return <p>Loading incidents…</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div>
      <p>Live: {isConnected ? "connected" : "connecting…"}</p>
      <p>Active: {stats?.active_count ?? 0} · Critical: {stats?.critical_count ?? 0}</p>
      <ul>
        {incidents.map((i) => (
          <li key={i.id}>
            [{i.severity}] {i.title} — {i.disaster_type}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## 4. Architecture

| Layer | Role |
|-------|------|
| `hooks/useIncidents` | Fetch + Realtime merge (main dashboard) |
| `hooks/useIncidentStats` | KPIs, refetch on change |
| `hooks/useIncidentsRealtime` | Low-level listener only |
| `lib/realtime/subscribe-incidents` | Channel + cleanup |
| `lib/incidents/merge-incidents` | Pure INSERT/UPDATE/DELETE reducer |
| `lib/incidents/queries` | Supabase fetch helpers |

Realtime is enabled on `public.incidents` in Supabase.
