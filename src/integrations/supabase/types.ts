export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      community_votes: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          report_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          report_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          report_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_votes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "problem_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_bids: {
        Row: {
          bid_amount: number
          contractor_id: string
          created_at: string
          estimated_duration: number
          id: string
          proposal: string
          report_id: string
          selected_at: string | null
          status: string
          submitted_at: string
          technical_approach: string | null
        }
        Insert: {
          bid_amount: number
          contractor_id: string
          created_at?: string
          estimated_duration: number
          id?: string
          proposal: string
          report_id: string
          selected_at?: string | null
          status?: string
          submitted_at?: string
          technical_approach?: string | null
        }
        Update: {
          bid_amount?: number
          contractor_id?: string
          created_at?: string
          estimated_duration?: number
          id?: string
          proposal?: string
          report_id?: string
          selected_at?: string | null
          status?: string
          submitted_at?: string
          technical_approach?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_bids_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "problem_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_credentials: {
        Row: {
          contractor_id: string
          created_at: string
          credential_name: string
          credential_number: string | null
          credential_type: string
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_authority: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string
          credential_name: string
          credential_number?: string | null
          credential_type: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string
          credential_name?: string
          credential_number?: string | null
          credential_type?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      escrow_accounts: {
        Row: {
          created_at: string
          held_amount: number
          id: string
          project_id: string
          released_amount: number
          status: string
          stripe_account_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          held_amount?: number
          id?: string
          project_id: string
          released_amount?: number
          status?: string
          stripe_account_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          held_amount?: number
          id?: string
          project_id?: string
          released_amount?: number
          status?: string
          stripe_account_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      file_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          milestone_id: string | null
          project_id: string | null
          report_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          milestone_id?: string | null
          project_id?: string | null
          report_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          milestone_id?: string | null
          project_id?: string | null
          report_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_uploads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_uploads_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "problem_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_verifications: {
        Row: {
          id: string
          milestone_id: string
          verification_notes: string | null
          verification_photos: string[] | null
          verification_status: string
          verified_at: string
          verifier_id: string
        }
        Insert: {
          id?: string
          milestone_id: string
          verification_notes?: string | null
          verification_photos?: string[] | null
          verification_status: string
          verified_at?: string
          verifier_id: string
        }
        Update: {
          id?: string
          milestone_id?: string
          verification_notes?: string | null
          verification_photos?: string[] | null
          verification_status?: string
          verified_at?: string
          verifier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_verifications_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category: string
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          escrow_account_id: string
          id: string
          milestone_id: string | null
          payment_method: string | null
          status: string
          stripe_transaction_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          escrow_account_id: string
          id?: string
          milestone_id?: string | null
          payment_method?: string | null
          status?: string
          stripe_transaction_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          escrow_account_id?: string
          id?: string
          milestone_id?: string | null
          payment_method?: string | null
          status?: string
          stripe_transaction_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_escrow_account_id_fkey"
            columns: ["escrow_account_id"]
            isOneToOne: false
            referencedRelation: "escrow_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_reports: {
        Row: {
          affected_population: number | null
          approved_at: string | null
          approved_by: string | null
          budget_allocated: number | null
          category: string | null
          coordinates: string | null
          created_at: string | null
          description: string
          estimated_cost: number | null
          id: string
          location: string | null
          photo_urls: string[] | null
          priority: string | null
          priority_score: number | null
          reported_by: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_population?: number | null
          approved_at?: string | null
          approved_by?: string | null
          budget_allocated?: number | null
          category?: string | null
          coordinates?: string | null
          created_at?: string | null
          description: string
          estimated_cost?: number | null
          id?: string
          location?: string | null
          photo_urls?: string[] | null
          priority?: string | null
          priority_score?: number | null
          reported_by: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_population?: number | null
          approved_at?: string | null
          approved_by?: string | null
          budget_allocated?: number | null
          category?: string | null
          coordinates?: string | null
          created_at?: string | null
          description?: string
          estimated_cost?: number | null
          id?: string
          location?: string | null
          photo_urls?: string[] | null
          priority?: string | null
          priority_score?: number | null
          reported_by?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completion_criteria: string | null
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          milestone_number: number
          payment_percentage: number
          project_id: string
          status: string
          submitted_at: string | null
          target_completion_date: string | null
          title: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          completion_criteria?: string | null
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          milestone_number: number
          payment_percentage: number
          project_id: string
          status?: string
          submitted_at?: string | null
          target_completion_date?: string | null
          title: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          completion_criteria?: string | null
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          milestone_number?: number
          payment_percentage?: number
          project_id?: string
          status?: string
          submitted_at?: string | null
          target_completion_date?: string | null
          title?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          contractor_id: string | null
          created_at: string | null
          description: string
          id: string
          report_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          contractor_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          report_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          contractor_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          report_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "problem_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_profiles: {
        Row: {
          available_for_work: boolean | null
          certifications: string | null
          created_at: string
          custom_skills: string[] | null
          full_name: string
          id: string
          location: string | null
          organization: string | null
          phone_number: string | null
          portfolio: string | null
          skills: string[]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          available_for_work?: boolean | null
          certifications?: string | null
          created_at?: string
          custom_skills?: string[] | null
          full_name: string
          id?: string
          location?: string | null
          organization?: string | null
          phone_number?: string | null
          portfolio?: string | null
          skills: string[]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          available_for_work?: boolean | null
          certifications?: string | null
          created_at?: string
          custom_skills?: string[] | null
          full_name?: string
          id?: string
          location?: string | null
          organization?: string | null
          phone_number?: string | null
          portfolio?: string | null
          skills?: string[]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          location: string | null
          phone_number: string | null
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone_number?: string | null
          updated_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone_number?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      user_verifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          reference_number: string
          status: string | null
          updated_at: string | null
          user_id: string
          verification_data: Json | null
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reference_number: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_data?: Json | null
          verification_type: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reference_number?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_data?: Json | null
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: []
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
