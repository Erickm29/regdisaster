/** Slim column set for dashboard map + feed (matches edge function) */
export const INCIDENT_SELECT_COLUMNS =
  "id,title,disaster_type,severity,latitude,longitude,source,status,ai_summary,image_url,created_at" as const

export const DEFAULT_INCIDENT_STATUS_FILTER = ["active", "verified"] as const
export const DEFAULT_INCIDENT_HOURS = 24
export const DEFAULT_INCIDENT_LIMIT = 50
