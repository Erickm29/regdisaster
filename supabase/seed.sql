-- Sample data for hackathon demo (run after migration)
-- psql or Supabase SQL Editor

INSERT INTO public.incidents (
  title, description, disaster_type, severity, latitude, longitude,
  source, ai_summary, status, image_url
) VALUES
(
  'M7.2 Earthquake — Coastal Region',
  'Strong shaking reported across multiple cities. Initial damage assessments underway.',
  'earthquake', 'critical', 35.6762, 139.6503,
  'news',
  'Major offshore earthquake detected. High casualty risk; prioritize search and rescue in coastal zones.',
  'active',
  'https://images.unsplash.com/photo-1527482791421-9bfa9bf0f731?w=800'
),
(
  'Flash Flooding — Downtown District',
  'Rivers exceeded banks after 120mm rainfall in 6 hours. Several roads impassable.',
  'flood', 'high', 29.7604, -95.3698,
  'telegram',
  'Severe urban flooding from intense rainfall. Evacuation recommended for low-lying areas.',
  'active',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800'
),
(
  'Wildfire Spreading — Pine Ridge',
  'Fire crews battling wind-driven blaze. Smoke visible 30km away.',
  'wildfire', 'high', 34.0522, -118.2437,
  'news',
  'Fast-moving wildfire with high spread potential. Air quality and evacuation alerts likely.',
  'verified',
  'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=800'
),
(
  'Category 3 Hurricane Approaching',
  'National weather service issued hurricane warning. Landfall expected in 18 hours.',
  'hurricane', 'critical', 25.7617, -80.1918,
  'api',
  'Hurricane tracking shows landfall imminent. Coastal preparedness and shelter activation required.',
  'active',
  NULL
),
(
  'Landslide Blocks Mountain Highway',
  'Debris covering both lanes. No casualties reported yet.',
  'landslide', 'medium', 27.7172, 85.3240,
  'telegram',
  'Localized landslide disrupting transport. Monitor for secondary slides after rainfall.',
  'active',
  NULL
),
(
  'Minor Tremor — No Damage',
  'M3.1 aftershock felt lightly in suburbs.',
  'earthquake', 'low', 37.7749, -122.4194,
  'telegram',
  'Low-magnitude seismic event with minimal impact. No emergency response needed.',
  'resolved',
  NULL
),
(
  'Drought Conditions Worsening',
  'Reservoir levels at 40% capacity. Water restrictions expanded.',
  'drought', 'medium', -33.8688, 151.2093,
  'news',
  'Prolonged drought affecting water supply. Agricultural and municipal restrictions expanding.',
  'verified',
  NULL
),
(
  'False Alarm — Controlled Burn',
  'Reported smoke was a permitted controlled burn, not wildfire.',
  'wildfire', 'low', 40.7128, -74.0060,
  'manual',
  'Incident reclassified: controlled agricultural burn. No wildfire threat.',
  'false_alarm',
  NULL
);
