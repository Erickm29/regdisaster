export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      incidents: {
        Row: {
          ai_summary: string | null
          created_at: string
          description: string | null
          disaster_type: string
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          severity: string
          source: string
          status: string
          title: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          description?: string | null
          disaster_type: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          severity?: string
          source: string
          status?: string
          title: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          description?: string | null
          disaster_type?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          severity?: string
          source?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      incidents_active: {
        Row: {
          ai_summary: string | null
          created_at: string | null
          description: string | null
          disaster_type: string | null
          id: string | null
          image_url: string | null
          latitude: number | null
          longitude: number | null
          severity: string | null
          source: string | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
      incidents_stats: {
        Row: {
          active_count: number | null
          critical_count: number | null
          latest_incident_at: string | null
          news_count: number | null
          telegram_count: number | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      incidents_nearby: {
        Args: { lat: number; lng: number; radius_km?: number }
        Returns: Database["public"]["Tables"]["incidents"]["Row"][]
      }
      incidents_recent: {
        Args: { hours?: number }
        Returns: Database["public"]["Tables"]["incidents"]["Row"][]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
