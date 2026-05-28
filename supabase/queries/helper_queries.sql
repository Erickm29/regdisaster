-- Helper queries for dashboard, ingest pipelines, and demos

-- 1. Active incidents (map + feed)
SELECT * FROM public.incidents_active LIMIT 50;

-- 2. Dashboard KPIs
SELECT * FROM public.incidents_stats;

-- 3. Critical incidents in last 24h
SELECT *
FROM public.incidents
WHERE severity = 'critical'
  AND created_at >= now() - interval '24 hours'
ORDER BY created_at DESC;

-- 4. Incidents by source (ingest monitoring)
SELECT source, count(*) AS count, max(created_at) AS latest
FROM public.incidents
GROUP BY source
ORDER BY count DESC;

-- 5. Recent incidents (RPC)
SELECT * FROM public.incidents_recent(48);

-- 6. Nearby incidents — Tokyo example (RPC)
SELECT * FROM public.incidents_nearby(35.6762, 139.6503, 100);

-- 7. Insert from news/Telegram ingest (minimal)
INSERT INTO public.incidents (title, description, disaster_type, severity, latitude, longitude, source, ai_summary)
VALUES (
  'Report title',
  'Raw report text',
  'flood',
  'high',
  40.0,
  -74.0,
  'telegram',
  'AI-generated summary goes here'
)
RETURNING *;

-- 8. Update after AI classification
UPDATE public.incidents
SET
  disaster_type = 'earthquake',
  severity = 'critical',
  ai_summary = 'Updated AI summary',
  status = 'verified'
WHERE id = '00000000-0000-0000-0000-000000000000'
RETURNING *;
