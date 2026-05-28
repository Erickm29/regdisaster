# Edge Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `create-incident` | POST | Validate + insert incident |
| `process-incident-with-ai` | POST | Gemini classify + update |
| `get-realtime-incidents` | GET | Optimized dashboard snapshot |

## Secrets (Dashboard → Edge Functions → Secrets)

```
GEMINI_API_KEY=your_google_ai_key
GEMINI_MODEL=gemini-2.0-flash
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## Example flow

```bash
# 1. Create
curl -X POST "$SUPABASE_URL/functions/v1/create-incident" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Flood alert","description":"Water rising","source":"telegram","latitude":29.76,"longitude":-95.37}'

# 2. AI process (use returned id)
curl -X POST "$SUPABASE_URL/functions/v1/process-incident-with-ai" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"incident_id":"<uuid>"}'

# 3. Bootstrap dashboard
curl "$SUPABASE_URL/functions/v1/get-realtime-incidents?limit=50&hours=24" \
  -H "Authorization: Bearer $ANON_KEY"
```

Then subscribe to Realtime on `public.incidents` in the frontend.
