export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: []
      }
      event_approvals: {
        Row: {
          action: string
          approved_by: string | null
          created_at: string | null
          event_id: string
          from_status: string | null
          id: string
          notes: string | null
          to_status: string
        }
        Insert: {
          action: string
          approved_by?: string | null
          created_at?: string | null
          event_id: string
          from_status?: string | null
          id?: string
          notes?: string | null
          to_status: string
        }
        Update: {
          action?: string
          approved_by?: string | null
          created_at?: string | null
          event_id?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_approvals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_assignments: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          referee_id: string
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          referee_id: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          referee_id?: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          id: string
          kabupaten_kota_id: string | null
          location: string | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          kabupaten_kota_id?: string | null
          location?: string | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          kabupaten_kota_id?: string | null
          location?: string | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_kabupaten_kota_id_fkey"
            columns: ["kabupaten_kota_id"]
            isOneToOne: false
            referencedRelation: "kabupaten_kota"
            referencedColumns: ["id"]
          },
        ]
      }
      honors: {
        Row: {
          amount: number
          created_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          referee_id: string
          status: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          referee_id: string
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          referee_id?: string
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "honors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honors_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honors_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kabupaten_kota: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string
          provinsi_id: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          provinsi_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          provinsi_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kabupaten_kota_provinsi_id_fkey"
            columns: ["provinsi_id"]
            isOneToOne: false
            referencedRelation: "provinsi"
            referencedColumns: ["id"]
          },
        ]
      }
      pengurus: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          jabatan: string
          kabupaten_kota_id: string | null
          level: Database["public"]["Enums"]["pengurus_level"]
          provinsi_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jabatan: string
          kabupaten_kota_id?: string | null
          level: Database["public"]["Enums"]["pengurus_level"]
          provinsi_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jabatan?: string
          kabupaten_kota_id?: string | null
          level?: Database["public"]["Enums"]["pengurus_level"]
          provinsi_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengurus_kabupaten_kota_id_fkey"
            columns: ["kabupaten_kota_id"]
            isOneToOne: false
            referencedRelation: "kabupaten_kota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengurus_provinsi_id_fkey"
            columns: ["provinsi_id"]
            isOneToOne: false
            referencedRelation: "provinsi"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          afk_origin: string | null
          approved_at: string | null
          approved_by: string | null
          birth_date: string | null
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_profile_complete: boolean | null
          kabupaten_kota_id: string | null
          ktp_photo_url: string | null
          license_expiry: string | null
          license_level: string | null
          license_photo_url: string | null
          occupation: string | null
          profile_photo_url: string | null
          registration_status: string | null
          rejected_reason: string | null
          requested_role: string | null
          updated_at: string | null
        }
        Insert: {
          afk_origin?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          is_profile_complete?: boolean | null
          kabupaten_kota_id?: string | null
          ktp_photo_url?: string | null
          license_expiry?: string | null
          license_level?: string | null
          license_photo_url?: string | null
          occupation?: string | null
          profile_photo_url?: string | null
          registration_status?: string | null
          rejected_reason?: string | null
          requested_role?: string | null
          updated_at?: string | null
        }
        Update: {
          afk_origin?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_profile_complete?: boolean | null
          kabupaten_kota_id?: string | null
          ktp_photo_url?: string | null
          license_expiry?: string | null
          license_level?: string | null
          license_photo_url?: string | null
          occupation?: string | null
          profile_photo_url?: string | null
          registration_status?: string | null
          rejected_reason?: string | null
          requested_role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_kabupaten_kota_id_fkey"
            columns: ["kabupaten_kota_id"]
            isOneToOne: false
            referencedRelation: "kabupaten_kota"
            referencedColumns: ["id"]
          },
        ]
      }
      provinsi: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referee_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          referee_id: string
          reviewer_name: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          referee_id: string
          reviewer_name?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          referee_id?: string
          reviewer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referee_reviews_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      referee_review_stats: {
        Row: {
          avg_rating: number | null
          referee_id: string | null
          total_reviews: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referee_reviews_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_admin_dashboard_summary: {
        Args: {
          _end_date?: string
          _kabupaten_kota_id?: string
          _start_date?: string
        }
        Returns: {
          active_referees: number
          avg_income_per_referee: number
          completed_events: number
          total_events: number
          total_pending_income: number
          total_referees: number
          total_verified_income: number
        }[]
      }
      get_audit_logs: {
        Args: {
          _action?: string
          _actor_id?: string
          _end_date?: string
          _entity_id?: string
          _entity_type?: string
          _limit?: number
          _offset?: number
          _start_date?: string
        }
        Returns: {
          action: string
          actor_id: string
          actor_name: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          new_data: Json
          old_data: Json
        }[]
      }
      get_honor_statistics: {
        Args: { _referee_id?: string }
        Returns: {
          pending_amount: number
          referee_id: string
          total_earned: number
          total_pending: number
          total_rejected: number
          total_verified: number
        }[]
      }
      get_pending_registrations: {
        Args: never
        Returns: {
          created_at: string
          full_name: string
          id: string
          kabupaten_kota_id: string
          kabupaten_kota_name: string
          registration_status: string
          requested_role: string
        }[]
      }
      get_referee_event_count: {
        Args: {
          _end_date?: string
          _kabupaten_kota_id?: string
          _start_date?: string
        }
        Returns: {
          cancelled_events: number
          completed_events: number
          kabupaten_kota_id: string
          kabupaten_kota_name: string
          pending_events: number
          referee_id: string
          referee_name: string
          total_events: number
        }[]
      }
      get_referee_income_summary: {
        Args: {
          _end_date?: string
          _kabupaten_kota_id?: string
          _start_date?: string
        }
        Returns: {
          kabupaten_kota_id: string
          kabupaten_kota_name: string
          pending_count: number
          referee_id: string
          referee_name: string
          rejected_count: number
          total_pending_income: number
          total_verified_income: number
          verified_count: number
        }[]
      }
      get_referees: {
        Args: {
          _is_active?: boolean
          _kabupaten_kota_id?: string
          _license_level?: string
          _search?: string
        }
        Returns: {
          afk_origin: string
          birth_date: string
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          is_profile_complete: boolean
          kabupaten_kota_id: string
          kabupaten_kota_name: string
          license_expiry: string
          license_level: string
          profile_photo_url: string
        }[]
      }
      get_registration_history: {
        Args: never
        Returns: {
          approved_at: string
          approved_by: string
          approver_name: string
          created_at: string
          full_name: string
          id: string
          kabupaten_kota_id: string
          kabupaten_kota_name: string
          registration_status: string
          rejected_reason: string
          requested_role: string
        }[]
      }
      get_user_kabupaten_kota: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_schedule_conflict: {
        Args: { _event_id: string; _referee_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_provinsi: { Args: { _user_id: string }; Returns: boolean }
      is_event_approved: { Args: { _event_id: string }; Returns: boolean }
      is_referee_active: { Args: { _referee_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin_provinsi"
        | "admin_kab_kota"
        | "panitia"
        | "wasit"
        | "evaluator"
      pengurus_level: "PROVINSI" | "KAB_KOTA"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin_provinsi",
        "admin_kab_kota",
        "panitia",
        "wasit",
        "evaluator",
      ],
      pengurus_level: ["PROVINSI", "KAB_KOTA"],
    },
  },
} as const
