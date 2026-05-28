-- Disaster Monitoring Platform — MVP schema
-- Applied to project RegDisaster via Supabase MCP

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  disaster_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  latitude double precision,
  longitude double precision,
  source text NOT NULL,
  ai_summary text,
  status text NOT NULL DEFAULT 'active',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT incidents_disaster_type_check CHECK (
    disaster_type IN (
      'earthquake', 'flood', 'wildfire', 'hurricane', 'tornado',
      'landslide', 'tsunami', 'volcanic', 'drought', 'other'
    )
  ),
  CONSTRAINT incidents_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),
  CONSTRAINT incidents_status_check CHECK (
    status IN ('active', 'verified', 'resolved', 'false_alarm')
  ),
  CONSTRAINT incidents_source_check CHECK (
    source IN ('news', 'telegram', 'manual', 'api')
  ),
  CONSTRAINT incidents_coords_check CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude IS NOT NULL AND longitude IS NOT NULL
        AND latitude BETWEEN -90 AND 90
        AND longitude BETWEEN -180 AND 180)
  )
);

COMMENT ON TABLE public.incidents IS 'Disaster reports from news, Telegram, and AI enrichment';

CREATE INDEX idx_incidents_created_at_desc ON public.incidents (created_at DESC);
CREATE INDEX idx_incidents_disaster_type ON public.incidents (disaster_type);
CREATE INDEX idx_incidents_severity ON public.incidents (severity);
CREATE INDEX idx_incidents_status ON public.incidents (status);
CREATE INDEX idx_incidents_source ON public.incidents (source);
CREATE INDEX idx_incidents_dashboard ON public.incidents (status, severity, created_at DESC)
  WHERE status IN ('active', 'verified');

ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incidents_public_select"
  ON public.incidents FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "incidents_public_insert"
  ON public.incidents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "incidents_public_update"
  ON public.incidents FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "incidents_public_delete"
  ON public.incidents FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE VIEW public.incidents_active
WITH (security_invoker = true)
AS
  SELECT *
  FROM public.incidents
  WHERE status IN ('active', 'verified')
  ORDER BY created_at DESC;

CREATE OR REPLACE VIEW public.incidents_stats
WITH (security_invoker = true)
AS
  SELECT
    count(*)::bigint AS total,
    count(*) FILTER (WHERE status IN ('active', 'verified'))::bigint AS active_count,
    count(*) FILTER (WHERE severity = 'critical')::bigint AS critical_count,
    count(*) FILTER (WHERE source = 'telegram')::bigint AS telegram_count,
    count(*) FILTER (WHERE source = 'news')::bigint AS news_count,
    max(created_at) AS latest_incident_at
  FROM public.incidents;

CREATE OR REPLACE FUNCTION public.incidents_nearby(
  lat double precision,
  lng double precision,
  radius_km double precision DEFAULT 50
)
RETURNS SETOF public.incidents
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT i.*
  FROM public.incidents i
  WHERE i.latitude IS NOT NULL
    AND i.longitude IS NOT NULL
    AND (
      6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(lat)) * cos(radians(i.latitude))
          * cos(radians(i.longitude) - radians(lng))
          + sin(radians(lat)) * sin(radians(i.latitude))
        ))
      )
    ) <= radius_km
  ORDER BY i.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.incidents_recent(hours integer DEFAULT 24)
RETURNS SETOF public.incidents
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT *
  FROM public.incidents
  WHERE created_at >= now() - (hours || ' hours')::interval
  ORDER BY created_at DESC;
$$;

GRANT SELECT ON public.incidents_active TO anon, authenticated;
GRANT SELECT ON public.incidents_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.incidents_nearby(double precision, double precision, double precision) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.incidents_recent(integer) TO anon, authenticated;
