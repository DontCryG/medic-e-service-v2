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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      accounting_logs: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          discord_id: string | null
          id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          discord_id?: string | null
          id?: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          discord_id?: string | null
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_logs_discord_id_fkey"
            columns: ["discord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      duty_logs: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          discord_id: string
          duty_type: string | null
          granted_by: string | null
          id: string
          last_break_start: string | null
          status: string
          total_break_minutes: number | null
          total_duty_minutes: number | null
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          discord_id: string
          duty_type?: string | null
          granted_by?: string | null
          id?: string
          last_break_start?: string | null
          status?: string
          total_break_minutes?: number | null
          total_duty_minutes?: number | null
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          discord_id?: string
          duty_type?: string | null
          granted_by?: string | null
          id?: string
          last_break_start?: string | null
          status?: string
          total_break_minutes?: number | null
          total_duty_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_duty_logs_users"
            columns: ["discord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      gangs: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      general_requests: {
        Row: {
          admin_comment: string | null
          created_at: string | null
          description: string | null
          discord_id: string | null
          id: string
          request_type: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_comment?: string | null
          created_at?: string | null
          description?: string | null
          discord_id?: string | null
          id?: string
          request_type: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_comment?: string | null
          created_at?: string | null
          description?: string | null
          discord_id?: string | null
          id?: string
          request_type?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "general_requests_discord_id_fkey"
            columns: ["discord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      inventory_logs: {
        Row: {
          created_at: string | null
          description: string | null
          discord_id: string | null
          id: string
          item_name: string
          metadata: Json | null
          quantity: number
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discord_id?: string | null
          id?: string
          item_name: string
          metadata?: Json | null
          quantity: number
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discord_id?: string | null
          id?: string
          item_name?: string
          metadata?: Json | null
          quantity?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_discord_id_fkey"
            columns: ["discord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          discord_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          discord_id: string
          end_date: string
          id?: string
          leave_type: string
          reason: string
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string
          discord_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_discord_id_fkey"
            columns: ["discord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          discord_id: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          discord_id: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          discord_id?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          ic_rate: number | null
          id: string
          name: string
          oc_rate: number
          rank: number
        }
        Insert: {
          created_at?: string
          ic_rate?: number | null
          id?: string
          name: string
          oc_rate?: number
          rank: number
        }
        Update: {
          created_at?: string
          ic_rate?: number | null
          id?: string
          name?: string
          oc_rate?: number
          rank?: number
        }
        Relationships: []
      }
      queue_logs: {
        Row: {
          agency_id: string | null
          amount: number
          created_at: string
          discord_id: string
          id: string
          type: string
        }
        Insert: {
          agency_id?: string | null
          amount?: number
          created_at?: string
          discord_id: string
          id?: string
          type: string
        }
        Update: {
          agency_id?: string | null
          amount?: number
          created_at?: string
          discord_id?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_logs_discord_id_fkey"
            columns: ["discord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      queue_manager_logs: {
        Row: {
          created_at: string | null
          discord_id: string
          duration_minutes: number | null
          end_time: string | null
          id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          discord_id: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          discord_id?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_manager_logs_discord_id_fkey"
            columns: ["discord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      queue_status: {
        Row: {
          discord_id: string
          manager_start_time: string | null
            remark: string | null
          status: string | null
          story_gang_1: string | null
          story_gang_2: string | null
          story_locked: boolean | null
          story_premium: number | null
          story_target_time: string | null
          story_type: string | null
          updated_at: string | null
        }
        Insert: {
          discord_id: string
          manager_start_time?: string | null
            remark?: string | null
          status?: string | null
          story_gang_1?: string | null
          story_gang_2?: string | null
          story_locked?: boolean | null
          story_premium?: number | null
          story_target_time?: string | null
          story_type?: string | null
          updated_at?: string | null
        }
        Update: {
          discord_id?: string
          manager_start_time?: string | null
            remark?: string | null
          status?: string | null
          story_gang_1?: string | null
          story_gang_2?: string | null
          story_locked?: boolean | null
          story_premium?: number | null
          story_target_time?: string | null
          story_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_queue_status_users"
            columns: ["discord_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      story_logs: {
        Row: {
          created_at: string | null
          discord_id: string
          duration_minutes: number | null
          end_time: string | null
          gang_1: string | null
          gang_2: string | null
          id: string
          start_time: string
          story_target_time: string | null
          story_type: string | null
        }
        Insert: {
          created_at?: string | null
          discord_id: string
          duration_minutes?: number | null
          end_time?: string | null
          gang_1?: string | null
          gang_2?: string | null
          id?: string
          start_time: string
          story_target_time?: string | null
          story_type?: string | null
        }
        Update: {
          created_at?: string | null
          discord_id?: string
          duration_minutes?: number | null
          end_time?: string | null
          gang_1?: string | null
          gang_2?: string | null
          id?: string
          start_time?: string
          story_target_time?: string | null
          story_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_story_logs_users"
            columns: ["discord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          type: string | null
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          type?: string | null
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          type?: string | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          discord_id: string
          ic_name: string
          ic_phone: string | null
          position_id: string | null
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          discord_id: string
          ic_name: string
          ic_phone?: string | null
          position_id?: string | null
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          discord_id?: string
          ic_name?: string
          ic_phone?: string | null
          position_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const


