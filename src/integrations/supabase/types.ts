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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      blockchain_transactions: {
        Row: {
          amount: number
          block_hash: string
          block_number: number
          created_at: string | null
          gas_used: number | null
          id: string
          network_status: string | null
          payment_transaction_id: string | null
          project_id: string | null
          signatures: Json | null
          transaction_hash: string
          verification_data: Json | null
        }
        Insert: {
          amount: number
          block_hash: string
          block_number: number
          created_at?: string | null
          gas_used?: number | null
          id?: string
          network_status?: string | null
          payment_transaction_id?: string | null
          project_id?: string | null
          signatures?: Json | null
          transaction_hash: string
          verification_data?: Json | null
        }
        Update: {
          amount?: number
          block_hash?: string
          block_number?: number
          created_at?: string | null
          gas_used?: number | null
          id?: string
          network_status?: string | null
          payment_transaction_id?: string | null
          project_id?: string | null
          signatures?: Json | null
          transaction_hash?: string
          verification_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_transactions_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockchain_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      citizen_workers: {
        Row: {
          alternate_phone: string | null
          availability_status: string | null
          background_check_status: string | null
          bank_account: string | null
          bank_name: string | null
          certifications: string[] | null
          county: string
          created_at: string | null
          cv_document_url: string | null
          daily_rate: number | null
          education_level: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          kra_pin: string | null
          languages: string[] | null
          max_travel_distance: number | null
          national_id: string | null
          phone_number: string
          physical_address: string | null
          profile_photo_url: string | null
          rating: number | null
          skills: string[]
          sub_county: string | null
          total_jobs_completed: number | null
          transport_means: string[] | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
          ward: string | null
          willing_to_travel: boolean | null
        }
        Insert: {
          alternate_phone?: string | null
          availability_status?: string | null
          background_check_status?: string | null
          bank_account?: string | null
          bank_name?: string | null
          certifications?: string[] | null
          county: string
          created_at?: string | null
          cv_document_url?: string | null
          daily_rate?: number | null
          education_level?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          kra_pin?: string | null
          languages?: string[] | null
          max_travel_distance?: number | null
          national_id?: string | null
          phone_number: string
          physical_address?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          skills?: string[]
          sub_county?: string | null
          total_jobs_completed?: number | null
          transport_means?: string[] | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
          ward?: string | null
          willing_to_travel?: boolean | null
        }
        Update: {
          alternate_phone?: string | null
          availability_status?: string | null
          background_check_status?: string | null
          bank_account?: string | null
          bank_name?: string | null
          certifications?: string[] | null
          county?: string
          created_at?: string | null
          cv_document_url?: string | null
          daily_rate?: number | null
          education_level?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          kra_pin?: string | null
          languages?: string[] | null
          max_travel_distance?: number | null
          national_id?: string | null
          phone_number?: string
          physical_address?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          skills?: string[]
          sub_county?: string | null
          total_jobs_completed?: number | null
          transport_means?: string[] | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
          ward?: string | null
          willing_to_travel?: boolean | null
        }
        Relationships: []
      }
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
      contractor_ratings: {
        Row: {
          communication: number | null
          completion_timeliness: number | null
          contractor_id: string
          created_at: string | null
          id: string
          project_id: string | null
          rated_by: string
          rating: number | null
          review: string | null
          work_quality: number | null
        }
        Insert: {
          communication?: number | null
          completion_timeliness?: number | null
          contractor_id: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          rated_by: string
          rating?: number | null
          review?: string | null
          work_quality?: number | null
        }
        Update: {
          communication?: number | null
          completion_timeliness?: number | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          rated_by?: string
          rating?: number | null
          review?: string | null
          work_quality?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_ratings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      job_applications: {
        Row: {
          applicant_id: string
          application_message: string | null
          applied_at: string | null
          id: string
          job_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          applicant_id: string
          application_message?: string | null
          applied_at?: string | null
          id?: string
          job_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          applicant_id?: string
          application_message?: string | null
          applied_at?: string | null
          id?: string
          job_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "workforce_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      local_purchase_orders: {
        Row: {
          contractor_id: string
          created_at: string | null
          description: string
          id: string
          issued_at: string | null
          issued_by: string
          lpo_number: string
          project_id: string
          status: string | null
          terms_conditions: string | null
          total_amount: number
          valid_until: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          description: string
          id?: string
          issued_at?: string | null
          issued_by: string
          lpo_number: string
          project_id: string
          status?: string | null
          terms_conditions?: string | null
          total_amount: number
          valid_until?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          description?: string
          id?: string
          issued_at?: string | null
          issued_by?: string
          lpo_number?: string
          project_id?: string
          status?: string | null
          terms_conditions?: string | null
          total_amount?: number
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "local_purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          gps_coordinates: unknown | null
          id: string
          location: string | null
          photo_urls: string[] | null
          priority: string | null
          priority_score: number | null
          reported_by: string
          status: string | null
          title: string
          updated_at: string | null
          verification_deadline: string | null
          video_urls: string[] | null
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
          gps_coordinates?: unknown | null
          id?: string
          location?: string | null
          photo_urls?: string[] | null
          priority?: string | null
          priority_score?: number | null
          reported_by: string
          status?: string | null
          title: string
          updated_at?: string | null
          verification_deadline?: string | null
          video_urls?: string[] | null
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
          gps_coordinates?: unknown | null
          id?: string
          location?: string | null
          photo_urls?: string[] | null
          priority?: string | null
          priority_score?: number | null
          reported_by?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          verification_deadline?: string | null
          video_urls?: string[] | null
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
      project_progress: {
        Row: {
          challenges_faced: string | null
          citizen_verified: boolean | null
          created_at: string | null
          equipment_used: string[] | null
          gps_coordinates: unknown | null
          id: string
          milestone_id: string | null
          photo_urls: string[] | null
          progress_percentage: number | null
          project_id: string
          supervisor_approved: boolean | null
          update_description: string
          updated_by: string
          video_urls: string[] | null
          weather_conditions: string | null
          workers_present: number | null
        }
        Insert: {
          challenges_faced?: string | null
          citizen_verified?: boolean | null
          created_at?: string | null
          equipment_used?: string[] | null
          gps_coordinates?: unknown | null
          id?: string
          milestone_id?: string | null
          photo_urls?: string[] | null
          progress_percentage?: number | null
          project_id: string
          supervisor_approved?: boolean | null
          update_description: string
          updated_by: string
          video_urls?: string[] | null
          weather_conditions?: string | null
          workers_present?: number | null
        }
        Update: {
          challenges_faced?: string | null
          citizen_verified?: boolean | null
          created_at?: string | null
          equipment_used?: string[] | null
          gps_coordinates?: unknown | null
          id?: string
          milestone_id?: string | null
          photo_urls?: string[] | null
          progress_percentage?: number | null
          project_id?: string
          supervisor_approved?: boolean | null
          update_description?: string
          updated_by?: string
          video_urls?: string[] | null
          weather_conditions?: string | null
          workers_present?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_progress_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_progress_project_id_fkey"
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
      quality_checkpoints: {
        Row: {
          checkpoint_name: string
          corrective_actions: string | null
          created_at: string | null
          findings: string | null
          follow_up_deadline: string | null
          follow_up_required: boolean | null
          id: string
          inspection_criteria: string
          inspection_date: string | null
          inspector_id: string
          inspector_type: string
          milestone_id: string | null
          passed: boolean | null
          photo_evidence: string[] | null
          project_id: string
          recommendations: string | null
          score: number | null
        }
        Insert: {
          checkpoint_name: string
          corrective_actions?: string | null
          created_at?: string | null
          findings?: string | null
          follow_up_deadline?: string | null
          follow_up_required?: boolean | null
          id?: string
          inspection_criteria: string
          inspection_date?: string | null
          inspector_id: string
          inspector_type: string
          milestone_id?: string | null
          passed?: boolean | null
          photo_evidence?: string[] | null
          project_id: string
          recommendations?: string | null
          score?: number | null
        }
        Update: {
          checkpoint_name?: string
          corrective_actions?: string | null
          created_at?: string | null
          findings?: string | null
          follow_up_deadline?: string | null
          follow_up_required?: boolean | null
          id?: string
          inspection_criteria?: string
          inspection_date?: string | null
          inspector_id?: string
          inspector_type?: string
          milestone_id?: string | null
          passed?: boolean | null
          photo_evidence?: string[] | null
          project_id?: string
          recommendations?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_checkpoints_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_checkpoints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_project_updates: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          message: string
          metadata: Json | null
          project_id: string
          update_type: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          message: string
          metadata?: Json | null
          project_id: string
          update_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          message?: string
          metadata?: Json | null
          project_id?: string
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "realtime_project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      system_analytics: {
        Row: {
          category: string
          created_at: string | null
          id: string
          metadata: Json | null
          metric_date: string
          metric_name: string
          metric_value: number
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_date: string
          metric_name: string
          metric_value: number
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_name?: string
          metric_value?: number
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
      worker_data_access_logs: {
        Row: {
          access_timestamp: string
          access_type: string
          accessed_fields: string[] | null
          government_user_id: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          access_timestamp?: string
          access_type: string
          accessed_fields?: string[] | null
          government_user_id: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          access_timestamp?: string
          access_type?: string
          accessed_fields?: string[] | null
          government_user_id?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: []
      }
      workforce_applications: {
        Row: {
          application_letter: string | null
          applied_at: string | null
          availability_end: string | null
          availability_start: string | null
          id: string
          job_id: string
          proposed_rate: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          worker_id: string
        }
        Insert: {
          application_letter?: string | null
          applied_at?: string | null
          availability_end?: string | null
          availability_start?: string | null
          id?: string
          job_id: string
          proposed_rate?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          worker_id: string
        }
        Update: {
          application_letter?: string | null
          applied_at?: string | null
          availability_end?: string | null
          availability_start?: string | null
          id?: string
          job_id?: string
          proposed_rate?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workforce_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "workforce_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workforce_applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "citizen_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workforce_jobs: {
        Row: {
          created_at: string | null
          created_by: string
          description: string
          duration_days: number | null
          id: string
          location: string
          positions_available: number | null
          project_id: string | null
          required_skills: string[]
          status: string | null
          title: string
          updated_at: string | null
          wage_max: number | null
          wage_min: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description: string
          duration_days?: number | null
          id?: string
          location: string
          positions_available?: number | null
          project_id?: string | null
          required_skills?: string[]
          status?: string | null
          title: string
          updated_at?: string | null
          wage_max?: number | null
          wage_min?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string
          duration_days?: number | null
          id?: string
          location?: string
          positions_available?: number | null
          project_id?: string | null
          required_skills?: string[]
          status?: string | null
          title?: string
          updated_at?: string | null
          wage_max?: number | null
          wage_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workforce_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrypt_sensitive_data: {
        Args: { encrypted_data: string; key?: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { data: string; key?: string }
        Returns: string
      }
      get_available_workers: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability_status: string
          background_check_status: string
          certifications: string[]
          county: string
          created_at: string
          daily_rate: number
          education_level: string
          experience_years: number
          hourly_rate: number
          id: string
          languages: string[]
          max_travel_distance: number
          profile_photo_url: string
          rating: number
          skills: string[]
          total_jobs_completed: number
          transport_means: string[]
          updated_at: string
          user_id: string
          verification_status: string
          willing_to_travel: boolean
        }[]
      }
      get_available_workers_for_contractors: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability_status: string
          background_check_status: string
          certifications: string[]
          county: string
          created_at: string
          daily_rate: number
          education_level: string
          experience_years: number
          hourly_rate: number
          id: string
          languages: string[]
          max_travel_distance: number
          profile_photo_url: string
          rating: number
          skills: string[]
          total_jobs_completed: number
          transport_means: string[]
          updated_at: string
          user_id: string
          verification_status: string
          willing_to_travel: boolean
        }[]
      }
      get_citizen_worker_decrypted: {
        Args: { worker_id: string }
        Returns: {
          alternate_phone: string
          availability_status: string
          background_check_status: string
          bank_account: string
          bank_name: string
          certifications: string[]
          county: string
          created_at: string
          cv_document_url: string
          daily_rate: number
          education_level: string
          emergency_contact_name: string
          emergency_contact_phone: string
          experience_years: number
          hourly_rate: number
          id: string
          kra_pin: string
          languages: string[]
          max_travel_distance: number
          national_id: string
          phone_number: string
          physical_address: string
          profile_photo_url: string
          rating: number
          skills: string[]
          sub_county: string
          total_jobs_completed: number
          transport_means: string[]
          updated_at: string
          user_id: string
          verification_status: string
          ward: string
          willing_to_travel: boolean
        }[]
      }
      get_public_contractor_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          available_for_work: boolean
          certifications: string
          created_at: string
          custom_skills: string[]
          id: string
          location: string
          organization: string
          portfolio: string
          skills: string[]
          updated_at: string
          user_id: string
          years_experience: number
        }[]
      }
      get_worker_contact_info: {
        Args: { worker_id: string }
        Returns: {
          alternate_phone: string
          phone_number: string
        }[]
      }
      is_verified_government_user: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      update_system_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
