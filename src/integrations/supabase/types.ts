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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      access_audit_log: {
        Row: {
          action: string
          created_at: string
          granted: boolean | null
          id: string
          ip_address: string | null
          organization_id: string | null
          reason: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          granted?: boolean | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          granted?: boolean | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          call_duration: number | null
          call_outcome: string | null
          call_recording_url: string | null
          completed_at: string | null
          contact_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          direction: string | null
          due_date: string | null
          email_cc: string[] | null
          email_from: string | null
          email_message_id: string | null
          email_to: string[] | null
          id: string
          is_completed: boolean | null
          matter_id: string | null
          meeting_attendees: string[] | null
          meeting_end: string | null
          meeting_location: string | null
          meeting_start: string | null
          metadata: Json | null
          organization_id: string
          owner_type: string
          subject: string | null
          type: string
        }
        Insert: {
          call_duration?: number | null
          call_outcome?: string | null
          call_recording_url?: string | null
          completed_at?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          direction?: string | null
          due_date?: string | null
          email_cc?: string[] | null
          email_from?: string | null
          email_message_id?: string | null
          email_to?: string[] | null
          id?: string
          is_completed?: boolean | null
          matter_id?: string | null
          meeting_attendees?: string[] | null
          meeting_end?: string | null
          meeting_location?: string | null
          meeting_start?: string | null
          metadata?: Json | null
          organization_id: string
          owner_type?: string
          subject?: string | null
          type?: string
        }
        Update: {
          call_duration?: number | null
          call_outcome?: string | null
          call_recording_url?: string | null
          completed_at?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          direction?: string | null
          due_date?: string | null
          email_cc?: string[] | null
          email_from?: string | null
          email_message_id?: string | null
          email_to?: string[] | null
          id?: string
          is_completed?: boolean | null
          matter_id?: string | null
          meeting_attendees?: string[] | null
          meeting_end?: string | null
          meeting_location?: string | null
          meeting_start?: string | null
          metadata?: Json | null
          organization_id?: string
          owner_type?: string
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_action_types: {
        Row: {
          category: string | null
          code: string
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name_en: string
          name_es: string
        }
        Insert: {
          category?: string | null
          code: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name_en: string
          name_es: string
        }
        Update: {
          category?: string | null
          code?: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name_en?: string
          name_es?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action: string
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          matter_id: string | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          organization_id: string
          source: string | null
          title: string | null
        }
        Insert: {
          action: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          matter_id?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id: string
          source?: string | null
          title?: string | null
        }
        Update: {
          action?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          matter_id?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string
          source?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          severity: string | null
          title: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          severity?: string | null
          title?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          severity?: string | null
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
      agent_audit_log: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agent_badges: {
        Row: {
          agent_id: string | null
          badge_type: string | null
          context: Json | null
          created_at: string | null
          earned_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          agent_id?: string | null
          badge_type?: string | null
          context?: Json | null
          created_at?: string | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          agent_id?: string | null
          badge_type?: string | null
          context?: Json | null
          created_at?: string | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      agent_chat_messages: {
        Row: {
          content: string | null
          cost_cents: number | null
          created_at: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          metadata: Json | null
          model_used: string | null
          output_tokens: number | null
          role: string | null
          session_id: string | null
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content?: string | null
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          model_used?: string | null
          output_tokens?: number | null
          role?: string | null
          session_id?: string | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string | null
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          model_used?: string | null
          output_tokens?: number | null
          role?: string | null
          session_id?: string | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: []
      }
      agent_chat_sessions: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          last_message_at: string | null
          message_count: number | null
          model: string | null
          status: string | null
          title: string | null
          total_cost_cents: number | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          model?: string | null
          status?: string | null
          title?: string | null
          total_cost_cents?: number | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          model?: string | null
          status?: string | null
          title?: string | null
          total_cost_cents?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string | null
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      agent_emails: {
        Row: {
          body_html: string | null
          body_text: string | null
          classification: string | null
          created_at: string | null
          from_address: string | null
          id: string
          message_id: string | null
          status: string | null
          subject: string | null
          to_address: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          classification?: string | null
          created_at?: string | null
          from_address?: string | null
          id?: string
          message_id?: string | null
          status?: string | null
          subject?: string | null
          to_address?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          classification?: string | null
          created_at?: string | null
          from_address?: string | null
          id?: string
          message_id?: string | null
          status?: string | null
          subject?: string | null
          to_address?: string | null
        }
        Relationships: []
      }
      agent_instance_config: {
        Row: {
          allowed_tools: Json | null
          brand_name: string | null
          created_at: string | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          llm_max_tokens: number | null
          llm_model: string | null
          llm_provider: string | null
          llm_temperature: number | null
          memory_enabled: boolean | null
          rag_enabled: boolean | null
          rag_max_chunks: number | null
          rag_similarity_threshold: number | null
          system_prompt: string | null
          tool_definitions: Json | null
          updated_at: string | null
        }
        Insert: {
          allowed_tools?: Json | null
          brand_name?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          llm_max_tokens?: number | null
          llm_model?: string | null
          llm_provider?: string | null
          llm_temperature?: number | null
          memory_enabled?: boolean | null
          rag_enabled?: boolean | null
          rag_max_chunks?: number | null
          rag_similarity_threshold?: number | null
          system_prompt?: string | null
          tool_definitions?: Json | null
          updated_at?: string | null
        }
        Update: {
          allowed_tools?: Json | null
          brand_name?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          llm_max_tokens?: number | null
          llm_model?: string | null
          llm_provider?: string | null
          llm_temperature?: number | null
          memory_enabled?: boolean | null
          rag_enabled?: boolean | null
          rag_max_chunks?: number | null
          rag_similarity_threshold?: number | null
          system_prompt?: string | null
          tool_definitions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_jurisdiction_profiles: {
        Row: {
          cases_processed: number | null
          created_at: string | null
          currency: string | null
          expertise_description: string | null
          flag_code: string | null
          flag_emoji: string | null
          id: string
          ipo_office_id: string | null
          is_active: boolean | null
          jurisdiction_code: string | null
          jurisdiction_name: string | null
          kb_chunk_filter: string | null
          kb_chunks_count: number | null
          kb_last_updated: string | null
          kb_status: string | null
          key_institutions: string[] | null
          legislation_refs: string[] | null
          official_language: string | null
          sort_order: number | null
          system_prompt_extension: string | null
          typical_timeline: string | null
          updated_at: string | null
        }
        Insert: {
          cases_processed?: number | null
          created_at?: string | null
          currency?: string | null
          expertise_description?: string | null
          flag_code?: string | null
          flag_emoji?: string | null
          id?: string
          ipo_office_id?: string | null
          is_active?: boolean | null
          jurisdiction_code?: string | null
          jurisdiction_name?: string | null
          kb_chunk_filter?: string | null
          kb_chunks_count?: number | null
          kb_last_updated?: string | null
          kb_status?: string | null
          key_institutions?: string[] | null
          legislation_refs?: string[] | null
          official_language?: string | null
          sort_order?: number | null
          system_prompt_extension?: string | null
          typical_timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          cases_processed?: number | null
          created_at?: string | null
          currency?: string | null
          expertise_description?: string | null
          flag_code?: string | null
          flag_emoji?: string | null
          id?: string
          ipo_office_id?: string | null
          is_active?: boolean | null
          jurisdiction_code?: string | null
          jurisdiction_name?: string | null
          kb_chunk_filter?: string | null
          kb_chunks_count?: number | null
          kb_last_updated?: string | null
          kb_status?: string | null
          key_institutions?: string[] | null
          legislation_refs?: string[] | null
          official_language?: string | null
          sort_order?: number | null
          system_prompt_extension?: string | null
          typical_timeline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_learned_knowledge: {
        Row: {
          answer_summary: string | null
          category: string | null
          confidence: number | null
          created_at: string | null
          id: string
          instance_id: string | null
          jurisdiction: string | null
          knowledge_chunk: string | null
          promoted_to_rag: boolean | null
          question_summary: string | null
          times_confirmed: number | null
          times_used: number | null
          updated_at: string | null
        }
        Insert: {
          answer_summary?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          jurisdiction?: string | null
          knowledge_chunk?: string | null
          promoted_to_rag?: boolean | null
          question_summary?: string | null
          times_confirmed?: number | null
          times_used?: number | null
          updated_at?: string | null
        }
        Update: {
          answer_summary?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          jurisdiction?: string | null
          knowledge_chunk?: string | null
          promoted_to_rag?: boolean | null
          question_summary?: string | null
          times_confirmed?: number | null
          times_used?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_memory: {
        Row: {
          created_at: string | null
          expires_at: string | null
          fact_text: string | null
          fact_type: string | null
          id: string
          instance_id: string | null
          metadata: Json | null
          relevance_score: number | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          fact_text?: string | null
          fact_type?: string | null
          id?: string
          instance_id?: string | null
          metadata?: Json | null
          relevance_score?: number | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          fact_text?: string | null
          fact_type?: string | null
          id?: string
          instance_id?: string | null
          metadata?: Json | null
          relevance_score?: number | null
          session_id?: string | null
        }
        Relationships: []
      }
      agent_portal_monitors: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          monitor_type: string | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          monitor_type?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          monitor_type?: string | null
          name?: string | null
        }
        Relationships: []
      }
      agent_providers_config: {
        Row: {
          config_encrypted: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          provider_type: string | null
        }
        Insert: {
          config_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider_type?: string | null
        }
        Update: {
          config_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider_type?: string | null
        }
        Relationships: []
      }
      agent_query_log: {
        Row: {
          aliases_detected: Json | null
          classes_requested: number | null
          country_codes_requested: string[] | null
          country_codes_resolved: string[] | null
          created_at: string | null
          had_missing_data: boolean | null
          had_stale_data: boolean | null
          id: string
          min_confidence_returned: number | null
          response_ms: number | null
          results_found: number | null
          service_type: string | null
          session_id: string | null
          tool_action: string | null
          user_id: string | null
        }
        Insert: {
          aliases_detected?: Json | null
          classes_requested?: number | null
          country_codes_requested?: string[] | null
          country_codes_resolved?: string[] | null
          created_at?: string | null
          had_missing_data?: boolean | null
          had_stale_data?: boolean | null
          id?: string
          min_confidence_returned?: number | null
          response_ms?: number | null
          results_found?: number | null
          service_type?: string | null
          session_id?: string | null
          tool_action?: string | null
          user_id?: string | null
        }
        Update: {
          aliases_detected?: Json | null
          classes_requested?: number | null
          country_codes_requested?: string[] | null
          country_codes_resolved?: string[] | null
          created_at?: string | null
          had_missing_data?: boolean | null
          had_stale_data?: boolean | null
          id?: string
          min_confidence_returned?: number | null
          response_ms?: number | null
          results_found?: number | null
          service_type?: string | null
          session_id?: string | null
          tool_action?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_rankings: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          jurisdiction: string | null
          rank_change: number | null
          rank_percentile: number | null
          rank_position: number
          rank_previous: number | null
          ranking_category: string | null
          ranking_date: string
          rating_avg: number
          reputation_score: number
          response_time_avg: number
          success_rate: number
          total_transactions: number
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          jurisdiction?: string | null
          rank_change?: number | null
          rank_percentile?: number | null
          rank_position: number
          rank_previous?: number | null
          ranking_category?: string | null
          ranking_date?: string
          rating_avg: number
          reputation_score: number
          response_time_avg: number
          success_rate: number
          total_transactions: number
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          jurisdiction?: string | null
          rank_change?: number | null
          rank_percentile?: number | null
          rank_position?: number
          rank_previous?: number | null
          ranking_category?: string | null
          ranking_date?: string
          rating_avg?: number
          reputation_score?: number
          response_time_avg?: number
          success_rate?: number
          total_transactions?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_rankings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_service_fees: {
        Row: {
          additional_class_fee: number | null
          additional_class_fee_currency: string | null
          agent_id: string | null
          classes_included: number | null
          created_at: string | null
          excludes_description: string | null
          fee_amount: number
          fee_amount_eur: number | null
          fee_currency: string | null
          id: string
          includes_apostille: boolean | null
          includes_official_fee: boolean | null
          includes_pow_preparation: boolean | null
          includes_translations: boolean | null
          ipo_office_id: string | null
          last_confirmed_date: string | null
          notes: string | null
          partner_id: string | null
          service_type: string
          source: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          additional_class_fee?: number | null
          additional_class_fee_currency?: string | null
          agent_id?: string | null
          classes_included?: number | null
          created_at?: string | null
          excludes_description?: string | null
          fee_amount: number
          fee_amount_eur?: number | null
          fee_currency?: string | null
          id?: string
          includes_apostille?: boolean | null
          includes_official_fee?: boolean | null
          includes_pow_preparation?: boolean | null
          includes_translations?: boolean | null
          ipo_office_id?: string | null
          last_confirmed_date?: string | null
          notes?: string | null
          partner_id?: string | null
          service_type: string
          source?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          additional_class_fee?: number | null
          additional_class_fee_currency?: string | null
          agent_id?: string | null
          classes_included?: number | null
          created_at?: string | null
          excludes_description?: string | null
          fee_amount?: number
          fee_amount_eur?: number | null
          fee_currency?: string | null
          id?: string
          includes_apostille?: boolean | null
          includes_official_fee?: boolean | null
          includes_pow_preparation?: boolean | null
          includes_translations?: boolean | null
          ipo_office_id?: string | null
          last_confirmed_date?: string | null
          notes?: string | null
          partner_id?: string | null
          service_type?: string
          source?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_service_fees_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_service_fees_ipo_office_id_fkey"
            columns: ["ipo_office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          address: string | null
          avg_response_hours: number | null
          city: string | null
          contact_person: string | null
          contract_expiry: string | null
          contract_url: string | null
          country_code: string
          created_at: string | null
          currency: string | null
          email: string | null
          firm_name: string | null
          handles_apostille: boolean | null
          handles_legalization: boolean | null
          handles_pow: boolean | null
          handles_translations: boolean | null
          id: string
          internal_rating_notes: string | null
          is_active: boolean | null
          is_vetted: boolean | null
          jurisdictions: Json | null
          languages: Json | null
          linkedin_url: string | null
          name: string
          notes: string | null
          payment_methods: Json | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          relationship_since: string | null
          relationship_type: string | null
          service_types: Json | null
          specializations: Json | null
          success_rate_pct: number | null
          timezone: string | null
          total_cases_handled: number | null
          updated_at: string | null
          vetted_by: string | null
          vetted_date: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          avg_response_hours?: number | null
          city?: string | null
          contact_person?: string | null
          contract_expiry?: string | null
          contract_url?: string | null
          country_code: string
          created_at?: string | null
          currency?: string | null
          email?: string | null
          firm_name?: string | null
          handles_apostille?: boolean | null
          handles_legalization?: boolean | null
          handles_pow?: boolean | null
          handles_translations?: boolean | null
          id?: string
          internal_rating_notes?: string | null
          is_active?: boolean | null
          is_vetted?: boolean | null
          jurisdictions?: Json | null
          languages?: Json | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          payment_methods?: Json | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          relationship_since?: string | null
          relationship_type?: string | null
          service_types?: Json | null
          specializations?: Json | null
          success_rate_pct?: number | null
          timezone?: string | null
          total_cases_handled?: number | null
          updated_at?: string | null
          vetted_by?: string | null
          vetted_date?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          avg_response_hours?: number | null
          city?: string | null
          contact_person?: string | null
          contract_expiry?: string | null
          contract_url?: string | null
          country_code?: string
          created_at?: string | null
          currency?: string | null
          email?: string | null
          firm_name?: string | null
          handles_apostille?: boolean | null
          handles_legalization?: boolean | null
          handles_pow?: boolean | null
          handles_translations?: boolean | null
          id?: string
          internal_rating_notes?: string | null
          is_active?: boolean | null
          is_vetted?: boolean | null
          jurisdictions?: Json | null
          languages?: Json | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          payment_methods?: Json | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          relationship_since?: string | null
          relationship_type?: string | null
          service_types?: Json | null
          specializations?: Json | null
          success_rate_pct?: number | null
          timezone?: string | null
          total_cases_handled?: number | null
          updated_at?: string | null
          vetted_by?: string | null
          vetted_date?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      ai_agent_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          referenced_events: string[] | null
          referenced_organizations: string[] | null
          response_time_ms: number | null
          role: string | null
          session_id: string | null
          tokens_used: number | null
          tools_used: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          referenced_events?: string[] | null
          referenced_organizations?: string[] | null
          response_time_ms?: number | null
          role?: string | null
          session_id?: string | null
          tokens_used?: number | null
          tools_used?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          referenced_events?: string[] | null
          referenced_organizations?: string[] | null
          response_time_ms?: number | null
          role?: string | null
          session_id?: string | null
          tokens_used?: number | null
          tools_used?: Json | null
        }
        Relationships: []
      }
      ai_agent_sessions: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          last_message_at: string | null
          metadata: Json | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_annual_cost_summary: {
        Row: {
          cost_trend_pct: number | null
          created_at: string | null
          id: string
          most_expensive_module: string | null
          organization_id: string | null
          total_cost_cents: number | null
          total_requests: number | null
          year: number | null
        }
        Insert: {
          cost_trend_pct?: number | null
          created_at?: string | null
          id?: string
          most_expensive_module?: string | null
          organization_id?: string | null
          total_cost_cents?: number | null
          total_requests?: number | null
          year?: number | null
        }
        Update: {
          cost_trend_pct?: number | null
          created_at?: string | null
          id?: string
          most_expensive_module?: string | null
          organization_id?: string | null
          total_cost_cents?: number | null
          total_requests?: number | null
          year?: number | null
        }
        Relationships: []
      }
      ai_budget_alerts: {
        Row: {
          alert_type: string | null
          budget_config_id: string | null
          created_at: string | null
          current_amount: number | null
          id: string
          is_read: boolean | null
          message: string | null
          organization_id: string | null
          threshold_amount: number | null
        }
        Insert: {
          alert_type?: string | null
          budget_config_id?: string | null
          created_at?: string | null
          current_amount?: number | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          organization_id?: string | null
          threshold_amount?: number | null
        }
        Update: {
          alert_type?: string | null
          budget_config_id?: string | null
          created_at?: string | null
          current_amount?: number | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          organization_id?: string | null
          threshold_amount?: number | null
        }
        Relationships: []
      }
      ai_budget_config: {
        Row: {
          alert_thresholds: number[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_cost_per_request_cents: number | null
          monthly_budget_cents: number | null
          organization_id: string | null
          per_module_limits: Json | null
          updated_at: string | null
        }
        Insert: {
          alert_thresholds?: number[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_cost_per_request_cents?: number | null
          monthly_budget_cents?: number | null
          organization_id?: string | null
          per_module_limits?: Json | null
          updated_at?: string | null
        }
        Update: {
          alert_thresholds?: number[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_cost_per_request_cents?: number | null
          monthly_budget_cents?: number | null
          organization_id?: string | null
          per_module_limits?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_capabilities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          key: string | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string | null
          name?: string | null
        }
        Relationships: []
      }
      ai_capability_assignments: {
        Row: {
          capability_id: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          organization_id: string | null
          plan_tier: string | null
        }
        Insert: {
          capability_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          organization_id?: string | null
          plan_tier?: string | null
        }
        Update: {
          capability_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          organization_id?: string | null
          plan_tier?: string | null
        }
        Relationships: []
      }
      ai_circuit_breaker_states: {
        Row: {
          consecutive_failures: number | null
          created_at: string | null
          failure_count: number | null
          id: string
          last_failure_at: string | null
          last_success_at: string | null
          next_retry_at: string | null
          provider_id: string | null
          state: string | null
          success_count: number | null
          updated_at: string | null
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          next_retry_at?: string | null
          provider_id?: string | null
          state?: string | null
          success_count?: number | null
          updated_at?: string | null
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          next_retry_at?: string | null
          provider_id?: string | null
          state?: string | null
          success_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          agent_type: string
          contact_id: string | null
          context_id: string | null
          context_type: string | null
          created_at: string | null
          document_id: string | null
          id: string
          is_pinned: boolean | null
          is_starred: boolean | null
          last_message_at: string | null
          matter_id: string | null
          message_count: number | null
          organization_id: string
          status: string | null
          title: string | null
          token_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_type?: string
          contact_id?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          is_pinned?: boolean | null
          is_starred?: boolean | null
          last_message_at?: string | null
          matter_id?: string | null
          message_count?: number | null
          organization_id: string
          status?: string | null
          title?: string | null
          token_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          contact_id?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          is_pinned?: boolean | null
          is_starred?: boolean | null
          last_message_at?: string | null
          matter_id?: string | null
          message_count?: number | null
          organization_id?: string
          status?: string | null
          title?: string | null
          token_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_cost_history: {
        Row: {
          cost_cents: number | null
          created_at: string | null
          id: string
          model_id: string | null
          module: string | null
          organization_id: string | null
          period_end: string | null
          period_start: string | null
          provider_id: string | null
          request_count: number | null
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          model_id?: string | null
          module?: string | null
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          provider_id?: string | null
          request_count?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          model_id?: string | null
          module?: string | null
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          provider_id?: string | null
          request_count?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: []
      }
      ai_cost_log: {
        Row: {
          cost_cents: number | null
          created_at: string | null
          execution_id: string | null
          id: string
          input_tokens: number | null
          model_id: string | null
          module: string | null
          organization_id: string | null
          output_tokens: number | null
          prompt_id: string | null
          provider_id: string | null
          user_id: string | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string | null
          execution_id?: string | null
          id?: string
          input_tokens?: number | null
          model_id?: string | null
          module?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          prompt_id?: string | null
          provider_id?: string | null
          user_id?: string | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string | null
          execution_id?: string | null
          id?: string
          input_tokens?: number | null
          model_id?: string | null
          module?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          prompt_id?: string | null
          provider_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_execution_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          input_tokens: number | null
          model_used: string | null
          organization_id: string | null
          output_data: Json | null
          output_tokens: number | null
          prompt_id: string | null
          quality_score: number | null
          status: string | null
          task_id: string | null
          total_cost_cents: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          input_tokens?: number | null
          model_used?: string | null
          organization_id?: string | null
          output_data?: Json | null
          output_tokens?: number | null
          prompt_id?: string | null
          quality_score?: number | null
          status?: string | null
          task_id?: string | null
          total_cost_cents?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          input_tokens?: number | null
          model_used?: string | null
          organization_id?: string | null
          output_data?: Json | null
          output_tokens?: number | null
          prompt_id?: string | null
          quality_score?: number | null
          status?: string | null
          task_id?: string | null
          total_cost_cents?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_function_config: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          function_name: string | null
          id: string
          max_tokens: number | null
          model: string | null
          system_prompt: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          function_name?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          function_name?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_generated_documents: {
        Row: {
          content: string | null
          created_at: string | null
          document_type: string | null
          generated_by: string | null
          id: string
          language: string | null
          matter_id: string | null
          metadata: Json | null
          model_used: string | null
          organization_id: string | null
          prompt_used: string | null
          quality_score: number | null
          status: string | null
          template_id: string | null
          title: string | null
          tokens_used: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          document_type?: string | null
          generated_by?: string | null
          id?: string
          language?: string | null
          matter_id?: string | null
          metadata?: Json | null
          model_used?: string | null
          organization_id?: string | null
          prompt_used?: string | null
          quality_score?: number | null
          status?: string | null
          template_id?: string | null
          title?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          document_type?: string | null
          generated_by?: string | null
          id?: string
          language?: string | null
          matter_id?: string | null
          metadata?: Json | null
          model_used?: string | null
          organization_id?: string | null
          prompt_used?: string | null
          quality_score?: number | null
          status?: string | null
          template_id?: string | null
          title?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      ai_glossary_terms: {
        Row: {
          context: string | null
          created_at: string | null
          definition: string | null
          id: string
          jurisdiction: string | null
          language: string | null
          legal_area: string | null
          source: string | null
          term: string | null
          updated_at: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          definition?: string | null
          id?: string
          jurisdiction?: string | null
          language?: string | null
          legal_area?: string | null
          source?: string | null
          term?: string | null
          updated_at?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          definition?: string | null
          id?: string
          jurisdiction?: string | null
          language?: string | null
          legal_area?: string | null
          source?: string | null
          term?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_kb_disclaimers: {
        Row: {
          content: string | null
          created_at: string | null
          disclaimer_type: string | null
          id: string
          is_active: boolean | null
          jurisdiction: string | null
          language: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          disclaimer_type?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction?: string | null
          language?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          disclaimer_type?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction?: string | null
          language?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_kb_jurisdictions: {
        Row: {
          content: string | null
          content_type: string | null
          country_code: string | null
          country_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string | null
          legal_area: string | null
          metadata: Json | null
          source: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          legal_area?: string | null
          metadata?: Json | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          legal_area?: string | null
          metadata?: Json | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_kb_legal_areas: {
        Row: {
          content: string | null
          content_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          jurisdiction: string | null
          language: string | null
          legal_area: string | null
          metadata: Json | null
          source: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction?: string | null
          language?: string | null
          legal_area?: string | null
          metadata?: Json | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction?: string | null
          language?: string | null
          legal_area?: string | null
          metadata?: Json | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_knowledge_base: {
        Row: {
          category: string
          chatbot_scope: string | null
          content: string
          conversion_hook: string | null
          created_at: string
          id: string
          is_active: boolean
          is_current: boolean | null
          kb_code: string | null
          keywords: string[]
          language: string | null
          priority: number | null
          retrieval_count: number | null
          search_vector: unknown
          source: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category: string
          chatbot_scope?: string | null
          content: string
          conversion_hook?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_current?: boolean | null
          kb_code?: string | null
          keywords?: string[]
          language?: string | null
          priority?: number | null
          retrieval_count?: number | null
          search_vector?: unknown
          source?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          chatbot_scope?: string | null
          content?: string
          conversion_hook?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_current?: boolean | null
          kb_code?: string | null
          keywords?: string[]
          language?: string | null
          priority?: number | null
          retrieval_count?: number | null
          search_vector?: unknown
          source?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          cost_cents: number | null
          created_at: string | null
          id: string
          input_tokens: number | null
          metadata: Json | null
          model: string | null
          output_tokens: number | null
          role: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          input_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          output_tokens?: number | null
          role?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          input_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          output_tokens?: number | null
          role?: string | null
        }
        Relationships: []
      }
      ai_model_catalog: {
        Row: {
          api_name: string | null
          context_window: number | null
          cost_per_1m_input: number | null
          cost_per_1m_output: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_output: number | null
          name: string | null
          provider: string | null
          supports_tools: boolean | null
          supports_vision: boolean | null
          tier: string | null
          updated_at: string | null
        }
        Insert: {
          api_name?: string | null
          context_window?: number | null
          cost_per_1m_input?: number | null
          cost_per_1m_output?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_output?: number | null
          name?: string | null
          provider?: string | null
          supports_tools?: boolean | null
          supports_vision?: boolean | null
          tier?: string | null
          updated_at?: string | null
        }
        Update: {
          api_name?: string | null
          context_window?: number | null
          cost_per_1m_input?: number | null
          cost_per_1m_output?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_output?: number | null
          name?: string | null
          provider?: string | null
          supports_tools?: boolean | null
          supports_vision?: boolean | null
          tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_model_prices: {
        Row: {
          cost_per_1m_input: number | null
          cost_per_1m_output: number | null
          created_at: string | null
          effective_date: string | null
          id: string
          model_id: string | null
          provider_id: string | null
          source: string | null
        }
        Insert: {
          cost_per_1m_input?: number | null
          cost_per_1m_output?: number | null
          created_at?: string | null
          effective_date?: string | null
          id?: string
          model_id?: string | null
          provider_id?: string | null
          source?: string | null
        }
        Update: {
          cost_per_1m_input?: number | null
          cost_per_1m_output?: number | null
          created_at?: string | null
          effective_date?: string | null
          id?: string
          model_id?: string | null
          provider_id?: string | null
          source?: string | null
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          capabilities: Json | null
          context_window: number | null
          cost_per_1k_input: number | null
          cost_per_1k_output: number | null
          created_at: string | null
          deprecated_at: string | null
          description: string | null
          discovered_at: string | null
          family: string | null
          id: string
          input_cost_per_1m: number | null
          is_active: boolean | null
          is_default_for_provider: boolean | null
          max_output_tokens: number | null
          model_id: string
          model_name: string | null
          name: string
          output_cost_per_1m: number | null
          price_per_million_input: number | null
          price_per_million_output: number | null
          provider_id: string | null
          quality_rating: number | null
          speed_rating: number | null
          supports_function_calling: boolean | null
          supports_vision: boolean | null
          tier: string | null
          updated_at: string | null
          use_case: string | null
        }
        Insert: {
          capabilities?: Json | null
          context_window?: number | null
          cost_per_1k_input?: number | null
          cost_per_1k_output?: number | null
          created_at?: string | null
          deprecated_at?: string | null
          description?: string | null
          discovered_at?: string | null
          family?: string | null
          id?: string
          input_cost_per_1m?: number | null
          is_active?: boolean | null
          is_default_for_provider?: boolean | null
          max_output_tokens?: number | null
          model_id: string
          model_name?: string | null
          name: string
          output_cost_per_1m?: number | null
          price_per_million_input?: number | null
          price_per_million_output?: number | null
          provider_id?: string | null
          quality_rating?: number | null
          speed_rating?: number | null
          supports_function_calling?: boolean | null
          supports_vision?: boolean | null
          tier?: string | null
          updated_at?: string | null
          use_case?: string | null
        }
        Update: {
          capabilities?: Json | null
          context_window?: number | null
          cost_per_1k_input?: number | null
          cost_per_1k_output?: number | null
          created_at?: string | null
          deprecated_at?: string | null
          description?: string | null
          discovered_at?: string | null
          family?: string | null
          id?: string
          input_cost_per_1m?: number | null
          is_active?: boolean | null
          is_default_for_provider?: boolean | null
          max_output_tokens?: number | null
          model_id?: string
          model_name?: string | null
          name?: string
          output_cost_per_1m?: number | null
          price_per_million_input?: number | null
          price_per_million_output?: number | null
          provider_id?: string | null
          quality_rating?: number | null
          speed_rating?: number | null
          supports_function_calling?: boolean | null
          supports_vision?: boolean | null
          tier?: string | null
          updated_at?: string | null
          use_case?: string | null
        }
        Relationships: []
      }
      ai_module_config: {
        Row: {
          created_at: string | null
          default_model: string | null
          description: string | null
          fallback_model: string | null
          id: string
          is_enabled: boolean | null
          max_requests_per_hour: number | null
          max_tokens: number | null
          module_key: string | null
          module_name: string | null
          system_prompt: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_model?: string | null
          description?: string | null
          fallback_model?: string | null
          id?: string
          is_enabled?: boolean | null
          max_requests_per_hour?: number | null
          max_tokens?: number | null
          module_key?: string | null
          module_name?: string | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_model?: string | null
          description?: string | null
          fallback_model?: string | null
          id?: string
          is_enabled?: boolean | null
          max_requests_per_hour?: number | null
          max_tokens?: number | null
          module_key?: string | null
          module_name?: string | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_module_usage: {
        Row: {
          cost_cents: number | null
          created_at: string | null
          id: string
          module_key: string | null
          month: number | null
          organization_id: string | null
          request_count: number | null
          tokens_used: number | null
          year: number | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          module_key?: string | null
          month?: number | null
          organization_id?: string | null
          request_count?: number | null
          tokens_used?: number | null
          year?: number | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          module_key?: string | null
          month?: number | null
          organization_id?: string | null
          request_count?: number | null
          tokens_used?: number | null
          year?: number | null
        }
        Relationships: []
      }
      ai_optimization_suggestions: {
        Row: {
          created_at: string | null
          current_cost_cents: number | null
          estimated_savings_cents: number | null
          id: string
          implemented_at: string | null
          is_implemented: boolean | null
          organization_id: string | null
          suggestion_text: string | null
          suggestion_type: string | null
        }
        Insert: {
          created_at?: string | null
          current_cost_cents?: number | null
          estimated_savings_cents?: number | null
          id?: string
          implemented_at?: string | null
          is_implemented?: boolean | null
          organization_id?: string | null
          suggestion_text?: string | null
          suggestion_type?: string | null
        }
        Update: {
          created_at?: string | null
          current_cost_cents?: number | null
          estimated_savings_cents?: number | null
          id?: string
          implemented_at?: string | null
          is_implemented?: boolean | null
          organization_id?: string | null
          suggestion_text?: string | null
          suggestion_type?: string | null
        }
        Relationships: []
      }
      ai_prompt_changes: {
        Row: {
          change_type: string | null
          changed_by: string | null
          created_at: string | null
          diff_summary: string | null
          id: string
          new_version_id: string | null
          old_version_id: string | null
          prompt_id: string | null
        }
        Insert: {
          change_type?: string | null
          changed_by?: string | null
          created_at?: string | null
          diff_summary?: string | null
          id?: string
          new_version_id?: string | null
          old_version_id?: string | null
          prompt_id?: string | null
        }
        Update: {
          change_type?: string | null
          changed_by?: string | null
          created_at?: string | null
          diff_summary?: string | null
          id?: string
          new_version_id?: string | null
          old_version_id?: string | null
          prompt_id?: string | null
        }
        Relationships: []
      }
      ai_prompt_comments: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          id: string
          prompt_id: string | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
      }
      ai_prompt_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string | null
          system_prompt: string | null
          task_type: string | null
          updated_at: string | null
          user_prompt_template: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          system_prompt?: string | null
          task_type?: string | null
          updated_at?: string | null
          user_prompt_template?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          system_prompt?: string | null
          task_type?: string | null
          updated_at?: string | null
          user_prompt_template?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      ai_prompts: {
        Row: {
          avg_cost: number | null
          avg_input_tokens: number | null
          avg_latency_ms: number | null
          avg_output_tokens: number | null
          avg_quality_score: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_latest: boolean | null
          model_code: string | null
          name: string
          output_format: string | null
          output_schema: Json | null
          parent_version_id: string | null
          published_at: string | null
          published_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_by: string | null
          submitted_for_review_at: string | null
          success_rate: number | null
          suggested_max_tokens: number | null
          suggested_temperature: number | null
          system_prompt: string | null
          task_id: string | null
          tools_enabled: boolean | null
          tools_schema: Json | null
          updated_at: string | null
          updated_by: string | null
          user_prompt_template: string
          variables: Json | null
          version: number
        }
        Insert: {
          avg_cost?: number | null
          avg_input_tokens?: number | null
          avg_latency_ms?: number | null
          avg_output_tokens?: number | null
          avg_quality_score?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_latest?: boolean | null
          model_code?: string | null
          name: string
          output_format?: string | null
          output_schema?: Json | null
          parent_version_id?: string | null
          published_at?: string | null
          published_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_by?: string | null
          submitted_for_review_at?: string | null
          success_rate?: number | null
          suggested_max_tokens?: number | null
          suggested_temperature?: number | null
          system_prompt?: string | null
          task_id?: string | null
          tools_enabled?: boolean | null
          tools_schema?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          user_prompt_template: string
          variables?: Json | null
          version?: number
        }
        Update: {
          avg_cost?: number | null
          avg_input_tokens?: number | null
          avg_latency_ms?: number | null
          avg_output_tokens?: number | null
          avg_quality_score?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_latest?: boolean | null
          model_code?: string | null
          name?: string
          output_format?: string | null
          output_schema?: Json | null
          parent_version_id?: string | null
          published_at?: string | null
          published_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_by?: string | null
          submitted_for_review_at?: string | null
          success_rate?: number | null
          suggested_max_tokens?: number | null
          suggested_temperature?: number | null
          system_prompt?: string | null
          task_id?: string | null
          tools_enabled?: boolean | null
          tools_schema?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          user_prompt_template?: string
          variables?: Json | null
          version?: number
        }
        Relationships: []
      }
      ai_provider_connections: {
        Row: {
          api_key_encrypted: string | null
          base_url: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          provider_code: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          base_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          provider_code?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          base_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          provider_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_provider_health: {
        Row: {
          avg_latency_ms: number | null
          created_at: string | null
          error_rate: number | null
          id: string
          is_healthy: boolean | null
          last_check_at: string | null
          last_error: string | null
          provider_id: string | null
          success_rate: number | null
          updated_at: string | null
        }
        Insert: {
          avg_latency_ms?: number | null
          created_at?: string | null
          error_rate?: number | null
          id?: string
          is_healthy?: boolean | null
          last_check_at?: string | null
          last_error?: string | null
          provider_id?: string | null
          success_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_latency_ms?: number | null
          created_at?: string | null
          error_rate?: number | null
          id?: string
          is_healthy?: boolean | null
          last_check_at?: string | null
          last_error?: string | null
          provider_id?: string | null
          success_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_provider_health_log: {
        Row: {
          created_at: string | null
          error_count: number | null
          id: string
          latency_p50_ms: number | null
          latency_p99_ms: number | null
          provider_id: string | null
          request_count: number | null
          success_count: number | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          id?: string
          latency_p50_ms?: number | null
          latency_p99_ms?: number | null
          provider_id?: string | null
          request_count?: number | null
          success_count?: number | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          id?: string
          latency_p50_ms?: number | null
          latency_p99_ms?: number | null
          provider_id?: string | null
          request_count?: number | null
          success_count?: number | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      ai_providers: {
        Row: {
          api_key_encrypted: string | null
          base_url: string | null
          category: string | null
          circuit_open: boolean | null
          code: string
          config: Json | null
          consecutive_failures: number | null
          created_at: string
          description: string | null
          health_latency_ms: number | null
          health_status: string | null
          id: string
          is_gateway: boolean | null
          last_health_check_at: string | null
          logo_url: string | null
          name: string
          status: string
          supports_chat: boolean | null
          supports_embeddings: boolean | null
          supports_tools: boolean | null
          supports_vision: boolean | null
          updated_at: string
          website: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          base_url?: string | null
          category?: string | null
          circuit_open?: boolean | null
          code: string
          config?: Json | null
          consecutive_failures?: number | null
          created_at?: string
          description?: string | null
          health_latency_ms?: number | null
          health_status?: string | null
          id?: string
          is_gateway?: boolean | null
          last_health_check_at?: string | null
          logo_url?: string | null
          name: string
          status?: string
          supports_chat?: boolean | null
          supports_embeddings?: boolean | null
          supports_tools?: boolean | null
          supports_vision?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          base_url?: string | null
          category?: string | null
          circuit_open?: boolean | null
          code?: string
          config?: Json | null
          consecutive_failures?: number | null
          created_at?: string
          description?: string | null
          health_latency_ms?: number | null
          health_status?: string | null
          id?: string
          is_gateway?: boolean | null
          last_health_check_at?: string | null
          logo_url?: string | null
          name?: string
          status?: string
          supports_chat?: boolean | null
          supports_embeddings?: boolean | null
          supports_tools?: boolean | null
          supports_vision?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      ai_quality_evaluations: {
        Row: {
          created_at: string | null
          evaluated_by: string | null
          evaluation_criteria: Json | null
          execution_id: string | null
          feedback: string | null
          id: string
          overall_score: number | null
          prompt_id: string | null
        }
        Insert: {
          created_at?: string | null
          evaluated_by?: string | null
          evaluation_criteria?: Json | null
          execution_id?: string | null
          feedback?: string | null
          id?: string
          overall_score?: number | null
          prompt_id?: string | null
        }
        Update: {
          created_at?: string | null
          evaluated_by?: string | null
          evaluation_criteria?: Json | null
          execution_id?: string | null
          feedback?: string | null
          id?: string
          overall_score?: number | null
          prompt_id?: string | null
        }
        Relationships: []
      }
      ai_rag_collections: {
        Row: {
          chunk_count: number | null
          created_at: string | null
          description: string | null
          embedding_model: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string | null
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string | null
          description?: string | null
          embedding_model?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chunk_count?: number | null
          created_at?: string | null
          description?: string | null
          embedding_model?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_rate_limits: {
        Row: {
          cooldown_until: string | null
          created_at: string | null
          current_count: number | null
          id: string
          limit_type: string | null
          max_count: number | null
          organization_id: string | null
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          cooldown_until?: string | null
          created_at?: string | null
          current_count?: number | null
          id?: string
          limit_type?: string | null
          max_count?: number | null
          organization_id?: string | null
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          cooldown_until?: string | null
          created_at?: string | null
          current_count?: number | null
          id?: string
          limit_type?: string | null
          max_count?: number | null
          organization_id?: string | null
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      ai_request_logs: {
        Row: {
          cost_cents: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_tokens: number | null
          model_id: string | null
          organization_id: string | null
          output_tokens: number | null
          prompt_id: string | null
          provider_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          model_id?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          prompt_id?: string | null
          provider_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          model_id?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          prompt_id?: string | null
          provider_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_research_reports: {
        Row: {
          content: string | null
          country_code: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          model_used: string | null
          report_type: string | null
          sources: Json | null
          status: string | null
          title: string | null
          tokens_used: number | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          report_type?: string | null
          sources?: Json | null
          status?: string | null
          title?: string | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          report_type?: string | null
          sources?: Json | null
          status?: string | null
          title?: string | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_task_assignments: {
        Row: {
          created_at: string | null
          fallback_model_id: string | null
          id: string
          max_tokens: number | null
          primary_model_id: string | null
          task_id: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fallback_model_id?: string | null
          id?: string
          max_tokens?: number | null
          primary_model_id?: string | null
          task_id?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fallback_model_id?: string | null
          id?: string
          max_tokens?: number | null
          primary_model_id?: string | null
          task_id?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_task_rag_config: {
        Row: {
          chunk_overlap: number | null
          chunk_size: number | null
          collection_id: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          max_chunks: number | null
          similarity_threshold: number | null
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          chunk_overlap?: number | null
          chunk_size?: number | null
          collection_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          max_chunks?: number | null
          similarity_threshold?: number | null
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chunk_overlap?: number | null
          chunk_size?: number | null
          collection_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          max_chunks?: number | null
          similarity_threshold?: number | null
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_tasks: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          module: string | null
          name: string | null
          primary_model: string | null
          primary_provider: string | null
          priority: number | null
          task_code: string | null
          task_id: string | null
          task_name: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          module?: string | null
          name?: string | null
          primary_model?: string | null
          primary_provider?: string | null
          priority?: number | null
          task_code?: string | null
          task_id?: string | null
          task_name?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          module?: string | null
          name?: string | null
          primary_model?: string | null
          primary_provider?: string | null
          priority?: number | null
          task_code?: string | null
          task_id?: string | null
          task_name?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_test_cases: {
        Row: {
          created_at: string | null
          expected_output: string | null
          id: string
          input_variables: Json | null
          is_active: boolean | null
          name: string | null
          suite_id: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          expected_output?: string | null
          id?: string
          input_variables?: Json | null
          is_active?: boolean | null
          name?: string | null
          suite_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          expected_output?: string | null
          id?: string
          input_variables?: Json | null
          is_active?: boolean | null
          name?: string | null
          suite_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      ai_test_results: {
        Row: {
          actual_output: string | null
          cost_cents: number | null
          created_at: string | null
          duration_ms: number | null
          id: string
          model_used: string | null
          passed: boolean | null
          prompt_version_id: string | null
          quality_score: number | null
          run_id: string | null
          test_case_id: string | null
        }
        Insert: {
          actual_output?: string | null
          cost_cents?: number | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          model_used?: string | null
          passed?: boolean | null
          prompt_version_id?: string | null
          quality_score?: number | null
          run_id?: string | null
          test_case_id?: string | null
        }
        Update: {
          actual_output?: string | null
          cost_cents?: number | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          model_used?: string | null
          passed?: boolean | null
          prompt_version_id?: string | null
          quality_score?: number | null
          run_id?: string | null
          test_case_id?: string | null
        }
        Relationships: []
      }
      ai_test_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          passed_count: number | null
          prompt_version_id: string | null
          status: string | null
          suite_id: string | null
          total_count: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          passed_count?: number | null
          prompt_version_id?: string | null
          status?: string | null
          suite_id?: string | null
          total_count?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          passed_count?: number | null
          prompt_version_id?: string | null
          status?: string | null
          suite_id?: string | null
          total_count?: number | null
        }
        Relationships: []
      }
      ai_test_suites: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_required_for_publish: boolean | null
          name: string | null
          pass_threshold: number | null
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required_for_publish?: boolean | null
          name?: string | null
          pass_threshold?: number | null
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required_for_publish?: boolean | null
          name?: string | null
          pass_threshold?: number | null
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_tier_quotas: {
        Row: {
          allowed_models: string[] | null
          created_at: string | null
          features: Json | null
          id: string
          max_context_tokens: number | null
          monthly_requests: number | null
          monthly_tokens: number | null
          tier: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_models?: string[] | null
          created_at?: string | null
          features?: Json | null
          id?: string
          max_context_tokens?: number | null
          monthly_requests?: number | null
          monthly_tokens?: number | null
          tier?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_models?: string[] | null
          created_at?: string | null
          features?: Json | null
          id?: string
          max_context_tokens?: number | null
          monthly_requests?: number | null
          monthly_tokens?: number | null
          tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_transaction_ledger: {
        Row: {
          billable_amount: number | null
          billing_strategy: string | null
          client_id: string | null
          cost_input: number | null
          cost_output: number | null
          cost_total: number | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          input_tokens: number | null
          is_billable: boolean | null
          jurisdiction_code: string | null
          latency_ms: number | null
          markup_percent: number | null
          matter_id: string | null
          model_code: string | null
          model_id: string | null
          module: string | null
          organization_id: string | null
          output_tokens: number | null
          provider_id: string | null
          routing_reason: string | null
          routing_rule_id: string | null
          session_id: string | null
          status: string | null
          task_type: string | null
          total_tokens: number | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billable_amount?: number | null
          billing_strategy?: string | null
          client_id?: string | null
          cost_input?: number | null
          cost_output?: number | null
          cost_total?: number | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          is_billable?: boolean | null
          jurisdiction_code?: string | null
          latency_ms?: number | null
          markup_percent?: number | null
          matter_id?: string | null
          model_code?: string | null
          model_id?: string | null
          module?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          provider_id?: string | null
          routing_reason?: string | null
          routing_rule_id?: string | null
          session_id?: string | null
          status?: string | null
          task_type?: string | null
          total_tokens?: number | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billable_amount?: number | null
          billing_strategy?: string | null
          client_id?: string | null
          cost_input?: number | null
          cost_output?: number | null
          cost_total?: number | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          is_billable?: boolean | null
          jurisdiction_code?: string | null
          latency_ms?: number | null
          markup_percent?: number | null
          matter_id?: string | null
          model_code?: string | null
          model_id?: string | null
          module?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          provider_id?: string | null
          routing_reason?: string | null
          routing_rule_id?: string | null
          session_id?: string | null
          status?: string | null
          task_type?: string | null
          total_tokens?: number | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_translation_glossaries: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          is_official: boolean | null
          is_public: boolean | null
          name: string | null
          organization_id: string | null
          source_language: string | null
          target_language: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_official?: boolean | null
          is_public?: boolean | null
          name?: string | null
          organization_id?: string | null
          source_language?: string | null
          target_language?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_official?: boolean | null
          is_public?: boolean | null
          name?: string | null
          organization_id?: string | null
          source_language?: string | null
          target_language?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_translations: {
        Row: {
          character_count: number | null
          completed_at: string | null
          confidence_score: number | null
          created_at: string | null
          disclaimer_accepted: boolean | null
          disclaimer_accepted_at: string | null
          document_type: string | null
          glossary_id: string | null
          id: string
          organization_id: string | null
          processing_time_ms: number | null
          source_language: string | null
          source_text: string | null
          status: string | null
          target_language: string | null
          terms_used: Json | null
          translated_text: string | null
          user_id: string | null
          word_count: number | null
        }
        Insert: {
          character_count?: number | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          disclaimer_accepted?: boolean | null
          disclaimer_accepted_at?: string | null
          document_type?: string | null
          glossary_id?: string | null
          id?: string
          organization_id?: string | null
          processing_time_ms?: number | null
          source_language?: string | null
          source_text?: string | null
          status?: string | null
          target_language?: string | null
          terms_used?: Json | null
          translated_text?: string | null
          user_id?: string | null
          word_count?: number | null
        }
        Update: {
          character_count?: number | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          disclaimer_accepted?: boolean | null
          disclaimer_accepted_at?: string | null
          document_type?: string | null
          glossary_id?: string | null
          id?: string
          organization_id?: string | null
          processing_time_ms?: number | null
          source_language?: string | null
          source_text?: string | null
          status?: string | null
          target_language?: string | null
          terms_used?: Json | null
          translated_text?: string | null
          user_id?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          chat_messages: number | null
          created_at: string | null
          document_analyses: number | null
          document_generations: number | null
          estimated_cost_cents: number | null
          id: string
          messages_count: number | null
          organization_id: string
          period_end: string
          period_start: string
          tokens_input: number | null
          tokens_output: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_messages?: number | null
          created_at?: string | null
          document_analyses?: number | null
          document_generations?: number | null
          estimated_cost_cents?: number | null
          id?: string
          messages_count?: number | null
          organization_id: string
          period_end: string
          period_start: string
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_messages?: number | null
          created_at?: string | null
          document_analyses?: number | null
          document_generations?: number | null
          estimated_cost_cents?: number | null
          id?: string
          messages_count?: number | null
          organization_id?: string
          period_end?: string
          period_start?: string
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_aggregates: {
        Row: {
          avg_latency_ms: number | null
          by_model: Json | null
          by_task: Json | null
          created_at: string | null
          failed_requests: number | null
          id: string
          organization_id: string | null
          p50_latency_ms: number | null
          p95_latency_ms: number | null
          p99_latency_ms: number | null
          period_end: string | null
          period_start: string | null
          period_type: string | null
          successful_requests: number | null
          total_cost_usd: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_requests: number | null
          updated_at: string | null
        }
        Insert: {
          avg_latency_ms?: number | null
          by_model?: Json | null
          by_task?: Json | null
          created_at?: string | null
          failed_requests?: number | null
          id?: string
          organization_id?: string | null
          p50_latency_ms?: number | null
          p95_latency_ms?: number | null
          p99_latency_ms?: number | null
          period_end?: string | null
          period_start?: string | null
          period_type?: string | null
          successful_requests?: number | null
          total_cost_usd?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_latency_ms?: number | null
          by_model?: Json | null
          by_task?: Json | null
          created_at?: string | null
          failed_requests?: number | null
          id?: string
          organization_id?: string | null
          p50_latency_ms?: number | null
          p95_latency_ms?: number | null
          p99_latency_ms?: number | null
          period_end?: string | null
          period_start?: string | null
          period_type?: string | null
          successful_requests?: number | null
          total_cost_usd?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_events: {
        Row: {
          conversation_id: string | null
          cost_usd: number | null
          created_at: string | null
          id: string
          input_tokens: number | null
          jurisdiction_code: string | null
          kb_chunks_used: string[] | null
          matter_id: string | null
          model_used: string | null
          module: string | null
          operation_type: string | null
          organization_id: string | null
          output_tokens: number | null
          query_hash: string | null
          response_quality: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          input_tokens?: number | null
          jurisdiction_code?: string | null
          kb_chunks_used?: string[] | null
          matter_id?: string | null
          model_used?: string | null
          module?: string | null
          operation_type?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          query_hash?: string | null
          response_quality?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          input_tokens?: number | null
          jurisdiction_code?: string | null
          kb_chunks_used?: string[] | null
          matter_id?: string | null
          model_used?: string | null
          module?: string | null
          operation_type?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          query_hash?: string | null
          response_quality?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          cache_read_tokens: number | null
          cache_write_tokens: number | null
          chat_message_id: string | null
          chat_session_id: string | null
          computer_use_steps: number | null
          context_id: string | null
          context_type: string | null
          cost_cache_read_usd: number | null
          cost_cache_write_usd: number | null
          cost_computer_use_usd: number | null
          cost_input_usd: number | null
          cost_output_usd: number | null
          cost_total_cents: number | null
          cost_total_usd: number | null
          cost_web_search_usd: number | null
          created_at: string | null
          function_name: string | null
          had_retry: boolean | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model_id: string | null
          output_tokens: number | null
          processing_ms: number | null
          prompt_efficiency_score: number | null
          provider: string | null
          provider_code: string | null
          retry_count: number | null
          status: string | null
          stop_reason: string | null
          success: boolean | null
          task_category: string | null
          task_subcategory: string | null
          tokens_input: number | null
          tokens_output: number | null
          user_id: string | null
          web_search_calls: number | null
        }
        Insert: {
          cache_read_tokens?: number | null
          cache_write_tokens?: number | null
          chat_message_id?: string | null
          chat_session_id?: string | null
          computer_use_steps?: number | null
          context_id?: string | null
          context_type?: string | null
          cost_cache_read_usd?: number | null
          cost_cache_write_usd?: number | null
          cost_computer_use_usd?: number | null
          cost_input_usd?: number | null
          cost_output_usd?: number | null
          cost_total_cents?: number | null
          cost_total_usd?: number | null
          cost_web_search_usd?: number | null
          created_at?: string | null
          function_name?: string | null
          had_retry?: boolean | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model_id?: string | null
          output_tokens?: number | null
          processing_ms?: number | null
          prompt_efficiency_score?: number | null
          provider?: string | null
          provider_code?: string | null
          retry_count?: number | null
          status?: string | null
          stop_reason?: string | null
          success?: boolean | null
          task_category?: string | null
          task_subcategory?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
          web_search_calls?: number | null
        }
        Update: {
          cache_read_tokens?: number | null
          cache_write_tokens?: number | null
          chat_message_id?: string | null
          chat_session_id?: string | null
          computer_use_steps?: number | null
          context_id?: string | null
          context_type?: string | null
          cost_cache_read_usd?: number | null
          cost_cache_write_usd?: number | null
          cost_computer_use_usd?: number | null
          cost_input_usd?: number | null
          cost_output_usd?: number | null
          cost_total_cents?: number | null
          cost_total_usd?: number | null
          cost_web_search_usd?: number | null
          created_at?: string | null
          function_name?: string | null
          had_retry?: boolean | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model_id?: string | null
          output_tokens?: number | null
          processing_ms?: number | null
          prompt_efficiency_score?: number | null
          provider?: string | null
          provider_code?: string | null
          retry_count?: number | null
          status?: string | null
          stop_reason?: string | null
          success?: boolean | null
          task_category?: string | null
          task_subcategory?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
          web_search_calls?: number | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          chat_message_id: string | null
          chat_session_id: string | null
          cost_total_cents: number | null
          created_at: string | null
          id: string
          latency_ms: number | null
          model_id: string | null
          provider_code: string | null
          status: string | null
          task_category: string | null
          tokens_input: number | null
          tokens_output: number | null
          user_id: string | null
        }
        Insert: {
          chat_message_id?: string | null
          chat_session_id?: string | null
          cost_total_cents?: number | null
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          model_id?: string | null
          provider_code?: string | null
          status?: string | null
          task_category?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
        }
        Update: {
          chat_message_id?: string | null
          chat_session_id?: string | null
          cost_total_cents?: number | null
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          model_id?: string | null
          provider_code?: string | null
          status?: string | null
          task_category?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_usage_monthly: {
        Row: {
          id: string
          organization_id: string | null
          period_end: string | null
          period_start: string | null
          total_agent_runs: number | null
          total_analyses: number | null
          total_cost_usd: number | null
          total_generations: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_queries: number | null
          total_tokens: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          total_agent_runs?: number | null
          total_analyses?: number | null
          total_cost_usd?: number | null
          total_generations?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
          total_queries?: number | null
          total_tokens?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          total_agent_runs?: number | null
          total_analyses?: number | null
          total_cost_usd?: number | null
          total_generations?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
          total_queries?: number | null
          total_tokens?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alert_configurations: {
        Row: {
          alert_type: string
          analyze_frequency: string | null
          auto_analyze_enabled: boolean | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_analyzed_at: string | null
          min_confidence: number | null
          min_severity: string | null
          notify_email: boolean | null
          notify_in_app: boolean | null
          notify_matter_owner: boolean | null
          notify_roles: string[] | null
          notify_slack: boolean | null
          organization_id: string
          slack_webhook_url: string | null
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          analyze_frequency?: string | null
          auto_analyze_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_analyzed_at?: string | null
          min_confidence?: number | null
          min_severity?: string | null
          notify_email?: boolean | null
          notify_in_app?: boolean | null
          notify_matter_owner?: boolean | null
          notify_roles?: string[] | null
          notify_slack?: boolean | null
          organization_id: string
          slack_webhook_url?: string | null
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          analyze_frequency?: string | null
          auto_analyze_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_analyzed_at?: string | null
          min_confidence?: number | null
          min_severity?: string | null
          notify_email?: boolean | null
          notify_in_app?: boolean | null
          notify_matter_owner?: boolean | null
          notify_roles?: string[] | null
          notify_slack?: boolean | null
          organization_id?: string
          slack_webhook_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alert_types: {
        Row: {
          code: string
          created_at: string | null
          default_priority: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          default_priority?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          default_priority?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          browser: string | null
          country_code: string | null
          created_at: string | null
          device_type: string | null
          event_category: string
          event_date: string | null
          event_name: string
          id: string
          organization_id: string | null
          os: string | null
          page_path: string | null
          page_title: string | null
          page_url: string | null
          properties: Json | null
          referrer: string | null
          region: string | null
          screen_resolution: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          country_code?: string | null
          created_at?: string | null
          device_type?: string | null
          event_category: string
          event_date?: string | null
          event_name: string
          id?: string
          organization_id?: string | null
          os?: string | null
          page_path?: string | null
          page_title?: string | null
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          country_code?: string | null
          created_at?: string | null
          device_type?: string | null
          event_category?: string
          event_date?: string | null
          event_name?: string
          id?: string
          organization_id?: string | null
          os?: string | null
          page_path?: string | null
          page_title?: string | null
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      api_connections: {
        Row: {
          config: Json | null
          created_at: string | null
          credentials: Json | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_sync_at: string | null
          organization_id: string | null
          provider: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          organization_id?: string | null
          provider?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          organization_id?: string | null
          provider?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          allowed_ips: Json | null
          allowed_origins: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string | null
          key_prefix: string | null
          last_used_at: string | null
          name: string | null
          organization_id: string | null
          rate_limit_per_day: number | null
          rate_limit_per_minute: number | null
          scopes: Json | null
        }
        Insert: {
          allowed_ips?: Json | null
          allowed_origins?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string | null
          key_prefix?: string | null
          last_used_at?: string | null
          name?: string | null
          organization_id?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          scopes?: Json | null
        }
        Update: {
          allowed_ips?: Json | null
          allowed_origins?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string | null
          key_prefix?: string | null
          last_used_at?: string | null
          name?: string | null
          organization_id?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          scopes?: Json | null
        }
        Relationships: []
      }
      api_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          endpoint: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          method: string | null
          organization_id: string | null
          query_params: Json | null
          request_body: Json | null
          response_size_bytes: number | null
          response_time_ms: number | null
          status_code: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string | null
          organization_id?: string | null
          query_params?: Json | null
          request_body?: Json | null
          response_size_bytes?: number | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string | null
          organization_id?: string | null
          query_params?: Json | null
          request_body?: Json | null
          response_size_bytes?: number | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          created_at: string | null
          current_count: number | null
          id: string
          identifier: string | null
          limit_count: number | null
          organization_id: string | null
          reset_at: string | null
          updated_at: string | null
          window_type: string | null
        }
        Insert: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          identifier?: string | null
          limit_count?: number | null
          organization_id?: string | null
          reset_at?: string | null
          updated_at?: string | null
          window_type?: string | null
        }
        Update: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          identifier?: string | null
          limit_count?: number | null
          organization_id?: string | null
          reset_at?: string | null
          updated_at?: string | null
          window_type?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_job_items: {
        Row: {
          applied_at: string | null
          auto_approved_count: number | null
          batch_job_id: string
          created_at: string | null
          custom_id: string
          error_message: string | null
          extracted_fees: Json | null
          id: string
          input_tokens: number | null
          ipo_office_id: string
          item_cost_usd: number | null
          needs_review_count: number | null
          output_tokens: number | null
          raw_response: Json | null
          rejected_count: number | null
          request_prompt: string | null
          status: string
          updated_at: string | null
          validation_results: Json | null
        }
        Insert: {
          applied_at?: string | null
          auto_approved_count?: number | null
          batch_job_id: string
          created_at?: string | null
          custom_id: string
          error_message?: string | null
          extracted_fees?: Json | null
          id?: string
          input_tokens?: number | null
          ipo_office_id: string
          item_cost_usd?: number | null
          needs_review_count?: number | null
          output_tokens?: number | null
          raw_response?: Json | null
          rejected_count?: number | null
          request_prompt?: string | null
          status?: string
          updated_at?: string | null
          validation_results?: Json | null
        }
        Update: {
          applied_at?: string | null
          auto_approved_count?: number | null
          batch_job_id?: string
          created_at?: string | null
          custom_id?: string
          error_message?: string | null
          extracted_fees?: Json | null
          id?: string
          input_tokens?: number | null
          ipo_office_id?: string
          item_cost_usd?: number | null
          needs_review_count?: number | null
          output_tokens?: number | null
          raw_response?: Json | null
          rejected_count?: number | null
          request_prompt?: string | null
          status?: string
          updated_at?: string | null
          validation_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_job_items_batch_job_id_fkey"
            columns: ["batch_job_id"]
            isOneToOne: false
            referencedRelation: "batch_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_job_items_ipo_office_id_fkey"
            columns: ["ipo_office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_jobs: {
        Row: {
          actual_cost_usd: number | null
          anthropic_batch_id: string | null
          canceled_count: number | null
          cost_without_batch_usd: number | null
          created_at: string | null
          ended_at: string | null
          errored_count: number | null
          estimated_completion: string | null
          estimated_cost_usd: number | null
          expired_count: number | null
          id: string
          model_id: string | null
          notes: string | null
          prepared_at: string | null
          region_code: string
          results_processed_at: string | null
          results_url: string | null
          savings_usd: number | null
          status: string
          submitted_at: string | null
          succeeded_count: number | null
          total_requests: number | null
          updated_at: string | null
        }
        Insert: {
          actual_cost_usd?: number | null
          anthropic_batch_id?: string | null
          canceled_count?: number | null
          cost_without_batch_usd?: number | null
          created_at?: string | null
          ended_at?: string | null
          errored_count?: number | null
          estimated_completion?: string | null
          estimated_cost_usd?: number | null
          expired_count?: number | null
          id?: string
          model_id?: string | null
          notes?: string | null
          prepared_at?: string | null
          region_code: string
          results_processed_at?: string | null
          results_url?: string | null
          savings_usd?: number | null
          status?: string
          submitted_at?: string | null
          succeeded_count?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_cost_usd?: number | null
          anthropic_batch_id?: string | null
          canceled_count?: number | null
          cost_without_batch_usd?: number | null
          created_at?: string | null
          ended_at?: string | null
          errored_count?: number | null
          estimated_completion?: string | null
          estimated_cost_usd?: number | null
          expired_count?: number | null
          id?: string
          model_id?: string | null
          notes?: string | null
          prepared_at?: string | null
          region_code?: string
          results_processed_at?: string | null
          results_url?: string | null
          savings_usd?: number | null
          status?: string
          submitted_at?: string | null
          succeeded_count?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      billing_addons: {
        Row: {
          adds_genius_queries_monthly: number | null
          adds_jurisdictions: number | null
          adds_spider_alerts_monthly: number | null
          adds_storage_gb: number | null
          adds_users: number | null
          category: string
          code: string
          color_hex: string | null
          compatible_plan_codes: string[] | null
          created_at: string | null
          description_es: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          is_standalone: boolean | null
          jurisdiction_codes: string[] | null
          module_code: string | null
          name_en: string
          name_es: string
          price_annual_eur: number
          price_monthly_eur: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          adds_genius_queries_monthly?: number | null
          adds_jurisdictions?: number | null
          adds_spider_alerts_monthly?: number | null
          adds_storage_gb?: number | null
          adds_users?: number | null
          category: string
          code: string
          color_hex?: string | null
          compatible_plan_codes?: string[] | null
          created_at?: string | null
          description_es?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_standalone?: boolean | null
          jurisdiction_codes?: string[] | null
          module_code?: string | null
          name_en: string
          name_es: string
          price_annual_eur?: number
          price_monthly_eur?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          adds_genius_queries_monthly?: number | null
          adds_jurisdictions?: number | null
          adds_spider_alerts_monthly?: number | null
          adds_storage_gb?: number | null
          adds_users?: number | null
          category?: string
          code?: string
          color_hex?: string | null
          compatible_plan_codes?: string[] | null
          created_at?: string | null
          description_es?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_standalone?: boolean | null
          jurisdiction_codes?: string[] | null
          module_code?: string | null
          name_en?: string
          name_es?: string
          price_annual_eur?: number
          price_monthly_eur?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      billing_plan_history: {
        Row: {
          change_type: string
          changed_by_user_id: string | null
          created_at: string | null
          id: string
          new_state: Json | null
          notes: string | null
          organization_id: string
          previous_state: Json | null
        }
        Insert: {
          change_type: string
          changed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          new_state?: Json | null
          notes?: string | null
          organization_id: string
          previous_state?: Json | null
        }
        Update: {
          change_type?: string
          changed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          new_state?: Json | null
          notes?: string | null
          organization_id?: string
          previous_state?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_plan_history_changed_by_user_id_fkey"
            columns: ["changed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_plan_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          annual_discount_pct: number | null
          code: string
          created_at: string | null
          description_es: string | null
          highlight_color_hex: string | null
          highlight_label: string | null
          id: string
          included_modules: string[]
          is_active: boolean | null
          is_visible_pricing: boolean | null
          limit_contacts: number
          limit_genius_queries_monthly: number
          limit_jurisdictions_docket: number
          limit_matters: number
          limit_spider_alerts_monthly: number
          limit_storage_gb: number
          limit_users: number
          name_en: string
          name_es: string
          price_annual_eur: number
          price_monthly_eur: number
          sort_order: number | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          annual_discount_pct?: number | null
          code: string
          created_at?: string | null
          description_es?: string | null
          highlight_color_hex?: string | null
          highlight_label?: string | null
          id?: string
          included_modules?: string[]
          is_active?: boolean | null
          is_visible_pricing?: boolean | null
          limit_contacts?: number
          limit_genius_queries_monthly?: number
          limit_jurisdictions_docket?: number
          limit_matters?: number
          limit_spider_alerts_monthly?: number
          limit_storage_gb?: number
          limit_users?: number
          name_en: string
          name_es: string
          price_annual_eur?: number
          price_monthly_eur?: number
          sort_order?: number | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          annual_discount_pct?: number | null
          code?: string
          created_at?: string | null
          description_es?: string | null
          highlight_color_hex?: string | null
          highlight_label?: string | null
          id?: string
          included_modules?: string[]
          is_active?: boolean | null
          is_visible_pricing?: boolean | null
          limit_contacts?: number
          limit_genius_queries_monthly?: number
          limit_jurisdictions_docket?: number
          limit_matters?: number
          limit_spider_alerts_monthly?: number
          limit_storage_gb?: number
          limit_users?: number
          name_en?: string
          name_es?: string
          price_annual_eur?: number
          price_monthly_eur?: number
          sort_order?: number | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bug_report_replies: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_internal: boolean | null
          report_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          report_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          report_id?: string | null
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          assigned_to: string | null
          browser: string | null
          component: string | null
          created_at: string | null
          description: string | null
          environment: string | null
          id: string
          os: string | null
          priority: string | null
          reported_by: string | null
          resolution: string | null
          resolved_at: string | null
          screenshots: string[] | null
          severity: string | null
          status: string | null
          steps_to_reproduce: string | null
          title: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          assigned_to?: string | null
          browser?: string | null
          component?: string | null
          created_at?: string | null
          description?: string | null
          environment?: string | null
          id?: string
          os?: string | null
          priority?: string | null
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          screenshots?: string[] | null
          severity?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          assigned_to?: string | null
          browser?: string | null
          component?: string | null
          created_at?: string | null
          description?: string | null
          environment?: string | null
          id?: string
          os?: string | null
          priority?: string | null
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          screenshots?: string[] | null
          severity?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          attendees: Json | null
          color: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_at: string | null
          event_type: string | null
          id: string
          location: string | null
          matter_id: string | null
          organization_id: string
          recurrence_rule: string | null
          reminder_minutes: number | null
          start_at: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          attendees?: Json | null
          color?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          matter_id?: string | null
          organization_id: string
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          start_at: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          attendees?: Json | null
          color?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          matter_id?: string | null
          organization_id?: string
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          start_at?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      classification_sync_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          edition: string | null
          id: string
          items_added: number | null
          items_removed: number | null
          items_updated: number | null
          source: string | null
          status: string | null
          system: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          edition?: string | null
          id?: string
          items_added?: number | null
          items_removed?: number | null
          items_updated?: number | null
          source?: string | null
          status?: string | null
          system?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          edition?: string | null
          id?: string
          items_added?: number | null
          items_removed?: number | null
          items_updated?: number | null
          source?: string | null
          status?: string | null
          system?: string | null
        }
        Relationships: []
      }
      classification_systems: {
        Row: {
          created_at: string | null
          current_edition: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string | null
          source_url: string | null
          system_code: string | null
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_edition?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          source_url?: string | null
          system_code?: string | null
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_edition?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          source_url?: string | null
          system_code?: string | null
          total_items?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_ai_billing_rules: {
        Row: {
          ai_feature: string | null
          billing_type: string | null
          client_id: string | null
          created_at: string | null
          id: string
          is_billable: boolean | null
          markup_percent: number | null
          max_monthly_amount: number | null
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_feature?: string | null
          billing_type?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_billable?: boolean | null
          markup_percent?: number | null
          max_monthly_amount?: number | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_feature?: string | null
          billing_type?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_billable?: boolean | null
          markup_percent?: number | null
          max_monthly_amount?: number | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          organization_id: string | null
          role: string | null
        }
        Insert: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          organization_id?: string | null
          role?: string | null
        }
        Update: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          organization_id?: string | null
          role?: string | null
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          doc_type: string | null
          doc_type_confidence: number | null
          doc_type_verified: boolean | null
          embedding_status: string | null
          file_hash: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          matter_id: string | null
          mime_type: string | null
          ner_completed_at: string | null
          ner_model: string | null
          ner_status: string | null
          notes: string | null
          ocr_completed_at: string | null
          ocr_confidence: number | null
          ocr_text: string | null
          organization_id: string
          parent_document_id: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          uploaded_by: string | null
          valid_from: string | null
          valid_until: string | null
          validity_status: string | null
          validity_verified: boolean | null
          validity_verified_at: string | null
          validity_verified_by: string | null
          version: number | null
          visible_in_portal: boolean | null
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          doc_type?: string | null
          doc_type_confidence?: number | null
          doc_type_verified?: boolean | null
          embedding_status?: string | null
          file_hash?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          matter_id?: string | null
          mime_type?: string | null
          ner_completed_at?: string | null
          ner_model?: string | null
          ner_status?: string | null
          notes?: string | null
          ocr_completed_at?: string | null
          ocr_confidence?: number | null
          ocr_text?: string | null
          organization_id: string
          parent_document_id?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          validity_status?: string | null
          validity_verified?: boolean | null
          validity_verified_at?: string | null
          validity_verified_by?: string | null
          version?: number | null
          visible_in_portal?: boolean | null
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          doc_type?: string | null
          doc_type_confidence?: number | null
          doc_type_verified?: boolean | null
          embedding_status?: string | null
          file_hash?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          matter_id?: string | null
          mime_type?: string | null
          ner_completed_at?: string | null
          ner_model?: string | null
          ner_status?: string | null
          notes?: string | null
          ocr_completed_at?: string | null
          ocr_confidence?: number | null
          ocr_text?: string | null
          organization_id?: string
          parent_document_id?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          validity_status?: string | null
          validity_verified?: boolean | null
          validity_verified_at?: string | null
          validity_verified_by?: string | null
          version?: number | null
          visible_in_portal?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_folder_documents: {
        Row: {
          client_id: string | null
          created_at: string | null
          document_id: string | null
          folder_id: string | null
          id: string
          organization_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          document_id?: string | null
          folder_id?: string | null
          id?: string
          organization_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          document_id?: string | null
          folder_id?: string | null
          id?: string
          organization_id?: string | null
        }
        Relationships: []
      }
      client_folders: {
        Row: {
          client_id: string | null
          color: string | null
          created_at: string | null
          description: string | null
          documents_count: number | null
          folder_type: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string | null
          organization_id: string | null
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          documents_count?: number | null
          folder_type?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string | null
          organization_id?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          documents_count?: number | null
          folder_type?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string | null
          organization_id?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_holders: {
        Row: {
          client_id: string | null
          created_at: string | null
          holder_id: string | null
          id: string
          is_primary: boolean | null
          organization_id: string | null
          relationship_type: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          holder_id?: string | null
          id?: string
          is_primary?: boolean | null
          organization_id?: string | null
          relationship_type?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          holder_id?: string | null
          id?: string
          is_primary?: boolean | null
          organization_id?: string | null
          relationship_type?: string | null
        }
        Relationships: []
      }
      client_lookup_public: {
        Row: {
          city: string | null
          client_number: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          city?: string | null
          client_number?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          city?: string | null
          client_number?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      client_relationships: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_primary: boolean | null
          metadata: Json | null
          organization_id: string
          related_client_id: string
          relationship_type: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          organization_id: string
          related_client_id: string
          relationship_type: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          organization_id?: string
          related_client_id?: string
          relationship_type?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_relationships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_relationships_related_client_id_fkey"
            columns: ["related_client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tag_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string | null
          organization_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string | null
          organization_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string | null
          organization_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_tag_config: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string | null
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_tags: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          tag_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          tag_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          tag_id?: string | null
        }
        Relationships: []
      }
      client_type_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string | null
          organization_id: string | null
          type_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          type_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          type_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          client_number: string | null
          client_type: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          postal_code: string | null
          preferred_language: string | null
          rating: number | null
          source: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          tax_id: string | null
          type: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_number?: string | null
          client_type?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          rating?: number | null
          source?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          tax_id?: string | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          client_number?: string | null
          client_type?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          rating?: number | null
          source?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          tax_id?: string | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      comm_events: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          message_id: string | null
          occurred_at: string | null
          organization_id: string
          provider_event_id: string | null
          thread_id: string | null
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          message_id?: string | null
          occurred_at?: string | null
          organization_id: string
          provider_event_id?: string | null
          thread_id?: string | null
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          message_id?: string | null
          occurred_at?: string | null
          organization_id?: string
          provider_event_id?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "comm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "comm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_identity_map: {
        Row: {
          created_at: string | null
          crm_account_id: string | null
          crm_contact_id: string | null
          email_addresses: string[] | null
          id: string
          organization_id: string
          phone_numbers: string[] | null
          resolution_method: string | null
          updated_at: string | null
          whatsapp_ids: string[] | null
        }
        Insert: {
          created_at?: string | null
          crm_account_id?: string | null
          crm_contact_id?: string | null
          email_addresses?: string[] | null
          id?: string
          organization_id: string
          phone_numbers?: string[] | null
          resolution_method?: string | null
          updated_at?: string | null
          whatsapp_ids?: string[] | null
        }
        Update: {
          created_at?: string | null
          crm_account_id?: string | null
          crm_contact_id?: string | null
          email_addresses?: string[] | null
          id?: string
          organization_id?: string
          phone_numbers?: string[] | null
          resolution_method?: string | null
          updated_at?: string | null
          whatsapp_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_identity_map_crm_account_id_fkey"
            columns: ["crm_account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_identity_map_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_identity_map_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_internal_messages: {
        Row: {
          attachments: Json | null
          content: string
          content_type: string | null
          created_at: string | null
          crm_account_id: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          matter_id: string | null
          mentions: string[] | null
          organization_id: string
          read_by: Json | null
          room_id: string
          room_type: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          content_type?: string | null
          created_at?: string | null
          crm_account_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          matter_id?: string | null
          mentions?: string[] | null
          organization_id: string
          read_by?: Json | null
          room_id: string
          room_type?: string
          sender_id: string
          sender_name: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          content_type?: string | null
          created_at?: string | null
          crm_account_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          matter_id?: string | null
          mentions?: string[] | null
          organization_id?: string
          read_by?: Json | null
          room_id?: string
          room_type?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_internal_messages_crm_account_id_fkey"
            columns: ["crm_account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_internal_messages_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_internal_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_internal_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_message_queue: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          errors_detail: Json | null
          id: string
          idempotency_key: string
          last_error: string | null
          max_attempts: number | null
          next_attempt_at: string | null
          operation: string
          organization_id: string
          payload: Json
          priority: number | null
          processed_at: string | null
          result: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          errors_detail?: Json | null
          id?: string
          idempotency_key: string
          last_error?: string | null
          max_attempts?: number | null
          next_attempt_at?: string | null
          operation: string
          organization_id: string
          payload: Json
          priority?: number | null
          processed_at?: string | null
          result?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          errors_detail?: Json | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          max_attempts?: number | null
          next_attempt_at?: string | null
          operation?: string
          organization_id?: string
          payload?: Json
          priority?: number | null
          processed_at?: string | null
          result?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_messages: {
        Row: {
          attachments: Json | null
          body: string | null
          body_html: string | null
          channel: string
          content_hash: string | null
          content_type: string | null
          created_at: string | null
          delivered_at: string | null
          draft_updated_at: string | null
          email_in_reply_to: string | null
          email_message_id: string | null
          email_references: string[] | null
          failed_reason: string | null
          id: string
          idempotency_key: string | null
          is_draft: boolean | null
          is_legally_critical: boolean | null
          organization_id: string
          provider: string | null
          provider_message_id: string | null
          read_at: string | null
          retry_count: number | null
          sender_email: string | null
          sender_id: string | null
          sender_name: string
          sender_phone: string | null
          sender_type: string
          sent_at: string | null
          status: string | null
          telephony_cdr_id: string | null
          template_language: string | null
          template_name: string | null
          template_params: Json | null
          thread_id: string
        }
        Insert: {
          attachments?: Json | null
          body?: string | null
          body_html?: string | null
          channel: string
          content_hash?: string | null
          content_type?: string | null
          created_at?: string | null
          delivered_at?: string | null
          draft_updated_at?: string | null
          email_in_reply_to?: string | null
          email_message_id?: string | null
          email_references?: string[] | null
          failed_reason?: string | null
          id?: string
          idempotency_key?: string | null
          is_draft?: boolean | null
          is_legally_critical?: boolean | null
          organization_id: string
          provider?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          retry_count?: number | null
          sender_email?: string | null
          sender_id?: string | null
          sender_name: string
          sender_phone?: string | null
          sender_type: string
          sent_at?: string | null
          status?: string | null
          telephony_cdr_id?: string | null
          template_language?: string | null
          template_name?: string | null
          template_params?: Json | null
          thread_id: string
        }
        Update: {
          attachments?: Json | null
          body?: string | null
          body_html?: string | null
          channel?: string
          content_hash?: string | null
          content_type?: string | null
          created_at?: string | null
          delivered_at?: string | null
          draft_updated_at?: string | null
          email_in_reply_to?: string | null
          email_message_id?: string | null
          email_references?: string[] | null
          failed_reason?: string | null
          id?: string
          idempotency_key?: string | null
          is_draft?: boolean | null
          is_legally_critical?: boolean | null
          organization_id?: string
          provider?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          retry_count?: number | null
          sender_email?: string | null
          sender_id?: string | null
          sender_name?: string
          sender_phone?: string | null
          sender_type?: string
          sent_at?: string | null
          status?: string | null
          telephony_cdr_id?: string | null
          template_language?: string | null
          template_name?: string | null
          template_params?: Json | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "comm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_templates: {
        Row: {
          available_variables: Json | null
          body_html: string | null
          body_text: string | null
          category: string
          channel: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_system_default: boolean | null
          name: string
          organization_id: string
          subject: string | null
          updated_at: string | null
          whatsapp_approval_status: string | null
          whatsapp_template_language: string | null
          whatsapp_template_name: string | null
        }
        Insert: {
          available_variables?: Json | null
          body_html?: string | null
          body_text?: string | null
          category: string
          channel: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_system_default?: boolean | null
          name: string
          organization_id: string
          subject?: string | null
          updated_at?: string | null
          whatsapp_approval_status?: string | null
          whatsapp_template_language?: string | null
          whatsapp_template_name?: string | null
        }
        Update: {
          available_variables?: Json | null
          body_html?: string | null
          body_text?: string | null
          category?: string
          channel?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_system_default?: boolean | null
          name?: string
          organization_id?: string
          subject?: string | null
          updated_at?: string | null
          whatsapp_approval_status?: string | null
          whatsapp_template_language?: string | null
          whatsapp_template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_tenant_config: {
        Row: {
          activated_at: string | null
          created_at: string | null
          current_month_emails: number | null
          current_month_reset_at: string | null
          current_month_sms: number | null
          current_month_whatsapp: number | null
          domain_verified: boolean | null
          email_from_address: string | null
          email_from_name: string | null
          email_provider: string | null
          email_reply_to: string | null
          email_signature_html: string | null
          id: string
          internal_chat_enabled: boolean | null
          is_active: boolean | null
          max_email_per_month: number | null
          max_sms_per_month: number | null
          max_whatsapp_per_month: number | null
          notify_new_message_email: boolean | null
          notify_new_message_internal: boolean | null
          organization_id: string
          plan_code: string | null
          retention_days: number | null
          retention_policy: string | null
          sending_domain: string | null
          sms_enabled: boolean | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_secret_key: string | null
          smtp_use_tls: boolean | null
          updated_at: string | null
          whatsapp_bsp: string | null
          whatsapp_display_name: string | null
          whatsapp_enabled: boolean | null
          whatsapp_phone_number_id: string | null
          whatsapp_webhook_verify_token: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          current_month_emails?: number | null
          current_month_reset_at?: string | null
          current_month_sms?: number | null
          current_month_whatsapp?: number | null
          domain_verified?: boolean | null
          email_from_address?: string | null
          email_from_name?: string | null
          email_provider?: string | null
          email_reply_to?: string | null
          email_signature_html?: string | null
          id?: string
          internal_chat_enabled?: boolean | null
          is_active?: boolean | null
          max_email_per_month?: number | null
          max_sms_per_month?: number | null
          max_whatsapp_per_month?: number | null
          notify_new_message_email?: boolean | null
          notify_new_message_internal?: boolean | null
          organization_id: string
          plan_code?: string | null
          retention_days?: number | null
          retention_policy?: string | null
          sending_domain?: string | null
          sms_enabled?: boolean | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secret_key?: string | null
          smtp_use_tls?: boolean | null
          updated_at?: string | null
          whatsapp_bsp?: string | null
          whatsapp_display_name?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_phone_number_id?: string | null
          whatsapp_webhook_verify_token?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          current_month_emails?: number | null
          current_month_reset_at?: string | null
          current_month_sms?: number | null
          current_month_whatsapp?: number | null
          domain_verified?: boolean | null
          email_from_address?: string | null
          email_from_name?: string | null
          email_provider?: string | null
          email_reply_to?: string | null
          email_signature_html?: string | null
          id?: string
          internal_chat_enabled?: boolean | null
          is_active?: boolean | null
          max_email_per_month?: number | null
          max_sms_per_month?: number | null
          max_whatsapp_per_month?: number | null
          notify_new_message_email?: boolean | null
          notify_new_message_internal?: boolean | null
          organization_id?: string
          plan_code?: string | null
          retention_days?: number | null
          retention_policy?: string | null
          sending_domain?: string | null
          sms_enabled?: boolean | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secret_key?: string | null
          smtp_use_tls?: boolean | null
          updated_at?: string | null
          whatsapp_bsp?: string | null
          whatsapp_display_name?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_phone_number_id?: string | null
          whatsapp_webhook_verify_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_tenant_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_threads: {
        Row: {
          additional_matter_ids: string[] | null
          assigned_to: string | null
          auto_indexed: boolean | null
          channel: string
          created_at: string | null
          created_by: string | null
          crm_account_id: string | null
          crm_contact_id: string | null
          email_thread_id: string | null
          id: string
          indexing_confidence: string | null
          last_message_at: string | null
          last_message_preview: string | null
          last_message_sender: string | null
          matter_id: string | null
          message_count: number | null
          organization_id: string
          participants: Json | null
          status: string | null
          subject: string | null
          unread_count: number | null
          updated_at: string | null
          whatsapp_conversation_id: string | null
        }
        Insert: {
          additional_matter_ids?: string[] | null
          assigned_to?: string | null
          auto_indexed?: boolean | null
          channel: string
          created_at?: string | null
          created_by?: string | null
          crm_account_id?: string | null
          crm_contact_id?: string | null
          email_thread_id?: string | null
          id?: string
          indexing_confidence?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender?: string | null
          matter_id?: string | null
          message_count?: number | null
          organization_id: string
          participants?: Json | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
          updated_at?: string | null
          whatsapp_conversation_id?: string | null
        }
        Update: {
          additional_matter_ids?: string[] | null
          assigned_to?: string | null
          auto_indexed?: boolean | null
          channel?: string
          created_at?: string | null
          created_by?: string | null
          crm_account_id?: string | null
          crm_contact_id?: string | null
          email_thread_id?: string | null
          id?: string
          indexing_confidence?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender?: string | null
          matter_id?: string | null
          message_count?: number | null
          organization_id?: string
          participants?: Json | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
          updated_at?: string | null
          whatsapp_conversation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_threads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_threads_crm_account_id_fkey"
            columns: ["crm_account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_threads_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_threads_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_messages: {
        Row: {
          attachments: Json | null
          bcc_addresses: string[] | null
          body_html: string | null
          body_text: string | null
          cc_addresses: string[] | null
          created_at: string | null
          direction: string | null
          external_message_id: string | null
          from_address: string | null
          id: string
          organization_id: string
          read_at: string | null
          sender_user_id: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          thread_id: string
          to_addresses: string[] | null
        }
        Insert: {
          attachments?: Json | null
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: string[] | null
          created_at?: string | null
          direction?: string | null
          external_message_id?: string | null
          from_address?: string | null
          id?: string
          organization_id: string
          read_at?: string | null
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          thread_id: string
          to_addresses?: string[] | null
        }
        Update: {
          attachments?: Json | null
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: string[] | null
          created_at?: string | null
          direction?: string | null
          external_message_id?: string | null
          from_address?: string | null
          id?: string
          organization_id?: string
          read_at?: string | null
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          thread_id?: string
          to_addresses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "communication_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_threads: {
        Row: {
          assigned_to: string | null
          channel: string
          contact_id: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          matter_id: string | null
          message_count: number | null
          metadata: Json | null
          organization_id: string
          priority: string | null
          status: string | null
          subject: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          matter_id?: string | null
          message_count?: number | null
          metadata?: Json | null
          organization_id: string
          priority?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          matter_id?: string | null
          message_count?: number | null
          metadata?: Json | null
          organization_id?: string
          priority?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_threads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_threads_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          ai_category: string | null
          ai_classified_at: string | null
          ai_confidence: number | null
          ai_model: string | null
          ai_priority: number | null
          ai_subcategory: string | null
          archived_at: string | null
          assigned_at: string | null
          assigned_to: string | null
          attachments: Json | null
          body: string | null
          body_html: string | null
          body_preview: string | null
          channel: string
          channel_config_id: string | null
          classified_at: string | null
          classified_by: string | null
          client_id: string | null
          contact_id: string | null
          created_at: string
          direction: string
          email_bcc: string[] | null
          email_cc: string[] | null
          email_from: string | null
          email_in_reply_to: string | null
          email_message_id: string | null
          email_thread_id: string | null
          email_to: string[] | null
          external_id: string | null
          external_metadata: Json | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          is_replied: boolean | null
          is_starred: boolean | null
          manual_category: string | null
          manual_priority: number | null
          matter_id: string | null
          organization_id: string
          phone_duration_seconds: number | null
          phone_from: string | null
          phone_recording_url: string | null
          phone_to: string | null
          read_at: string | null
          read_by: string | null
          received_at: string
          replied_at: string | null
          reply_comm_id: string | null
          subject: string | null
          updated_at: string
          whatsapp_from: string | null
          whatsapp_media_url: string | null
          whatsapp_to: string | null
          whatsapp_type: string | null
        }
        Insert: {
          ai_category?: string | null
          ai_classified_at?: string | null
          ai_confidence?: number | null
          ai_model?: string | null
          ai_priority?: number | null
          ai_subcategory?: string | null
          archived_at?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          body?: string | null
          body_html?: string | null
          body_preview?: string | null
          channel?: string
          channel_config_id?: string | null
          classified_at?: string | null
          classified_by?: string | null
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          direction?: string
          email_bcc?: string[] | null
          email_cc?: string[] | null
          email_from?: string | null
          email_in_reply_to?: string | null
          email_message_id?: string | null
          email_thread_id?: string | null
          email_to?: string[] | null
          external_id?: string | null
          external_metadata?: Json | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          is_replied?: boolean | null
          is_starred?: boolean | null
          manual_category?: string | null
          manual_priority?: number | null
          matter_id?: string | null
          organization_id: string
          phone_duration_seconds?: number | null
          phone_from?: string | null
          phone_recording_url?: string | null
          phone_to?: string | null
          read_at?: string | null
          read_by?: string | null
          received_at?: string
          replied_at?: string | null
          reply_comm_id?: string | null
          subject?: string | null
          updated_at?: string
          whatsapp_from?: string | null
          whatsapp_media_url?: string | null
          whatsapp_to?: string | null
          whatsapp_type?: string | null
        }
        Update: {
          ai_category?: string | null
          ai_classified_at?: string | null
          ai_confidence?: number | null
          ai_model?: string | null
          ai_priority?: number | null
          ai_subcategory?: string | null
          archived_at?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          body?: string | null
          body_html?: string | null
          body_preview?: string | null
          channel?: string
          channel_config_id?: string | null
          classified_at?: string | null
          classified_by?: string | null
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          direction?: string
          email_bcc?: string[] | null
          email_cc?: string[] | null
          email_from?: string | null
          email_in_reply_to?: string | null
          email_message_id?: string | null
          email_thread_id?: string | null
          email_to?: string[] | null
          external_id?: string | null
          external_metadata?: Json | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          is_replied?: boolean | null
          is_starred?: boolean | null
          manual_category?: string | null
          manual_priority?: number | null
          matter_id?: string | null
          organization_id?: string
          phone_duration_seconds?: number | null
          phone_from?: string | null
          phone_recording_url?: string | null
          phone_to?: string | null
          read_at?: string | null
          read_by?: string | null
          received_at?: string
          replied_at?: string | null
          reply_comm_id?: string | null
          subject?: string | null
          updated_at?: string
          whatsapp_from?: string | null
          whatsapp_media_url?: string | null
          whatsapp_to?: string | null
          whatsapp_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_price_changes: {
        Row: {
          change_type: string | null
          competitor: string | null
          country_code: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          new_price: number | null
          old_price: number | null
          service_type: string | null
        }
        Insert: {
          change_type?: string | null
          competitor?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_price?: number | null
          old_price?: number | null
          service_type?: string | null
        }
        Update: {
          change_type?: string | null
          competitor?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_price?: number | null
          old_price?: number | null
          service_type?: string | null
        }
        Relationships: []
      }
      competitor_scan_config: {
        Row: {
          competitor_name: string | null
          country_codes: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_scan_at: string | null
          scan_frequency: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          competitor_name?: string | null
          country_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scan_at?: string | null
          scan_frequency?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          competitor_name?: string | null
          country_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scan_at?: string | null
          scan_frequency?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      consent_audit_log: {
        Row: {
          consent_type: string
          created_at: string
          document_version: string | null
          event_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          organization_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_type: string
          created_at?: string
          document_version?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_type?: string
          created_at?: string
          document_version?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_role_config: {
        Row: {
          code: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string | null
          name_en: string | null
          name_es: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          name_en?: string | null
          name_es?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          name_en?: string | null
          name_es?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          annual_revenue: number | null
          assigned_to: string | null
          avatar_url: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          department: string | null
          email: string | null
          employee_count: string | null
          id: string
          industry: string | null
          job_title: string | null
          last_contacted_at: string | null
          lifecycle_stage: string
          mobile: string | null
          name: string
          notes: string | null
          organization_id: string
          owner_type: string
          phone: string | null
          postal_code: string | null
          source: string | null
          source_detail: string | null
          state: string | null
          tags: string[] | null
          tax_id: string | null
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          department?: string | null
          email?: string | null
          employee_count?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          last_contacted_at?: string | null
          lifecycle_stage?: string
          mobile?: string | null
          name: string
          notes?: string | null
          organization_id: string
          owner_type?: string
          phone?: string | null
          postal_code?: string | null
          source?: string | null
          source_detail?: string | null
          state?: string | null
          tags?: string[] | null
          tax_id?: string | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          department?: string | null
          email?: string | null
          employee_count?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          last_contacted_at?: string | null
          lifecycle_stage?: string
          mobile?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          owner_type?: string
          phone?: string | null
          postal_code?: string | null
          source?: string | null
          source_detail?: string | null
          state?: string | null
          tags?: string[] | null
          tax_id?: string | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contextual_guide_progress: {
        Row: {
          completed_at: string | null
          context_id: string | null
          created_at: string | null
          guide_id: string | null
          id: string
          step_progress: Json | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          context_id?: string | null
          created_at?: string | null
          guide_id?: string | null
          id?: string
          step_progress?: Json | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          context_id?: string | null
          created_at?: string | null
          guide_id?: string | null
          id?: string
          step_progress?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      correction_reason_codes: {
        Row: {
          category: string | null
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_accounts: {
        Row: {
          account_type: string | null
          address: string | null
          address_line1: string | null
          address_line2: string | null
          agent_jurisdictions: string[] | null
          agent_license_number: string | null
          annual_ip_budget_eur: number | null
          assigned_to: string | null
          billing_email: string | null
          city: string | null
          client_token: string | null
          client_type_id: string | null
          country: string | null
          country_code: string | null
          created_at: string
          credit_limit: number | null
          currency: string | null
          email: string | null
          fax: string | null
          health_score: number | null
          id: string
          industry: string | null
          ip_portfolio_size: number | null
          is_active: boolean | null
          last_interaction_at: string | null
          legal_name: string | null
          lifecycle_stage: string | null
          name: string
          notes: string | null
          organization_id: string
          payment_classification_id: string | null
          payment_terms: number | null
          phone: string | null
          postal_code: string | null
          preferred_language: string | null
          rating_stars: number | null
          state_province: string | null
          status: string | null
          tags: string[] | null
          tax_country: string | null
          tax_id: string | null
          tax_id_type: string | null
          tier: string | null
          trade_name: string | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          account_type?: string | null
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          agent_jurisdictions?: string[] | null
          agent_license_number?: string | null
          annual_ip_budget_eur?: number | null
          assigned_to?: string | null
          billing_email?: string | null
          city?: string | null
          client_token?: string | null
          client_type_id?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string | null
          email?: string | null
          fax?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          ip_portfolio_size?: number | null
          is_active?: boolean | null
          last_interaction_at?: string | null
          legal_name?: string | null
          lifecycle_stage?: string | null
          name: string
          notes?: string | null
          organization_id: string
          payment_classification_id?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          rating_stars?: number | null
          state_province?: string | null
          status?: string | null
          tags?: string[] | null
          tax_country?: string | null
          tax_id?: string | null
          tax_id_type?: string | null
          tier?: string | null
          trade_name?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          account_type?: string | null
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          agent_jurisdictions?: string[] | null
          agent_license_number?: string | null
          annual_ip_budget_eur?: number | null
          assigned_to?: string | null
          billing_email?: string | null
          city?: string | null
          client_token?: string | null
          client_type_id?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string | null
          email?: string | null
          fax?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          ip_portfolio_size?: number | null
          is_active?: boolean | null
          last_interaction_at?: string | null
          legal_name?: string | null
          lifecycle_stage?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          payment_classification_id?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          rating_stars?: number | null
          state_province?: string | null
          status?: string | null
          tags?: string[] | null
          tax_country?: string | null
          tax_id?: string | null
          tax_id_type?: string | null
          tier?: string | null
          trade_name?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_accounts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          account_id: string | null
          activity_date: string
          activity_type: string
          call_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          next_action: string | null
          next_action_date: string | null
          organization_id: string
          outcome: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          activity_date?: string
          activity_type?: string
          call_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          organization_id: string
          outcome?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          activity_date?: string
          activity_type?: string
          call_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          organization_id?: string
          outcome?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_suggestions: {
        Row: {
          action_data: Json | null
          action_label: string | null
          action_type: string | null
          body: string
          context_id: string | null
          context_type: string
          expires_at: string | null
          generated_at: string | null
          id: string
          is_actioned: boolean | null
          is_dismissed: boolean | null
          organization_id: string
          priority: string
          related_deadline_id: string | null
          related_matter_id: string | null
          suggestion_type: string
          title: string
          user_id: string | null
        }
        Insert: {
          action_data?: Json | null
          action_label?: string | null
          action_type?: string | null
          body: string
          context_id?: string | null
          context_type: string
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_actioned?: boolean | null
          is_dismissed?: boolean | null
          organization_id: string
          priority?: string
          related_deadline_id?: string | null
          related_matter_id?: string | null
          suggestion_type: string
          title: string
          user_id?: string | null
        }
        Update: {
          action_data?: Json | null
          action_label?: string | null
          action_type?: string | null
          body?: string
          context_id?: string | null
          context_type?: string
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_actioned?: boolean | null
          is_dismissed?: boolean | null
          organization_id?: string
          priority?: string
          related_deadline_id?: string | null
          related_matter_id?: string | null
          suggestion_type?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_ai_suggestions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_suggestions_related_deadline_id_fkey"
            columns: ["related_deadline_id"]
            isOneToOne: false
            referencedRelation: "matter_deadlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_suggestions_related_matter_id_fkey"
            columns: ["related_matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automation_executions: {
        Row: {
          account_id: string | null
          action_result: Json | null
          deal_id: string | null
          error_message: string | null
          executed_at: string | null
          id: string
          organization_id: string
          rule_id: string
          status: string
          trigger_data: Json | null
        }
        Insert: {
          account_id?: string | null
          action_result?: Json | null
          deal_id?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          organization_id: string
          rule_id: string
          status?: string
          trigger_data?: Json | null
        }
        Update: {
          account_id?: string | null
          action_result?: Json | null
          deal_id?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          organization_id?: string
          rule_id?: string
          status?: string
          trigger_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_automation_executions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_automation_executions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_automation_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_automation_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "crm_automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          organization_id: string
          pipeline_id: string | null
          stage_id: string | null
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          organization_id: string
          pipeline_id?: string | null
          stage_id?: string | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          organization_id?: string
          pipeline_id?: string | null
          stage_id?: string | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_automation_rules_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_automation_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_calls: {
        Row: {
          account_id: string | null
          ai_next_action: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          direction: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          initiated_by: string
          notes: string | null
          organization_id: string
          outcome: string | null
          phone_number_from: string | null
          phone_number_to: string | null
          provider: string | null
          provider_call_sid: string | null
          recording_consent: boolean | null
          recording_duration_seconds: number | null
          recording_url: string | null
          started_at: string | null
          status: string | null
          transcription: string | null
          transcription_summary: string | null
        }
        Insert: {
          account_id?: string | null
          ai_next_action?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiated_by: string
          notes?: string | null
          organization_id: string
          outcome?: string | null
          phone_number_from?: string | null
          phone_number_to?: string | null
          provider?: string | null
          provider_call_sid?: string | null
          recording_consent?: boolean | null
          recording_duration_seconds?: number | null
          recording_url?: string | null
          started_at?: string | null
          status?: string | null
          transcription?: string | null
          transcription_summary?: string | null
        }
        Update: {
          account_id?: string | null
          ai_next_action?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiated_by?: string
          notes?: string | null
          organization_id?: string
          outcome?: string | null
          phone_number_from?: string | null
          phone_number_to?: string | null
          provider?: string | null
          provider_call_sid?: string | null
          recording_consent?: boolean | null
          recording_duration_seconds?: number | null
          recording_url?: string | null
          started_at?: string | null
          status?: string | null
          transcription?: string | null
          transcription_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_calls_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_calls_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_calls_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_calls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          city: string | null
          country_code: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_lead: boolean | null
          is_primary: boolean | null
          job_title: string | null
          last_interaction_at: string | null
          lead_score: number | null
          lead_status: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          portal_access_enabled: boolean | null
          preferred_language: string | null
          role: string | null
          tags: string[] | null
          updated_at: string
          whatsapp_phone: string | null
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_lead?: boolean | null
          is_primary?: boolean | null
          job_title?: string | null
          last_interaction_at?: string | null
          lead_score?: number | null
          lead_status?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          portal_access_enabled?: boolean | null
          preferred_language?: string | null
          role?: string | null
          tags?: string[] | null
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_lead?: boolean | null
          is_primary?: boolean | null
          job_title?: string | null
          last_interaction_at?: string | null
          lead_score?: number | null
          lead_status?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          portal_access_enabled?: boolean | null
          preferred_language?: string | null
          role?: string | null
          tags?: string[] | null
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          account_id: string | null
          account_name_cache: string | null
          actual_close_date: string | null
          amount: number | null
          amount_eur: number | null
          assigned_to: string | null
          close_reason: string | null
          contact_id: string | null
          created_at: string
          deal_type: string | null
          expected_close_date: string | null
          id: string
          jurisdiction_code: string | null
          lost_reason: string | null
          lost_to_competitor: string | null
          matter_id: string | null
          name: string
          nice_classes: number[] | null
          official_fees_eur: number | null
          opportunity_type: string | null
          organization_id: string
          owner_id: string | null
          pipeline_id: string | null
          pipeline_stage_id: string | null
          probability_pct: number | null
          professional_fees_eur: number | null
          stage: string
          stage_entered_at: string | null
          stage_history: Json | null
          updated_at: string
          weighted_amount: number | null
        }
        Insert: {
          account_id?: string | null
          account_name_cache?: string | null
          actual_close_date?: string | null
          amount?: number | null
          amount_eur?: number | null
          assigned_to?: string | null
          close_reason?: string | null
          contact_id?: string | null
          created_at?: string
          deal_type?: string | null
          expected_close_date?: string | null
          id?: string
          jurisdiction_code?: string | null
          lost_reason?: string | null
          lost_to_competitor?: string | null
          matter_id?: string | null
          name: string
          nice_classes?: number[] | null
          official_fees_eur?: number | null
          opportunity_type?: string | null
          organization_id: string
          owner_id?: string | null
          pipeline_id?: string | null
          pipeline_stage_id?: string | null
          probability_pct?: number | null
          professional_fees_eur?: number | null
          stage?: string
          stage_entered_at?: string | null
          stage_history?: Json | null
          updated_at?: string
          weighted_amount?: number | null
        }
        Update: {
          account_id?: string | null
          account_name_cache?: string | null
          actual_close_date?: string | null
          amount?: number | null
          amount_eur?: number | null
          assigned_to?: string | null
          close_reason?: string | null
          contact_id?: string | null
          created_at?: string
          deal_type?: string | null
          expected_close_date?: string | null
          id?: string
          jurisdiction_code?: string | null
          lost_reason?: string | null
          lost_to_competitor?: string | null
          matter_id?: string | null
          name?: string
          nice_classes?: number[] | null
          official_fees_eur?: number | null
          opportunity_type?: string | null
          organization_id?: string
          owner_id?: string | null
          pipeline_id?: string | null
          pipeline_stage_id?: string | null
          probability_pct?: number | null
          professional_fees_eur?: number | null
          stage?: string
          stage_entered_at?: string | null
          stage_history?: Json | null
          updated_at?: string
          weighted_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_account_id_crm_accounts_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          company_name: string | null
          converted_account_id: string | null
          converted_at: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          lead_score: number | null
          lead_status: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          source: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_name?: string | null
          converted_account_id?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          lead_score?: number | null
          lead_status?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_name?: string | null
          converted_account_id?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          lead_score?: number | null
          lead_status?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_converted_account_id_fkey"
            columns: ["converted_account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_lost_stage: boolean | null
          is_won_stage: boolean | null
          name: string
          pipeline_id: string
          position: number | null
          probability: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_lost_stage?: boolean | null
          is_won_stage?: boolean | null
          name: string
          pipeline_id: string
          position?: number | null
          probability?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_lost_stage?: boolean | null
          is_won_stage?: boolean | null
          name?: string
          pipeline_id?: string
          position?: number | null
          probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string
          pipeline_type: string | null
          position: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id: string
          pipeline_type?: string | null
          position?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string
          pipeline_type?: string | null
          position?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_audit_log: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deadline_alerts: {
        Row: {
          alert_type: string
          body: string | null
          channel: string
          created_at: string | null
          deadline_id: string
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string | null
          organization_id: string
          read_at: string | null
          recipient_email: string | null
          recipient_id: string | null
          recipient_role: string | null
          response_data: Json | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          alert_type: string
          body?: string | null
          channel: string
          created_at?: string | null
          deadline_id: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          organization_id: string
          read_at?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          response_data?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          alert_type?: string
          body?: string | null
          channel?: string
          created_at?: string | null
          deadline_id?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          organization_id?: string
          read_at?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          response_data?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      deadline_notifications: {
        Row: {
          created_at: string | null
          deadline_id: string | null
          id: string
          message: string | null
          notification_type: string | null
          read_at: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deadline_id?: string | null
          id?: string
          message?: string | null
          notification_type?: string | null
          read_at?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deadline_id?: string | null
          id?: string
          message?: string | null
          notification_type?: string | null
          read_at?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deadline_reminders: {
        Row: {
          created_at: string | null
          deadline_id: string | null
          id: string
          reminder_date: string | null
          sent: boolean | null
          sent_at: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          deadline_id?: string | null
          id?: string
          reminder_date?: string | null
          sent?: boolean | null
          sent_at?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          deadline_id?: string | null
          id?: string
          reminder_date?: string | null
          sent?: boolean | null
          sent_at?: string | null
          type?: string | null
        }
        Relationships: []
      }
      deadline_rules: {
        Row: {
          adjust_to_business_day: boolean | null
          adjust_to_end_of_month: boolean | null
          alert_days: number[] | null
          applies_to_phase: string | null
          business_day_direction: string | null
          calendar_type: string | null
          can_be_revived: boolean | null
          category: string | null
          code: string
          consequence_if_missed: string | null
          created_at: string | null
          criticality: string
          description: string | null
          escalate_days_before: number | null
          escalate_to_role: string | null
          extension_requires_fee: boolean | null
          extension_time_unit: string | null
          extension_time_value: number | null
          id: string
          is_active: boolean | null
          is_extendable: boolean | null
          jurisdiction_id: string | null
          legal_basis: string | null
          legal_url: string | null
          max_extensions: number | null
          name_en: string
          name_es: string | null
          revival_period_days: number | null
          revival_requires_petition: boolean | null
          right_type: string | null
          time_unit: string
          time_value: number
          trigger_event: string
          trigger_field: string | null
          updated_at: string | null
        }
        Insert: {
          adjust_to_business_day?: boolean | null
          adjust_to_end_of_month?: boolean | null
          alert_days?: number[] | null
          applies_to_phase?: string | null
          business_day_direction?: string | null
          calendar_type?: string | null
          can_be_revived?: boolean | null
          category?: string | null
          code: string
          consequence_if_missed?: string | null
          created_at?: string | null
          criticality?: string
          description?: string | null
          escalate_days_before?: number | null
          escalate_to_role?: string | null
          extension_requires_fee?: boolean | null
          extension_time_unit?: string | null
          extension_time_value?: number | null
          id?: string
          is_active?: boolean | null
          is_extendable?: boolean | null
          jurisdiction_id?: string | null
          legal_basis?: string | null
          legal_url?: string | null
          max_extensions?: number | null
          name_en: string
          name_es?: string | null
          revival_period_days?: number | null
          revival_requires_petition?: boolean | null
          right_type?: string | null
          time_unit: string
          time_value: number
          trigger_event: string
          trigger_field?: string | null
          updated_at?: string | null
        }
        Update: {
          adjust_to_business_day?: boolean | null
          adjust_to_end_of_month?: boolean | null
          alert_days?: number[] | null
          applies_to_phase?: string | null
          business_day_direction?: string | null
          calendar_type?: string | null
          can_be_revived?: boolean | null
          category?: string | null
          code?: string
          consequence_if_missed?: string | null
          created_at?: string | null
          criticality?: string
          description?: string | null
          escalate_days_before?: number | null
          escalate_to_role?: string | null
          extension_requires_fee?: boolean | null
          extension_time_unit?: string | null
          extension_time_value?: number | null
          id?: string
          is_active?: boolean | null
          is_extendable?: boolean | null
          jurisdiction_id?: string | null
          legal_basis?: string | null
          legal_url?: string | null
          max_extensions?: number | null
          name_en?: string
          name_es?: string | null
          revival_period_days?: number | null
          revival_requires_petition?: boolean | null
          right_type?: string | null
          time_unit?: string
          time_value?: number
          trigger_event?: string
          trigger_field?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deadline_types: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          matter_types: string[]
          name_en: string | null
          name_es: string
          organization_id: string | null
          sort_order: number | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          matter_types?: string[]
          name_en?: string | null
          name_es: string
          organization_id?: string | null
          sort_order?: number | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          matter_types?: string[]
          name_en?: string | null
          name_es?: string
          organization_id?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          actual_close_date: string | null
          assigned_to: string | null
          closed_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          custom_fields: Json | null
          description: string | null
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          matter_id: string | null
          organization_id: string
          owner_type: string
          pipeline_id: string | null
          priority: string | null
          stage_id: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          value: number | null
          won_reason: string | null
        }
        Insert: {
          actual_close_date?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          matter_id?: string | null
          organization_id: string
          owner_type?: string
          pipeline_id?: string | null
          priority?: string | null
          stage_id?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          value?: number | null
          won_reason?: string | null
        }
        Update: {
          actual_close_date?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          matter_id?: string | null
          organization_id?: string
          owner_type?: string
          pipeline_id?: string | null
          priority?: string | null
          stage_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          value?: number | null
          won_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_signals: {
        Row: {
          confidence: number | null
          contact_info: Json | null
          country_code: string | null
          created_at: string | null
          detected_at: string | null
          id: string
          is_processed: boolean | null
          metadata: Json | null
          nice_classes: number[] | null
          processed_at: string | null
          signal_source: string | null
          signal_type: string | null
          strength: number | null
          trademark_name: string | null
        }
        Insert: {
          confidence?: number | null
          contact_info?: Json | null
          country_code?: string | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          is_processed?: boolean | null
          metadata?: Json | null
          nice_classes?: number[] | null
          processed_at?: string | null
          signal_source?: string | null
          signal_type?: string | null
          strength?: number | null
          trademark_name?: string | null
        }
        Update: {
          confidence?: number | null
          contact_info?: Json | null
          country_code?: string | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          is_processed?: boolean | null
          metadata?: Json | null
          nice_classes?: number[] | null
          processed_at?: string | null
          signal_source?: string | null
          signal_type?: string | null
          strength?: number | null
          trademark_name?: string | null
        }
        Relationships: []
      }
      directory_change_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          notes: string | null
          organization_id: string | null
          source: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          source?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          source?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      doc_templates: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          language: string | null
          metadata: Json | null
          name: string | null
          organization_id: string | null
          template_type: string | null
          updated_at: string | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          template_type?: string | null
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          template_type?: string | null
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number | null
          content: string | null
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          token_count: number | null
        }
        Insert: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Relationships: []
      }
      document_counters: {
        Row: {
          counter_value: number | null
          created_at: string | null
          document_type: string | null
          id: string
          organization_id: string | null
          prefix: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          counter_value?: number | null
          created_at?: string | null
          document_type?: string | null
          id?: string
          organization_id?: string | null
          prefix?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          counter_value?: number | null
          created_at?: string | null
          document_type?: string | null
          id?: string
          organization_id?: string | null
          prefix?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      document_embeddings: {
        Row: {
          chunk_text: string | null
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          chunk_text?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          chunk_text?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          template_content: string
          template_type: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          template_content: string
          template_type?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          template_content?: string
          template_type?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      document_types: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          fields_schema: Json | null
          icon: string | null
          id: string
          name: string
          name_en: string | null
          sort_order: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          fields_schema?: Json | null
          icon?: string | null
          id: string
          name: string
          name_en?: string | null
          sort_order?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          fields_schema?: Json | null
          icon?: string | null
          id?: string
          name?: string
          name_en?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          document_type:
            | Database["public"]["Enums"]["document_type_enum"]
            | null
          file_size: number | null
          id: string
          is_current_version: boolean | null
          matter_id: string | null
          mime_type: string | null
          organization_id: string
          original_filename: string
          previous_version_id: string | null
          storage_bucket: string
          storage_path: string
          title: string | null
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          document_type?:
            | Database["public"]["Enums"]["document_type_enum"]
            | null
          file_size?: number | null
          id?: string
          is_current_version?: boolean | null
          matter_id?: string | null
          mime_type?: string | null
          organization_id: string
          original_filename: string
          previous_version_id?: string | null
          storage_bucket: string
          storage_path: string
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          document_type?:
            | Database["public"]["Enums"]["document_type_enum"]
            | null
          file_size?: number | null
          id?: string
          is_current_version?: boolean | null
          matter_id?: string | null
          mime_type?: string | null
          organization_id?: string
          original_filename?: string
          previous_version_id?: string | null
          storage_bucket?: string
          storage_path?: string
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          change_pct: number | null
          currency_name: string | null
          expires_at: string | null
          fetched_at: string | null
          id: string
          manual_override: number | null
          previous_rate: number | null
          rate: number
          region: string | null
          source: string
          symbol: string | null
          target_currency: string
          updated_by: string | null
        }
        Insert: {
          base_currency?: string
          change_pct?: number | null
          currency_name?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          manual_override?: number | null
          previous_rate?: number | null
          rate: number
          region?: string | null
          source?: string
          symbol?: string | null
          target_currency: string
          updated_by?: string | null
        }
        Update: {
          base_currency?: string
          change_pct?: number | null
          currency_name?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          manual_override?: number | null
          previous_rate?: number | null
          rate?: number
          region?: string | null
          source?: string
          symbol?: string | null
          target_currency?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          amount_eur: number | null
          category: string | null
          created_at: string | null
          crm_account_id: string | null
          currency: string | null
          description: string
          expense_date: string | null
          id: string
          invoice_id: string | null
          is_billable: boolean | null
          is_billed: boolean | null
          matter_id: string | null
          notes: string | null
          organization_id: string
          receipt_url: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          amount_eur?: number | null
          category?: string | null
          created_at?: string | null
          crm_account_id?: string | null
          currency?: string | null
          description: string
          expense_date?: string | null
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          is_billed?: boolean | null
          matter_id?: string | null
          notes?: string | null
          organization_id: string
          receipt_url?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          amount_eur?: number | null
          category?: string | null
          created_at?: string | null
          crm_account_id?: string | null
          currency?: string | null
          description?: string
          expense_date?: string | null
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          is_billed?: boolean | null
          matter_id?: string | null
          notes?: string | null
          organization_id?: string
          receipt_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_crm_account_id_fkey"
            columns: ["crm_account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_suggestion_log: {
        Row: {
          accepted_value: string | null
          created_at: string
          document_id: string | null
          entity_type: string | null
          id: string
          organization_id: string | null
          suggested_value: string | null
          user_id: string | null
          was_accepted: boolean | null
        }
        Insert: {
          accepted_value?: string | null
          created_at?: string
          document_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string | null
          suggested_value?: string | null
          user_id?: string | null
          was_accepted?: boolean | null
        }
        Update: {
          accepted_value?: string | null
          created_at?: string
          document_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string | null
          suggested_value?: string | null
          user_id?: string | null
          was_accepted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "extraction_suggestion_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_verification_log: {
        Row: {
          ai_model: string | null
          confidence_before: string | null
          country_code: string | null
          created_at: string | null
          currency_before: string | null
          currency_extracted: string | null
          discrepancy_pct: number | null
          dry_run: boolean | null
          error_message: string | null
          fee_before: number | null
          fee_extracted: number | null
          id: string
          ipo_office_id: string
          method: string | null
          office_acronym: string | null
          processing_ms: number | null
          raw_extract: string | null
          source_url: string | null
          status: string
          verification_date: string | null
        }
        Insert: {
          ai_model?: string | null
          confidence_before?: string | null
          country_code?: string | null
          created_at?: string | null
          currency_before?: string | null
          currency_extracted?: string | null
          discrepancy_pct?: number | null
          dry_run?: boolean | null
          error_message?: string | null
          fee_before?: number | null
          fee_extracted?: number | null
          id?: string
          ipo_office_id: string
          method?: string | null
          office_acronym?: string | null
          processing_ms?: number | null
          raw_extract?: string | null
          source_url?: string | null
          status: string
          verification_date?: string | null
        }
        Update: {
          ai_model?: string | null
          confidence_before?: string | null
          country_code?: string | null
          created_at?: string | null
          currency_before?: string | null
          currency_extracted?: string | null
          discrepancy_pct?: number | null
          dry_run?: boolean | null
          error_message?: string | null
          fee_before?: number | null
          fee_extracted?: number | null
          id?: string
          ipo_office_id?: string
          method?: string | null
          office_acronym?: string | null
          processing_ms?: number | null
          raw_extract?: string | null
          source_url?: string | null
          status?: string
          verification_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_verification_log_ipo_office_id_fkey"
            columns: ["ipo_office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          auto_track: boolean | null
          category_id: string | null
          channel: string | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string | null
          sort_order: number | null
          type: string | null
        }
        Insert: {
          auto_track?: boolean | null
          category_id?: string | null
          channel?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          sort_order?: number | null
          type?: string | null
        }
        Update: {
          auto_track?: boolean | null
          category_id?: string | null
          channel?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          sort_order?: number | null
          type?: string | null
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount: number
          category: string
          category_id: string | null
          created_at: string | null
          currency: string
          description: string
          id: string
          metadata: Json | null
          notes: string | null
          reference_id: string | null
          reference_table: string | null
          status: string | null
          subcategory: string | null
          transaction_date: string
          type: string
          updated_at: string | null
          vendor: string | null
          vendor_id: string | null
        }
        Insert: {
          amount?: number
          category: string
          category_id?: string | null
          created_at?: string | null
          currency?: string
          description: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          reference_id?: string | null
          reference_table?: string | null
          status?: string | null
          subcategory?: string | null
          transaction_date?: string
          type: string
          updated_at?: string | null
          vendor?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          category_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          reference_id?: string | null
          reference_table?: string | null
          status?: string | null
          subcategory?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string | null
          vendor?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      finance_vendors: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string | null
          type: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          type?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          type?: string | null
          website?: string | null
        }
        Relationships: []
      }
      frontend_error_log: {
        Row: {
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          page_url: string | null
          table_name: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          page_url?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          page_url?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      gazette_sources: {
        Row: {
          code: string | null
          country: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_issue_date: string | null
          last_scraped_at: string | null
          name: string | null
          scrape_config: Json | null
          scrape_frequency: string | null
          source_type: string | null
          url: string | null
        }
        Insert: {
          code?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_issue_date?: string | null
          last_scraped_at?: string | null
          name?: string | null
          scrape_config?: Json | null
          scrape_frequency?: string | null
          source_type?: string | null
          url?: string | null
        }
        Update: {
          code?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_issue_date?: string | null
          last_scraped_at?: string | null
          name?: string | null
          scrape_config?: Json | null
          scrape_frequency?: string | null
          source_type?: string | null
          url?: string | null
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          ai_model_used: string | null
          ai_prompt_used: string | null
          ai_tokens_used: number | null
          category: string | null
          client_id: string | null
          contact_id: string | null
          content: string | null
          content_html: string | null
          content_json: Json | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          discount_amount: number | null
          document_data: Json | null
          document_date: string | null
          document_number: string | null
          document_type_id: string | null
          due_date: string | null
          export_format: string | null
          exported_at: string | null
          exported_document_id: string | null
          generation_time_ms: number | null
          id: string
          invoice_id: string | null
          matter_id: string | null
          name: string | null
          organization_id: string | null
          paid_at: string | null
          parent_document_id: string | null
          parent_id: string | null
          pdf_url: string | null
          sent_at: string | null
          sent_to: string | null
          status: string | null
          style_code: string | null
          style_id: string | null
          subtotal: number | null
          tax_amount: number | null
          template_id: string | null
          title: string | null
          total_amount: number | null
          updated_at: string | null
          user_feedback: string | null
          user_rating: number | null
          variables_input: Json | null
          variables_resolved: Json | null
          version: number | null
          word_html: string | null
        }
        Insert: {
          ai_model_used?: string | null
          ai_prompt_used?: string | null
          ai_tokens_used?: number | null
          category?: string | null
          client_id?: string | null
          contact_id?: string | null
          content?: string | null
          content_html?: string | null
          content_json?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          document_data?: Json | null
          document_date?: string | null
          document_number?: string | null
          document_type_id?: string | null
          due_date?: string | null
          export_format?: string | null
          exported_at?: string | null
          exported_document_id?: string | null
          generation_time_ms?: number | null
          id?: string
          invoice_id?: string | null
          matter_id?: string | null
          name?: string | null
          organization_id?: string | null
          paid_at?: string | null
          parent_document_id?: string | null
          parent_id?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
          style_code?: string | null
          style_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          template_id?: string | null
          title?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_feedback?: string | null
          user_rating?: number | null
          variables_input?: Json | null
          variables_resolved?: Json | null
          version?: number | null
          word_html?: string | null
        }
        Update: {
          ai_model_used?: string | null
          ai_prompt_used?: string | null
          ai_tokens_used?: number | null
          category?: string | null
          client_id?: string | null
          contact_id?: string | null
          content?: string | null
          content_html?: string | null
          content_json?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          document_data?: Json | null
          document_date?: string | null
          document_number?: string | null
          document_type_id?: string | null
          due_date?: string | null
          export_format?: string | null
          exported_at?: string | null
          exported_document_id?: string | null
          generation_time_ms?: number | null
          id?: string
          invoice_id?: string | null
          matter_id?: string | null
          name?: string | null
          organization_id?: string | null
          paid_at?: string | null
          parent_document_id?: string | null
          parent_id?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
          style_code?: string | null
          style_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          template_id?: string | null
          title?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_feedback?: string | null
          user_rating?: number | null
          variables_input?: Json | null
          variables_resolved?: Json | null
          version?: number | null
          word_html?: string | null
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          created_at: string
          error_message: string | null
          file_format: string | null
          file_url: string | null
          generated_by: string | null
          id: string
          organization_id: string
          parameters: Json | null
          report_type: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_format?: string | null
          file_url?: string | null
          generated_by?: string | null
          id?: string
          organization_id: string
          parameters?: Json | null
          report_type: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_format?: string | null
          file_url?: string | null
          generated_by?: string | null
          id?: string
          organization_id?: string
          parameters?: Json | null
          report_type?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      genius_conversations: {
        Row: {
          context_matter_id: string | null
          context_type: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          message_count: number | null
          organization_id: string
          status: string | null
          title: string | null
          total_cost_eur: number | null
          total_tokens_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_matter_id?: string | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          organization_id: string
          status?: string | null
          title?: string | null
          total_cost_eur?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_matter_id?: string | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          organization_id?: string
          status?: string | null
          title?: string | null
          total_cost_eur?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "genius_conversations_context_matter_id_fkey"
            columns: ["context_matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genius_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genius_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      genius_generated_docs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content_html: string | null
          content_markdown: string | null
          conversation_id: string | null
          created_at: string | null
          created_by: string | null
          document_type: string
          generation_prompt_hash: string | null
          id: string
          jurisdiction_code: string | null
          language: string | null
          matter_id: string | null
          model_used: string | null
          organization_id: string
          parent_doc_id: string | null
          rag_sources_used: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          sent_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content_html?: string | null
          content_markdown?: string | null
          conversation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type: string
          generation_prompt_hash?: string | null
          id?: string
          jurisdiction_code?: string | null
          language?: string | null
          matter_id?: string | null
          model_used?: string | null
          organization_id: string
          parent_doc_id?: string | null
          rag_sources_used?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content_html?: string | null
          content_markdown?: string | null
          conversation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          generation_prompt_hash?: string | null
          id?: string
          jurisdiction_code?: string | null
          language?: string | null
          matter_id?: string | null
          model_used?: string | null
          organization_id?: string
          parent_doc_id?: string | null
          rag_sources_used?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "genius_generated_docs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genius_generated_docs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "genius_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genius_generated_docs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genius_generated_docs_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genius_generated_docs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genius_generated_docs_parent_doc_id_fkey"
            columns: ["parent_doc_id"]
            isOneToOne: false
            referencedRelation: "genius_generated_docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genius_generated_docs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      genius_generated_documents: {
        Row: {
          citations: Json | null
          content_html: string | null
          content_markdown: string | null
          created_at: string | null
          disclaimer_accepted: boolean | null
          disclaimer_accepted_at: string | null
          document_type: string | null
          estimated_fees: Json | null
          export_formats: Json | null
          id: string
          input_data: Json | null
          legal_analysis: Json | null
          organization_id: string | null
          risk_assessment: Json | null
          title: string | null
          tone: string | null
          trademark_analysis: Json | null
          updated_at: string | null
          user_approved: boolean | null
          user_id: string | null
          user_notes: string | null
          verification_status: string | null
          verification_warnings: Json | null
          verified_at: string | null
        }
        Insert: {
          citations?: Json | null
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string | null
          disclaimer_accepted?: boolean | null
          disclaimer_accepted_at?: string | null
          document_type?: string | null
          estimated_fees?: Json | null
          export_formats?: Json | null
          id?: string
          input_data?: Json | null
          legal_analysis?: Json | null
          organization_id?: string | null
          risk_assessment?: Json | null
          title?: string | null
          tone?: string | null
          trademark_analysis?: Json | null
          updated_at?: string | null
          user_approved?: boolean | null
          user_id?: string | null
          user_notes?: string | null
          verification_status?: string | null
          verification_warnings?: Json | null
          verified_at?: string | null
        }
        Update: {
          citations?: Json | null
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string | null
          disclaimer_accepted?: boolean | null
          disclaimer_accepted_at?: string | null
          document_type?: string | null
          estimated_fees?: Json | null
          export_formats?: Json | null
          id?: string
          input_data?: Json | null
          legal_analysis?: Json | null
          organization_id?: string | null
          risk_assessment?: Json | null
          title?: string | null
          tone?: string | null
          trademark_analysis?: Json | null
          updated_at?: string | null
          user_approved?: boolean | null
          user_id?: string | null
          user_notes?: string | null
          verification_status?: string | null
          verification_warnings?: Json | null
          verified_at?: string | null
        }
        Relationships: []
      }
      genius_knowledge_global: {
        Row: {
          article_reference: string | null
          content: string
          created_at: string | null
          document_category: string | null
          effective_date: string | null
          embedding: string | null
          id: string
          is_active: boolean | null
          jurisdiction_code: string | null
          knowledge_type: string
          language: string | null
          last_verified_at: string | null
          source_name: string | null
          source_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          article_reference?: string | null
          content: string
          created_at?: string | null
          document_category?: string | null
          effective_date?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_code?: string | null
          knowledge_type: string
          language?: string | null
          last_verified_at?: string | null
          source_name?: string | null
          source_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          article_reference?: string | null
          content?: string
          created_at?: string | null
          document_category?: string | null
          effective_date?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_code?: string | null
          knowledge_type?: string
          language?: string | null
          last_verified_at?: string | null
          source_name?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      genius_knowledge_tenant: {
        Row: {
          chunk_index: number | null
          chunk_total: number | null
          content_chunk: string
          created_at: string | null
          document_type: string | null
          embedding: string | null
          id: string
          is_active: boolean | null
          jurisdiction_code: string | null
          organization_id: string
          source_id: string | null
          source_type: string
          title: string
        }
        Insert: {
          chunk_index?: number | null
          chunk_total?: number | null
          content_chunk: string
          created_at?: string | null
          document_type?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_code?: string | null
          organization_id: string
          source_id?: string | null
          source_type: string
          title: string
        }
        Update: {
          chunk_index?: number | null
          chunk_total?: number | null
          content_chunk?: string
          created_at?: string | null
          document_type?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_code?: string | null
          organization_id?: string
          source_id?: string | null
          source_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "genius_knowledge_tenant_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      genius_legal_sources: {
        Row: {
          content: string | null
          created_at: string | null
          effective_date: string | null
          expiry_date: string | null
          id: string
          is_current: boolean | null
          jurisdiction: string | null
          language: string | null
          reference_number: string | null
          source_type: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          version: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          is_current?: boolean | null
          jurisdiction?: string | null
          language?: string | null
          reference_number?: string | null
          source_type?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          version?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          is_current?: boolean | null
          jurisdiction?: string | null
          language?: string | null
          reference_number?: string | null
          source_type?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          version?: number | null
        }
        Relationships: []
      }
      genius_messages: {
        Row: {
          action_data: Json | null
          action_executed_at: string | null
          action_status: string | null
          content: string
          content_type: string | null
          conversation_id: string
          cost_eur: number | null
          created_at: string | null
          document_jurisdiction: string | null
          document_language: string | null
          document_type: string | null
          id: string
          model_used: string | null
          organization_id: string
          proposed_action: string | null
          rag_sources: Json | null
          role: string
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          action_data?: Json | null
          action_executed_at?: string | null
          action_status?: string | null
          content: string
          content_type?: string | null
          conversation_id: string
          cost_eur?: number | null
          created_at?: string | null
          document_jurisdiction?: string | null
          document_language?: string | null
          document_type?: string | null
          id?: string
          model_used?: string | null
          organization_id: string
          proposed_action?: string | null
          rag_sources?: Json | null
          role: string
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          action_data?: Json | null
          action_executed_at?: string | null
          action_status?: string | null
          content?: string
          content_type?: string | null
          conversation_id?: string
          cost_eur?: number | null
          created_at?: string | null
          document_jurisdiction?: string | null
          document_language?: string | null
          document_type?: string | null
          id?: string
          model_used?: string | null
          organization_id?: string
          proposed_action?: string | null
          rag_sources?: Json | null
          role?: string
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "genius_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "genius_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      genius_tenant_config: {
        Row: {
          created_at: string | null
          current_month_actions: number | null
          current_month_documents: number | null
          current_month_queries: number | null
          current_month_reset_at: string | null
          disclaimer_accepted: boolean | null
          disclaimer_accepted_at: string | null
          disclaimer_accepted_by: string | null
          feature_app_actions: boolean | null
          feature_document_generation: boolean | null
          feature_proactive_analysis: boolean | null
          feature_web_search: boolean | null
          id: string
          is_active: boolean | null
          max_actions_per_month: number | null
          max_documents_per_month: number | null
          max_queries_per_month: number | null
          organization_id: string
          plan_code: string | null
          preferred_language: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_month_actions?: number | null
          current_month_documents?: number | null
          current_month_queries?: number | null
          current_month_reset_at?: string | null
          disclaimer_accepted?: boolean | null
          disclaimer_accepted_at?: string | null
          disclaimer_accepted_by?: string | null
          feature_app_actions?: boolean | null
          feature_document_generation?: boolean | null
          feature_proactive_analysis?: boolean | null
          feature_web_search?: boolean | null
          id?: string
          is_active?: boolean | null
          max_actions_per_month?: number | null
          max_documents_per_month?: number | null
          max_queries_per_month?: number | null
          organization_id: string
          plan_code?: string | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_month_actions?: number | null
          current_month_documents?: number | null
          current_month_queries?: number | null
          current_month_reset_at?: string | null
          disclaimer_accepted?: boolean | null
          disclaimer_accepted_at?: string | null
          disclaimer_accepted_by?: string | null
          feature_app_actions?: boolean | null
          feature_document_generation?: boolean | null
          feature_proactive_analysis?: boolean | null
          feature_web_search?: boolean | null
          id?: string
          is_active?: boolean | null
          max_actions_per_month?: number | null
          max_documents_per_month?: number | null
          max_queries_per_month?: number | null
          organization_id?: string
          plan_code?: string | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "genius_tenant_config_disclaimer_accepted_by_fkey"
            columns: ["disclaimer_accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genius_tenant_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      genius_trademark_comparisons: {
        Row: {
          ai_explanation: string | null
          ai_recommendation: string | null
          analysis_details: Json | null
          analysis_method: string | null
          conceptual_score: number | null
          created_at: string
          created_by: string | null
          id: string
          image_a_url: string | null
          image_b_url: string | null
          organization_id: string | null
          overall_score: number | null
          phonetic_score: number | null
          term_a: string
          term_b: string
          visual_score: number | null
        }
        Insert: {
          ai_explanation?: string | null
          ai_recommendation?: string | null
          analysis_details?: Json | null
          analysis_method?: string | null
          conceptual_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_a_url?: string | null
          image_b_url?: string | null
          organization_id?: string | null
          overall_score?: number | null
          phonetic_score?: number | null
          term_a: string
          term_b: string
          visual_score?: number | null
        }
        Update: {
          ai_explanation?: string | null
          ai_recommendation?: string | null
          analysis_details?: Json | null
          analysis_method?: string | null
          conceptual_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_a_url?: string | null
          image_b_url?: string | null
          organization_id?: string | null
          overall_score?: number | null
          phonetic_score?: number | null
          term_a?: string
          term_b?: string
          visual_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "genius_trademark_comparisons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      help_announcement_reads: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      help_announcements: {
        Row: {
          affected_modules: string[] | null
          announcement_type: string | null
          audience: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          expire_at: string | null
          id: string
          image_url: string | null
          is_breaking_change: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          learn_more_url: string | null
          publish_at: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          version: string | null
          video_url: string | null
        }
        Insert: {
          affected_modules?: string[] | null
          announcement_type?: string | null
          audience?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          expire_at?: string | null
          id?: string
          image_url?: string | null
          is_breaking_change?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          learn_more_url?: string | null
          publish_at?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          version?: string | null
          video_url?: string | null
        }
        Update: {
          affected_modules?: string[] | null
          announcement_type?: string | null
          audience?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          expire_at?: string | null
          id?: string
          image_url?: string | null
          is_breaking_change?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          learn_more_url?: string | null
          publish_at?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          version?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      help_article_feedback: {
        Row: {
          article_id: string
          comment: string | null
          created_at: string
          helpful: boolean | null
          id: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          article_id: string
          comment?: string | null
          created_at?: string
          helpful?: boolean | null
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          article_id?: string
          comment?: string | null
          created_at?: string
          helpful?: boolean | null
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          article_type: string | null
          category_id: string | null
          content: string | null
          content_es: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          excerpt: string | null
          excerpt_es: string | null
          featured_image: string | null
          helpful_count: number | null
          helpful_no: number | null
          helpful_yes: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          language: string | null
          meta_description: string | null
          meta_title: string | null
          module: string | null
          not_helpful_count: number | null
          published_at: string | null
          search_vector: unknown
          slug: string | null
          sort_order: number | null
          status: string | null
          summary: string | null
          tags: string[] | null
          title: string | null
          title_es: string | null
          translations: Json | null
          updated_at: string | null
          video_duration: number | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          article_type?: string | null
          category_id?: string | null
          content?: string | null
          content_es?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          excerpt?: string | null
          excerpt_es?: string | null
          featured_image?: string | null
          helpful_count?: number | null
          helpful_no?: number | null
          helpful_yes?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          language?: string | null
          meta_description?: string | null
          meta_title?: string | null
          module?: string | null
          not_helpful_count?: number | null
          published_at?: string | null
          search_vector?: unknown
          slug?: string | null
          sort_order?: number | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          title_es?: string | null
          translations?: Json | null
          updated_at?: string | null
          video_duration?: number | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          article_type?: string | null
          category_id?: string | null
          content?: string | null
          content_es?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          excerpt?: string | null
          excerpt_es?: string | null
          featured_image?: string | null
          helpful_count?: number | null
          helpful_no?: number | null
          helpful_yes?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          language?: string | null
          meta_description?: string | null
          meta_title?: string | null
          module?: string | null
          not_helpful_count?: number | null
          published_at?: string | null
          search_vector?: unknown
          slug?: string | null
          sort_order?: number | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          title_es?: string | null
          translations?: Json | null
          updated_at?: string | null
          video_duration?: number | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      help_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          description_es: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string | null
          parent_id: string | null
          slug: string | null
          sort_order: number | null
          title: string | null
          title_es: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_es?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          parent_id?: string | null
          slug?: string | null
          sort_order?: number | null
          title?: string | null
          title_es?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_es?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          parent_id?: string | null
          slug?: string | null
          sort_order?: number | null
          title?: string | null
          title_es?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      help_faqs: {
        Row: {
          answer: string | null
          answer_es: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string | null
          question_es: string | null
          sort_order: number | null
        }
        Insert: {
          answer?: string | null
          answer_es?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string | null
          question_es?: string | null
          sort_order?: number | null
        }
        Update: {
          answer?: string | null
          answer_es?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string | null
          question_es?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      help_rule_execution_log: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          result: string | null
          rule_id: string | null
          trigger_data: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          result?: string | null
          rule_id?: string | null
          trigger_data?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          result?: string | null
          rule_id?: string | null
          trigger_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_rule_execution_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_rule_execution_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "help_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      help_rule_triggers: {
        Row: {
          created_at: string | null
          id: string
          rule_id: string | null
          trigger_config: Json | null
          trigger_target: string | null
          trigger_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rule_id?: string | null
          trigger_config?: Json | null
          trigger_target?: string | null
          trigger_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rule_id?: string | null
          trigger_config?: Json | null
          trigger_target?: string | null
          trigger_type?: string | null
        }
        Relationships: []
      }
      help_rules: {
        Row: {
          action_config: Json | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          rule_type: string | null
          trigger_config: Json | null
          updated_at: string
        }
        Insert: {
          action_config?: Json | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          rule_type?: string | null
          trigger_config?: Json | null
          updated_at?: string
        }
        Update: {
          action_config?: Json | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          rule_type?: string | null
          trigger_config?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      help_search_logs: {
        Row: {
          clicked_article_id: string | null
          context_module: string | null
          context_page: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          query: string | null
          results_count: number | null
          user_id: string | null
        }
        Insert: {
          clicked_article_id?: string | null
          context_module?: string | null
          context_page?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          query?: string | null
          results_count?: number | null
          user_id?: string | null
        }
        Update: {
          clicked_article_id?: string | null
          context_module?: string | null
          context_page?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          query?: string | null
          results_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      help_system_status: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          message: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      help_tooltips: {
        Row: {
          content: string | null
          content_es: string | null
          created_at: string | null
          element_selector: string | null
          id: string
          is_active: boolean | null
          module: string | null
          page: string | null
          placement: string | null
          title: string | null
          title_es: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_es?: string | null
          created_at?: string | null
          element_selector?: string | null
          id?: string
          is_active?: boolean | null
          module?: string | null
          page?: string | null
          placement?: string | null
          title?: string | null
          title_es?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_es?: string | null
          created_at?: string | null
          element_selector?: string | null
          id?: string
          is_active?: boolean | null
          module?: string | null
          page?: string | null
          placement?: string | null
          title?: string | null
          title_es?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      help_tour_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          skipped: boolean | null
          step_index: number | null
          tour_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          skipped?: boolean | null
          step_index?: number | null
          tour_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          skipped?: boolean | null
          step_index?: number | null
          tour_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      help_tours: {
        Row: {
          created_at: string | null
          description: string | null
          description_es: string | null
          id: string
          is_active: boolean | null
          module: string | null
          name: string | null
          name_es: string | null
          sort_order: number | null
          steps: Json | null
          target_page: string | null
          target_role: string | null
          trigger_event: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_es?: string | null
          id?: string
          is_active?: boolean | null
          module?: string | null
          name?: string | null
          name_es?: string | null
          sort_order?: number | null
          steps?: Json | null
          target_page?: string | null
          target_role?: string | null
          trigger_event?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_es?: string | null
          id?: string
          is_active?: boolean | null
          module?: string | null
          name?: string | null
          name_es?: string | null
          sort_order?: number | null
          steps?: Json | null
          target_page?: string | null
          target_role?: string | null
          trigger_event?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      holders: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          holder_code: string | null
          holder_type: string | null
          id: string
          is_active: boolean | null
          name: string | null
          notes: string | null
          organization_id: string | null
          postal_code: string | null
          state: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          holder_code?: string | null
          holder_type?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          postal_code?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          holder_code?: string | null
          holder_type?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          postal_code?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      import_files: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          import_job_id: string | null
          parsed_data: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          import_job_id?: string | null
          parsed_data?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          import_job_id?: string | null
          parsed_data?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          entity_type: string | null
          error_log: Json | null
          id: string
          import_type: string | null
          mapping: Json | null
          metadata: Json | null
          organization_id: string | null
          records_failed: number | null
          records_processed: number | null
          records_total: number | null
          source_file_url: string | null
          source_type: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          entity_type?: string | null
          error_log?: Json | null
          id?: string
          import_type?: string | null
          mapping?: Json | null
          metadata?: Json | null
          organization_id?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_total?: number | null
          source_file_url?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          entity_type?: string | null
          error_log?: Json | null
          id?: string
          import_type?: string | null
          mapping?: Json | null
          metadata?: Json | null
          organization_id?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_total?: number | null
          source_file_url?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      import_mapping_templates: {
        Row: {
          column_mappings: Json | null
          created_at: string | null
          description: string | null
          entity_type: string | null
          id: string
          name: string | null
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          column_mappings?: Json | null
          created_at?: string | null
          description?: string | null
          entity_type?: string | null
          id?: string
          name?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          column_mappings?: Json | null
          created_at?: string | null
          description?: string | null
          entity_type?: string | null
          id?: string
          name?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      import_review_queue: {
        Row: {
          action: string | null
          created_at: string | null
          entity_type: string | null
          id: string
          import_id: string | null
          matched_record_id: string | null
          organization_id: string | null
          raw_data: Json | null
          resolved_at: string | null
          resolved_by: string | null
          review_reason: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          entity_type?: string | null
          id?: string
          import_id?: string | null
          matched_record_id?: string | null
          organization_id?: string | null
          raw_data?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_reason?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          entity_type?: string | null
          id?: string
          import_id?: string | null
          matched_record_id?: string | null
          organization_id?: string | null
          raw_data?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_reason?: string | null
          status?: string | null
        }
        Relationships: []
      }
      import_scraping_rules: {
        Row: {
          confidence_threshold: number | null
          country_code: string | null
          created_at: string | null
          css_selectors: Json | null
          id: string
          is_active: boolean | null
          last_used: string | null
          office_type: string | null
          success_rate: number | null
          updated_at: string | null
          url_pattern: string | null
          xpath_selectors: Json | null
        }
        Insert: {
          confidence_threshold?: number | null
          country_code?: string | null
          created_at?: string | null
          css_selectors?: Json | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          office_type?: string | null
          success_rate?: number | null
          updated_at?: string | null
          url_pattern?: string | null
          xpath_selectors?: Json | null
        }
        Update: {
          confidence_threshold?: number | null
          country_code?: string | null
          created_at?: string | null
          css_selectors?: Json | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          office_type?: string | null
          success_rate?: number | null
          updated_at?: string | null
          url_pattern?: string | null
          xpath_selectors?: Json | null
        }
        Relationships: []
      }
      import_snapshots: {
        Row: {
          change_type: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          import_id: string | null
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          change_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          import_id?: string | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          change_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          import_id?: string | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: []
      }
      import_sources: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_import_at: string | null
          name: string | null
          source_type: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_import_at?: string | null
          name?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_import_at?: string | null
          name?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      import_sync_configs: {
        Row: {
          created_at: string | null
          entity_type: string | null
          id: string
          last_sync_at: string | null
          match_fields: string[] | null
          merge_strategy: string | null
          organization_id: string | null
          source_id: string | null
          sync_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_type?: string | null
          id?: string
          last_sync_at?: string | null
          match_fields?: string[] | null
          merge_strategy?: string | null
          organization_id?: string | null
          source_id?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_type?: string | null
          id?: string
          last_sync_at?: string | null
          match_fields?: string[] | null
          merge_strategy?: string | null
          organization_id?: string | null
          source_id?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      import_templates: {
        Row: {
          column_count: number | null
          column_mappings: Json | null
          created_at: string | null
          entity_type: string | null
          headers: string[] | null
          id: string
          name: string | null
          organization_id: string | null
          preview_rows: Json | null
          sample_data: Json | null
          updated_at: string | null
        }
        Insert: {
          column_count?: number | null
          column_mappings?: Json | null
          created_at?: string | null
          entity_type?: string | null
          headers?: string[] | null
          id?: string
          name?: string | null
          organization_id?: string | null
          preview_rows?: Json | null
          sample_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          column_count?: number | null
          column_mappings?: Json | null
          created_at?: string | null
          entity_type?: string | null
          headers?: string[] | null
          id?: string
          name?: string | null
          organization_id?: string | null
          preview_rows?: Json | null
          sample_data?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      importable_fields: {
        Row: {
          created_at: string | null
          default_value: string | null
          description: string | null
          display_name: string | null
          entity_type: string | null
          field_name: string | null
          field_type: string | null
          id: string
          is_required: boolean | null
          sort_order: number | null
          validation_regex: string | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          display_name?: string | null
          entity_type?: string | null
          field_name?: string | null
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          validation_regex?: string | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          display_name?: string | null
          entity_type?: string | null
          field_name?: string | null
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          validation_regex?: string | null
        }
        Relationships: []
      }
      imports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          duplicates_count: number | null
          entity_type: string | null
          errors: Json | null
          file_name: string | null
          file_path: string | null
          id: string
          organization_id: string | null
          records_count: number | null
          records_imported: number | null
          source: string | null
          started_at: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          duplicates_count?: number | null
          entity_type?: string | null
          errors?: Json | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          organization_id?: string | null
          records_count?: number | null
          records_imported?: number | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          duplicates_count?: number | null
          entity_type?: string | null
          errors?: Json | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          organization_id?: string | null
          records_count?: number | null
          records_imported?: number | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      intelligence_config: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          key: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      internal_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          organization_id: string | null
          read_at: string | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          organization_id?: string | null
          read_at?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          organization_id?: string | null
          read_at?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      internal_reference_config: {
        Row: {
          created_at: string | null
          description: string | null
          format_pattern: string | null
          id: string
          is_active: boolean | null
          last_generated_at: string | null
          matter_type: string | null
          organization_id: string | null
          prefix: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          format_pattern?: string | null
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          matter_type?: string | null
          organization_id?: string | null
          prefix?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          format_pattern?: string | null
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          matter_type?: string | null
          organization_id?: string | null
          prefix?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      internal_reference_sequences: {
        Row: {
          created_at: string | null
          current_value: number | null
          id: string
          organization_id: string | null
          sequence_key: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          organization_id?: string | null
          sequence_key?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          organization_id?: string | null
          sequence_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          detail: string | null
          discount_pct: number | null
          id: string
          invoice_id: string
          jurisdiction_code: string | null
          line_type: string
          matter_id: string | null
          nice_class: number | null
          organization_id: string
          quantity: number | null
          sort_order: number | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          detail?: string | null
          discount_pct?: number | null
          id?: string
          invoice_id: string
          jurisdiction_code?: string | null
          line_type?: string
          matter_id?: string | null
          nice_class?: number | null
          organization_id: string
          quantity?: number | null
          sort_order?: number | null
          subtotal: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          detail?: string | null
          discount_pct?: number | null
          id?: string
          invoice_id?: string
          jurisdiction_code?: string | null
          line_type?: string
          matter_id?: string | null
          nice_class?: number | null
          organization_id?: string
          quantity?: number | null
          sort_order?: number | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          currency: string | null
          id: string
          invoice_id: string
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method: string | null
          reference: string | null
          stripe_payment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string | null
          reference?: string | null
          stripe_payment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string | null
          reference?: string | null
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_sequences: {
        Row: {
          format: string | null
          id: string
          last_number: number | null
          organization_id: string
          prefix: string | null
          series: string
          year: number
        }
        Insert: {
          format?: string | null
          id?: string
          last_number?: number | null
          organization_id: string
          prefix?: string | null
          series?: string
          year?: number
        }
        Update: {
          format?: string | null
          id?: string
          last_number?: number | null
          organization_id?: string
          prefix?: string | null
          series?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          bank_account: string | null
          billing_client_id: string | null
          client_address: string | null
          client_name: string
          client_tax_id: string | null
          corrected_invoice_id: string | null
          correction_description: string | null
          correction_reason: string | null
          created_at: string
          created_by: string | null
          crm_account_id: string | null
          crm_deal_id: string | null
          currency: string | null
          discount_amount: number | null
          due_date: string | null
          expenses_subtotal: number | null
          facturae_certificate_id: string | null
          facturae_signed: boolean | null
          facturae_xml: string | null
          footer_text: string | null
          full_number: string | null
          id: string
          internal_notes: string | null
          invoice_date: string
          invoice_number: string
          invoice_series: string | null
          invoice_type: string | null
          matter_id: string | null
          notes: string | null
          official_fees_subtotal: number | null
          organization_id: string
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          payment_method_code: string | null
          payment_reference: string | null
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          professional_fees_subtotal: number | null
          sent_at: string | null
          sent_to_email: string | null
          series: string | null
          sii_csv: string | null
          sii_registration_key: string | null
          sii_response: Json | null
          sii_sent_at: string | null
          sii_status: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_point_date: string | null
          tax_rate: number | null
          tbai_chain_hash: string | null
          tbai_identifier: string | null
          tbai_qr_url: string | null
          tbai_sent_at: string | null
          tbai_signature: string | null
          tbai_status: string | null
          total: number
          total_surcharge: number | null
          total_withholding: number | null
          updated_at: string
          vat_breakdown: Json | null
          verifactu_hash: string | null
          verifactu_id: string | null
          verifactu_qr: string | null
          verifactu_sent_at: string | null
          verifactu_status: string | null
          viewed_at: string | null
          withholding_percent: number | null
        }
        Insert: {
          bank_account?: string | null
          billing_client_id?: string | null
          client_address?: string | null
          client_name: string
          client_tax_id?: string | null
          corrected_invoice_id?: string | null
          correction_description?: string | null
          correction_reason?: string | null
          created_at?: string
          created_by?: string | null
          crm_account_id?: string | null
          crm_deal_id?: string | null
          currency?: string | null
          discount_amount?: number | null
          due_date?: string | null
          expenses_subtotal?: number | null
          facturae_certificate_id?: string | null
          facturae_signed?: boolean | null
          facturae_xml?: string | null
          footer_text?: string | null
          full_number?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number: string
          invoice_series?: string | null
          invoice_type?: string | null
          matter_id?: string | null
          notes?: string | null
          official_fees_subtotal?: number | null
          organization_id: string
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_method_code?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          professional_fees_subtotal?: number | null
          sent_at?: string | null
          sent_to_email?: string | null
          series?: string | null
          sii_csv?: string | null
          sii_registration_key?: string | null
          sii_response?: Json | null
          sii_sent_at?: string | null
          sii_status?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_point_date?: string | null
          tax_rate?: number | null
          tbai_chain_hash?: string | null
          tbai_identifier?: string | null
          tbai_qr_url?: string | null
          tbai_sent_at?: string | null
          tbai_signature?: string | null
          tbai_status?: string | null
          total?: number
          total_surcharge?: number | null
          total_withholding?: number | null
          updated_at?: string
          vat_breakdown?: Json | null
          verifactu_hash?: string | null
          verifactu_id?: string | null
          verifactu_qr?: string | null
          verifactu_sent_at?: string | null
          verifactu_status?: string | null
          viewed_at?: string | null
          withholding_percent?: number | null
        }
        Update: {
          bank_account?: string | null
          billing_client_id?: string | null
          client_address?: string | null
          client_name?: string
          client_tax_id?: string | null
          corrected_invoice_id?: string | null
          correction_description?: string | null
          correction_reason?: string | null
          created_at?: string
          created_by?: string | null
          crm_account_id?: string | null
          crm_deal_id?: string | null
          currency?: string | null
          discount_amount?: number | null
          due_date?: string | null
          expenses_subtotal?: number | null
          facturae_certificate_id?: string | null
          facturae_signed?: boolean | null
          facturae_xml?: string | null
          footer_text?: string | null
          full_number?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number?: string
          invoice_series?: string | null
          invoice_type?: string | null
          matter_id?: string | null
          notes?: string | null
          official_fees_subtotal?: number | null
          organization_id?: string
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_method_code?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          professional_fees_subtotal?: number | null
          sent_at?: string | null
          sent_to_email?: string | null
          series?: string | null
          sii_csv?: string | null
          sii_registration_key?: string | null
          sii_response?: Json | null
          sii_sent_at?: string | null
          sii_status?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_point_date?: string | null
          tax_rate?: number | null
          tbai_chain_hash?: string | null
          tbai_identifier?: string | null
          tbai_qr_url?: string | null
          tbai_sent_at?: string | null
          tbai_signature?: string | null
          tbai_status?: string | null
          total?: number
          total_surcharge?: number | null
          total_withholding?: number | null
          updated_at?: string
          vat_breakdown?: Json | null
          verifactu_hash?: string | null
          verifactu_id?: string | null
          verifactu_qr?: string | null
          verifactu_sent_at?: string | null
          verifactu_status?: string | null
          viewed_at?: string | null
          withholding_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_crm_account_id_fkey"
            columns: ["crm_account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_crm_deal_id_fkey"
            columns: ["crm_deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_chain_records: {
        Row: {
          algorithm: string | null
          block_number: number | null
          blockchain_network: string | null
          content_hash: string
          created_at: string | null
          created_by: string | null
          id: string
          matter_id: string | null
          metadata: Json | null
          organization_id: string
          record_type: string
          status: string | null
          transaction_hash: string | null
          verified_at: string | null
        }
        Insert: {
          algorithm?: string | null
          block_number?: number | null
          blockchain_network?: string | null
          content_hash: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          matter_id?: string | null
          metadata?: Json | null
          organization_id: string
          record_type?: string
          status?: string | null
          transaction_hash?: string | null
          verified_at?: string | null
        }
        Update: {
          algorithm?: string | null
          block_number?: number | null
          blockchain_network?: string | null
          content_hash?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          matter_id?: string | null
          metadata?: Json | null
          organization_id?: string
          record_type?: string
          status?: string | null
          transaction_hash?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_chain_records_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_chain_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_filing_submissions: {
        Row: {
          applicant_id: string | null
          applicant_name: string | null
          application_number: string | null
          application_status: string | null
          created_at: string | null
          created_by: string | null
          filing_date: string | null
          filing_type: string
          first_language: string | null
          id: string
          last_status_check: string | null
          mark_feature: string | null
          mark_name: string | null
          matter_id: string | null
          nice_classes: number[] | null
          office_id: string | null
          organization_id: string
          payment_amount: number | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          representative_id: string | null
          representative_name: string | null
          second_language: string | null
          status: string | null
          submission_date: string | null
          submission_errors: Json | null
          submission_payload: Json
          updated_at: string | null
          validation_errors: Json | null
        }
        Insert: {
          applicant_id?: string | null
          applicant_name?: string | null
          application_number?: string | null
          application_status?: string | null
          created_at?: string | null
          created_by?: string | null
          filing_date?: string | null
          filing_type: string
          first_language?: string | null
          id?: string
          last_status_check?: string | null
          mark_feature?: string | null
          mark_name?: string | null
          matter_id?: string | null
          nice_classes?: number[] | null
          office_id?: string | null
          organization_id: string
          payment_amount?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          representative_id?: string | null
          representative_name?: string | null
          second_language?: string | null
          status?: string | null
          submission_date?: string | null
          submission_errors?: Json | null
          submission_payload?: Json
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Update: {
          applicant_id?: string | null
          applicant_name?: string | null
          application_number?: string | null
          application_status?: string | null
          created_at?: string | null
          created_by?: string | null
          filing_date?: string | null
          filing_type?: string
          first_language?: string | null
          id?: string
          last_status_check?: string | null
          mark_feature?: string | null
          mark_name?: string | null
          matter_id?: string | null
          nice_classes?: number[] | null
          office_id?: string | null
          organization_id?: string
          payment_amount?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          representative_id?: string | null
          representative_name?: string | null
          second_language?: string | null
          status?: string | null
          submission_date?: string | null
          submission_errors?: Json | null
          submission_payload?: Json
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_filing_submissions_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_filing_submissions_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_filing_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_nice_classification: {
        Row: {
          class_id: string | null
          class_number: number | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          matter_id: string | null
          organization_id: string | null
          products: string[] | null
          selected_items: Json | null
          services: string[] | null
        }
        Insert: {
          class_id?: string | null
          class_number?: number | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          matter_id?: string | null
          organization_id?: string | null
          products?: string[] | null
          selected_items?: Json | null
          services?: string[] | null
        }
        Update: {
          class_id?: string | null
          class_number?: number | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          matter_id?: string | null
          organization_id?: string | null
          products?: string[] | null
          selected_items?: Json | null
          services?: string[] | null
        }
        Relationships: []
      }
      ip_office_apis: {
        Row: {
          auth_flow: string
          base_path: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          office_id: string | null
          required_scopes: string[] | null
          status: string | null
          version: string | null
        }
        Insert: {
          auth_flow: string
          base_path: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          office_id?: string | null
          required_scopes?: string[] | null
          status?: string | null
          version?: string | null
        }
        Update: {
          auth_flow?: string
          base_path?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          office_id?: string | null
          required_scopes?: string[] | null
          status?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_office_apis_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_office_fees: {
        Row: {
          additional_class_fee: number | null
          amount: number | null
          base_fee: number | null
          classes_included: number | null
          country_code: string | null
          created_at: string | null
          currency: string | null
          data_source: string | null
          effective_date: string | null
          fee_type: string | null
          id: string
          is_verified: boolean | null
          last_verified: string | null
          notes: string | null
          office_id: string | null
          right_type: string | null
          source: string | null
          source_url: string | null
          updated_at: string | null
          verified_by: string | null
        }
        Insert: {
          additional_class_fee?: number | null
          amount?: number | null
          base_fee?: number | null
          classes_included?: number | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          data_source?: string | null
          effective_date?: string | null
          fee_type?: string | null
          id?: string
          is_verified?: boolean | null
          last_verified?: string | null
          notes?: string | null
          office_id?: string | null
          right_type?: string | null
          source?: string | null
          source_url?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Update: {
          additional_class_fee?: number | null
          amount?: number | null
          base_fee?: number | null
          classes_included?: number | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          data_source?: string | null
          effective_date?: string | null
          fee_type?: string | null
          id?: string
          is_verified?: boolean | null
          last_verified?: string | null
          notes?: string | null
          office_id?: string | null
          right_type?: string | null
          source?: string | null
          source_url?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      ip_office_research_queue: {
        Row: {
          auto_confidence_score: number | null
          country_code: string
          created_at: string | null
          estimated_cost_usd: number | null
          id: string
          needs_human_review: boolean | null
          office_id: string | null
          office_name: string
          parsed_data: Json | null
          phase_1_general: Json | null
          phase_2_trademarks: Json | null
          phase_3_fees: Json | null
          phase_4_treaties: Json | null
          phase_5_digital: Json | null
          phase_6_requirements: Json | null
          priority: number | null
          research_completed_at: string | null
          research_started_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          total_queries_made: number | null
          total_tokens_used: number | null
          updated_at: string | null
        }
        Insert: {
          auto_confidence_score?: number | null
          country_code: string
          created_at?: string | null
          estimated_cost_usd?: number | null
          id?: string
          needs_human_review?: boolean | null
          office_id?: string | null
          office_name: string
          parsed_data?: Json | null
          phase_1_general?: Json | null
          phase_2_trademarks?: Json | null
          phase_3_fees?: Json | null
          phase_4_treaties?: Json | null
          phase_5_digital?: Json | null
          phase_6_requirements?: Json | null
          priority?: number | null
          research_completed_at?: string | null
          research_started_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          total_queries_made?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_confidence_score?: number | null
          country_code?: string
          created_at?: string | null
          estimated_cost_usd?: number | null
          id?: string
          needs_human_review?: boolean | null
          office_id?: string | null
          office_name?: string
          parsed_data?: Json | null
          phase_1_general?: Json | null
          phase_2_trademarks?: Json | null
          phase_3_fees?: Json | null
          phase_4_treaties?: Json | null
          phase_5_digital?: Json | null
          phase_6_requirements?: Json | null
          priority?: number | null
          research_completed_at?: string | null
          research_started_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          total_queries_made?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_office_research_queue_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_office_update_logs: {
        Row: {
          action: string
          created_at: string | null
          created_by: string | null
          details: Json | null
          id: string
          source: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          id?: string
          source?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      ip_trademark_searches: {
        Row: {
          created_at: string | null
          id: string
          nice_classes: number[] | null
          notes: string | null
          office_code: string
          organization_id: string
          related_matter_id: string | null
          results_snapshot: Json | null
          search_term: string
          status_filter: string[] | null
          total_results: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nice_classes?: number[] | null
          notes?: string | null
          office_code: string
          organization_id: string
          related_matter_id?: string | null
          results_snapshot?: Json | null
          search_term: string
          status_filter?: string[] | null
          total_results?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nice_classes?: number[] | null
          notes?: string | null
          office_code?: string
          organization_id?: string
          related_matter_id?: string | null
          results_snapshot?: Json | null
          search_term?: string
          status_filter?: string[] | null
          total_results?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_trademark_searches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_trademark_searches_related_matter_id_fkey"
            columns: ["related_matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      ipc_classes: {
        Row: {
          class_code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          section_id: string | null
          title_en: string | null
          title_es: string | null
        }
        Insert: {
          class_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          section_id?: string | null
          title_en?: string | null
          title_es?: string | null
        }
        Update: {
          class_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          section_id?: string | null
          title_en?: string | null
          title_es?: string | null
        }
        Relationships: []
      }
      ipc_groups: {
        Row: {
          class_id: string | null
          created_at: string | null
          group_code: string | null
          id: string
          is_active: boolean | null
          subclass_id: string | null
          title_en: string | null
          title_es: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          group_code?: string | null
          id?: string
          is_active?: boolean | null
          subclass_id?: string | null
          title_en?: string | null
          title_es?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          group_code?: string | null
          id?: string
          is_active?: boolean | null
          subclass_id?: string | null
          title_en?: string | null
          title_es?: string | null
        }
        Relationships: []
      }
      ipc_sections: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          title_en: string | null
          title_es: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title_en?: string | null
          title_es?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title_en?: string | null
          title_es?: string | null
        }
        Relationships: []
      }
      ipc_subclasses: {
        Row: {
          class_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          subclass_code: string | null
          title_en: string | null
          title_es: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subclass_code?: string | null
          title_en?: string | null
          title_es?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subclass_code?: string | null
          title_en?: string | null
          title_es?: string | null
        }
        Relationships: []
      }
      ipo_enrich_runs: {
        Row: {
          completed_at: string | null
          country_code: string | null
          created_at: string | null
          enrichment_type: string | null
          error_details: string | null
          fields_enriched: string[] | null
          fields_found: Json | null
          id: string
          office_id: string | null
          prompt_tokens: number | null
          response_tokens: number | null
          source: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          country_code?: string | null
          created_at?: string | null
          enrichment_type?: string | null
          error_details?: string | null
          fields_enriched?: string[] | null
          fields_found?: Json | null
          id?: string
          office_id?: string | null
          prompt_tokens?: number | null
          response_tokens?: number | null
          source?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          country_code?: string | null
          created_at?: string | null
          enrichment_type?: string | null
          error_details?: string | null
          fields_enriched?: string[] | null
          fields_found?: Json | null
          id?: string
          office_id?: string | null
          prompt_tokens?: number | null
          response_tokens?: number | null
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ipo_fee_history: {
        Row: {
          change_source: string | null
          change_type: string | null
          changed_by: string | null
          country_code: string | null
          created_at: string | null
          effective_date: string | null
          fee_type: string | null
          id: string
          new_amount: number | null
          new_currency: string | null
          notes: string | null
          old_amount: number | null
          old_currency: string | null
          right_type: string | null
        }
        Insert: {
          change_source?: string | null
          change_type?: string | null
          changed_by?: string | null
          country_code?: string | null
          created_at?: string | null
          effective_date?: string | null
          fee_type?: string | null
          id?: string
          new_amount?: number | null
          new_currency?: string | null
          notes?: string | null
          old_amount?: number | null
          old_currency?: string | null
          right_type?: string | null
        }
        Update: {
          change_source?: string | null
          change_type?: string | null
          changed_by?: string | null
          country_code?: string | null
          created_at?: string | null
          effective_date?: string | null
          fee_type?: string | null
          id?: string
          new_amount?: number | null
          new_currency?: string | null
          notes?: string | null
          old_amount?: number | null
          old_currency?: string | null
          right_type?: string | null
        }
        Relationships: []
      }
      ipo_market_intel: {
        Row: {
          country_code: string | null
          created_at: string | null
          data_type: string | null
          data_value: Json | null
          id: string
          source: string | null
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          data_type?: string | null
          data_value?: Json | null
          id?: string
          source?: string | null
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          data_type?: string | null
          data_value?: Json | null
          id?: string
          source?: string | null
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ipo_offices: {
        Row: {
          accepted_filing_languages: string[] | null
          accepted_languages: Json | null
          accepted_mark_types: Json | null
          address: string | null
          agent_required: boolean | null
          agent_required_for_foreign: boolean | null
          agent_requirement_type: string | null
          annual_filing_volume: number | null
          api_authentication_type: string | null
          api_base_url: string | null
          api_config: Json | null
          api_credentials: Json | null
          api_documentation_url: string | null
          api_sandbox_available: boolean | null
          api_type: string | null
          api_url: string | null
          api_version: string | null
          appeal_procedure: Json | null
          approval_rate_pct: number | null
          assignment_form_url: string | null
          auth_type: string | null
          automation_level: string | null
          automation_percentage: number | null
          avg_days_opposition_period: number | null
          avg_days_to_decision: number | null
          avg_days_to_first_action: number | null
          avg_days_to_publication: number | null
          avg_response_time_ms: number | null
          best_practices: Json | null
          bulk_data_available: boolean | null
          cancellation_procedure: Json | null
          capabilities: Json | null
          city: string | null
          code: string
          code_alt: string | null
          common_mistakes: Json | null
          common_rejection_reasons: Json | null
          connection_config: Json | null
          connection_status: string | null
          contact_appeals_dept: string | null
          contact_trademarks_dept: string | null
          contact_urgent: string | null
          country_code: string | null
          country_flag: string | null
          country_name: string | null
          created_at: string
          credentials_encrypted: string | null
          currency: string | null
          data_completeness_score: number | null
          data_confidence: string | null
          data_last_verified_at: string | null
          data_last_verified_by: string | null
          data_quality_flag: string | null
          data_quality_notes: string | null
          data_source: string | null
          data_source_config: Json | null
          data_source_notes: string | null
          data_source_type: string | null
          default_partner_id: string | null
          digital_maturity_score: number | null
          digital_score: number | null
          digitalization_level: string | null
          director_name: string | null
          director_title: string | null
          display_order: number | null
          documents_required: Json | null
          e_filing_available: boolean | null
          e_filing_url: string | null
          electronic_signature: boolean | null
          email_general: string | null
          exam_criteria_url: string | null
          exam_gazette_url: string | null
          exam_guidelines_year: number | null
          exam_type: string | null
          examiner_patterns: Json | null
          fax: string | null
          fee_last_verified_at: string | null
          fee_schedule_url: string | null
          fees_source_notes: string | null
          fees_url: string | null
          filing_volume_growth_pct: number | null
          filing_volume_year: number | null
          flag: string | null
          flag_emoji: string | null
          genius_coverage_level: string | null
          genius_coverage_score: number | null
          genius_kb_chunks: number | null
          genius_last_kb_update: string | null
          grace_period_days: number | null
          handles_designs: boolean | null
          handles_patents: boolean | null
          handles_trademarks: boolean | null
          handles_utility_models: boolean | null
          has_api: boolean | null
          id: string
          insights_updated_at: string | null
          internal_notes: string | null
          ip_types: string[] | null
          is_active: boolean | null
          is_connected: boolean | null
          languages: string[] | null
          last_data_verification: string | null
          last_health_check: string | null
          last_interaction_at: string | null
          last_sync_at: string | null
          last_sync_status: string | null
          last_sync_type: string | null
          latam_relevance_score: number | null
          linkedin_page: string | null
          main_rejection_reasons: Json | null
          member_madrid_protocol: boolean | null
          name: string | null
          name_en: string | null
          name_es: string | null
          name_official: string
          name_short: string | null
          next_review_date: string | null
          nice_version: string | null
          notes: string | null
          office_acronym: string | null
          office_hours: string | null
          office_type: string | null
          official_gazette_url: string | null
          online_payment: boolean | null
          open_data_available: boolean | null
          operational_status: string | null
          opposition_count_from: string | null
          opposition_extensible: boolean | null
          opposition_form_url: string | null
          opposition_legal_basis: string | null
          opposition_max_extension_days: number | null
          opposition_period_days: number | null
          opposition_procedure: Json | null
          opposition_success_rate: number | null
          paris_convention_member: boolean | null
          payment_methods: Json | null
          phone_general: string | null
          poa_notarization_required: boolean | null
          power_of_attorney_required: boolean | null
          preparation_tips: string | null
          priority_claim_months: number | null
          priority_score: number | null
          product_id: string | null
          rate_limit_per_day: number | null
          rate_limit_per_minute: number | null
          region: string | null
          registration_timeline_days: number | null
          rejection_rate: number | null
          rejection_rate_pct: number | null
          renewal_form_url: string | null
          renewal_grace_period_days: number | null
          renewal_period_years: number | null
          renewal_procedure: Json | null
          rep_requirement_notes: string | null
          rep_requirement_type: string | null
          requires_local_agent: boolean | null
          requires_translation: boolean | null
          search_url: string | null
          spanish_companies_active: boolean | null
          special_requirements: Json | null
          stats_patent_applications: number | null
          stats_patent_grants: number | null
          stats_source_url: string | null
          stats_tm_applications: number | null
          stats_tm_registrations: number | null
          stats_year: number | null
          status: string | null
          success_rate_approvals: number | null
          success_rate_sample_size: number | null
          success_rate_updated_at: string | null
          support_email: string | null
          support_phone: string | null
          supported_ip_types: string[] | null
          supported_mark_types: Json | null
          supports_documents: boolean | null
          supports_events: boolean | null
          supports_fees: boolean | null
          supports_search: boolean | null
          supports_status: boolean | null
          sync_frequency: string | null
          tier: string | null
          timezone: string | null
          tm_appeal_fee: number | null
          tm_class_extra_fee: number | null
          tm_estimated_registration_months: number | null
          tm_expedited_fee: number | null
          tm_fee_change_pct_last: number | null
          tm_fee_currency: string | null
          tm_fee_last_change_date: string | null
          tm_fee_next_review_date: string | null
          tm_filing_fee: number | null
          tm_multi_class: boolean | null
          tm_online_filing_url: string | null
          tm_opposition_fee: number | null
          tm_opposition_period_days: number | null
          tm_recordal_fee: number | null
          tm_registration_duration_years: number | null
          tm_renewal_fee: number | null
          tm_search_url: string | null
          tm_use_requirement: boolean | null
          tmview_available: boolean | null
          top_filing_countries: Json | null
          top_filing_sectors: Json | null
          total_filings_tracked: number | null
          translation_languages: Json | null
          translation_required: boolean | null
          translation_requirements: string | null
          ub_integration_notes: string | null
          ub_integration_status: string | null
          updated_at: string
          url_status: string | null
          use_requirement_details: string | null
          use_requirement_years: number | null
          uses_nice_classification: boolean | null
          website_main: string | null
          website_official: string | null
          website_search: string | null
          wipo_madrid_code: string | null
          working_hours: Json | null
        }
        Insert: {
          accepted_filing_languages?: string[] | null
          accepted_languages?: Json | null
          accepted_mark_types?: Json | null
          address?: string | null
          agent_required?: boolean | null
          agent_required_for_foreign?: boolean | null
          agent_requirement_type?: string | null
          annual_filing_volume?: number | null
          api_authentication_type?: string | null
          api_base_url?: string | null
          api_config?: Json | null
          api_credentials?: Json | null
          api_documentation_url?: string | null
          api_sandbox_available?: boolean | null
          api_type?: string | null
          api_url?: string | null
          api_version?: string | null
          appeal_procedure?: Json | null
          approval_rate_pct?: number | null
          assignment_form_url?: string | null
          auth_type?: string | null
          automation_level?: string | null
          automation_percentage?: number | null
          avg_days_opposition_period?: number | null
          avg_days_to_decision?: number | null
          avg_days_to_first_action?: number | null
          avg_days_to_publication?: number | null
          avg_response_time_ms?: number | null
          best_practices?: Json | null
          bulk_data_available?: boolean | null
          cancellation_procedure?: Json | null
          capabilities?: Json | null
          city?: string | null
          code: string
          code_alt?: string | null
          common_mistakes?: Json | null
          common_rejection_reasons?: Json | null
          connection_config?: Json | null
          connection_status?: string | null
          contact_appeals_dept?: string | null
          contact_trademarks_dept?: string | null
          contact_urgent?: string | null
          country_code?: string | null
          country_flag?: string | null
          country_name?: string | null
          created_at?: string
          credentials_encrypted?: string | null
          currency?: string | null
          data_completeness_score?: number | null
          data_confidence?: string | null
          data_last_verified_at?: string | null
          data_last_verified_by?: string | null
          data_quality_flag?: string | null
          data_quality_notes?: string | null
          data_source?: string | null
          data_source_config?: Json | null
          data_source_notes?: string | null
          data_source_type?: string | null
          default_partner_id?: string | null
          digital_maturity_score?: number | null
          digital_score?: number | null
          digitalization_level?: string | null
          director_name?: string | null
          director_title?: string | null
          display_order?: number | null
          documents_required?: Json | null
          e_filing_available?: boolean | null
          e_filing_url?: string | null
          electronic_signature?: boolean | null
          email_general?: string | null
          exam_criteria_url?: string | null
          exam_gazette_url?: string | null
          exam_guidelines_year?: number | null
          exam_type?: string | null
          examiner_patterns?: Json | null
          fax?: string | null
          fee_last_verified_at?: string | null
          fee_schedule_url?: string | null
          fees_source_notes?: string | null
          fees_url?: string | null
          filing_volume_growth_pct?: number | null
          filing_volume_year?: number | null
          flag?: string | null
          flag_emoji?: string | null
          genius_coverage_level?: string | null
          genius_coverage_score?: number | null
          genius_kb_chunks?: number | null
          genius_last_kb_update?: string | null
          grace_period_days?: number | null
          handles_designs?: boolean | null
          handles_patents?: boolean | null
          handles_trademarks?: boolean | null
          handles_utility_models?: boolean | null
          has_api?: boolean | null
          id?: string
          insights_updated_at?: string | null
          internal_notes?: string | null
          ip_types?: string[] | null
          is_active?: boolean | null
          is_connected?: boolean | null
          languages?: string[] | null
          last_data_verification?: string | null
          last_health_check?: string | null
          last_interaction_at?: string | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          last_sync_type?: string | null
          latam_relevance_score?: number | null
          linkedin_page?: string | null
          main_rejection_reasons?: Json | null
          member_madrid_protocol?: boolean | null
          name?: string | null
          name_en?: string | null
          name_es?: string | null
          name_official: string
          name_short?: string | null
          next_review_date?: string | null
          nice_version?: string | null
          notes?: string | null
          office_acronym?: string | null
          office_hours?: string | null
          office_type?: string | null
          official_gazette_url?: string | null
          online_payment?: boolean | null
          open_data_available?: boolean | null
          operational_status?: string | null
          opposition_count_from?: string | null
          opposition_extensible?: boolean | null
          opposition_form_url?: string | null
          opposition_legal_basis?: string | null
          opposition_max_extension_days?: number | null
          opposition_period_days?: number | null
          opposition_procedure?: Json | null
          opposition_success_rate?: number | null
          paris_convention_member?: boolean | null
          payment_methods?: Json | null
          phone_general?: string | null
          poa_notarization_required?: boolean | null
          power_of_attorney_required?: boolean | null
          preparation_tips?: string | null
          priority_claim_months?: number | null
          priority_score?: number | null
          product_id?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          region?: string | null
          registration_timeline_days?: number | null
          rejection_rate?: number | null
          rejection_rate_pct?: number | null
          renewal_form_url?: string | null
          renewal_grace_period_days?: number | null
          renewal_period_years?: number | null
          renewal_procedure?: Json | null
          rep_requirement_notes?: string | null
          rep_requirement_type?: string | null
          requires_local_agent?: boolean | null
          requires_translation?: boolean | null
          search_url?: string | null
          spanish_companies_active?: boolean | null
          special_requirements?: Json | null
          stats_patent_applications?: number | null
          stats_patent_grants?: number | null
          stats_source_url?: string | null
          stats_tm_applications?: number | null
          stats_tm_registrations?: number | null
          stats_year?: number | null
          status?: string | null
          success_rate_approvals?: number | null
          success_rate_sample_size?: number | null
          success_rate_updated_at?: string | null
          support_email?: string | null
          support_phone?: string | null
          supported_ip_types?: string[] | null
          supported_mark_types?: Json | null
          supports_documents?: boolean | null
          supports_events?: boolean | null
          supports_fees?: boolean | null
          supports_search?: boolean | null
          supports_status?: boolean | null
          sync_frequency?: string | null
          tier?: string | null
          timezone?: string | null
          tm_appeal_fee?: number | null
          tm_class_extra_fee?: number | null
          tm_estimated_registration_months?: number | null
          tm_expedited_fee?: number | null
          tm_fee_change_pct_last?: number | null
          tm_fee_currency?: string | null
          tm_fee_last_change_date?: string | null
          tm_fee_next_review_date?: string | null
          tm_filing_fee?: number | null
          tm_multi_class?: boolean | null
          tm_online_filing_url?: string | null
          tm_opposition_fee?: number | null
          tm_opposition_period_days?: number | null
          tm_recordal_fee?: number | null
          tm_registration_duration_years?: number | null
          tm_renewal_fee?: number | null
          tm_search_url?: string | null
          tm_use_requirement?: boolean | null
          tmview_available?: boolean | null
          top_filing_countries?: Json | null
          top_filing_sectors?: Json | null
          total_filings_tracked?: number | null
          translation_languages?: Json | null
          translation_required?: boolean | null
          translation_requirements?: string | null
          ub_integration_notes?: string | null
          ub_integration_status?: string | null
          updated_at?: string
          url_status?: string | null
          use_requirement_details?: string | null
          use_requirement_years?: number | null
          uses_nice_classification?: boolean | null
          website_main?: string | null
          website_official?: string | null
          website_search?: string | null
          wipo_madrid_code?: string | null
          working_hours?: Json | null
        }
        Update: {
          accepted_filing_languages?: string[] | null
          accepted_languages?: Json | null
          accepted_mark_types?: Json | null
          address?: string | null
          agent_required?: boolean | null
          agent_required_for_foreign?: boolean | null
          agent_requirement_type?: string | null
          annual_filing_volume?: number | null
          api_authentication_type?: string | null
          api_base_url?: string | null
          api_config?: Json | null
          api_credentials?: Json | null
          api_documentation_url?: string | null
          api_sandbox_available?: boolean | null
          api_type?: string | null
          api_url?: string | null
          api_version?: string | null
          appeal_procedure?: Json | null
          approval_rate_pct?: number | null
          assignment_form_url?: string | null
          auth_type?: string | null
          automation_level?: string | null
          automation_percentage?: number | null
          avg_days_opposition_period?: number | null
          avg_days_to_decision?: number | null
          avg_days_to_first_action?: number | null
          avg_days_to_publication?: number | null
          avg_response_time_ms?: number | null
          best_practices?: Json | null
          bulk_data_available?: boolean | null
          cancellation_procedure?: Json | null
          capabilities?: Json | null
          city?: string | null
          code?: string
          code_alt?: string | null
          common_mistakes?: Json | null
          common_rejection_reasons?: Json | null
          connection_config?: Json | null
          connection_status?: string | null
          contact_appeals_dept?: string | null
          contact_trademarks_dept?: string | null
          contact_urgent?: string | null
          country_code?: string | null
          country_flag?: string | null
          country_name?: string | null
          created_at?: string
          credentials_encrypted?: string | null
          currency?: string | null
          data_completeness_score?: number | null
          data_confidence?: string | null
          data_last_verified_at?: string | null
          data_last_verified_by?: string | null
          data_quality_flag?: string | null
          data_quality_notes?: string | null
          data_source?: string | null
          data_source_config?: Json | null
          data_source_notes?: string | null
          data_source_type?: string | null
          default_partner_id?: string | null
          digital_maturity_score?: number | null
          digital_score?: number | null
          digitalization_level?: string | null
          director_name?: string | null
          director_title?: string | null
          display_order?: number | null
          documents_required?: Json | null
          e_filing_available?: boolean | null
          e_filing_url?: string | null
          electronic_signature?: boolean | null
          email_general?: string | null
          exam_criteria_url?: string | null
          exam_gazette_url?: string | null
          exam_guidelines_year?: number | null
          exam_type?: string | null
          examiner_patterns?: Json | null
          fax?: string | null
          fee_last_verified_at?: string | null
          fee_schedule_url?: string | null
          fees_source_notes?: string | null
          fees_url?: string | null
          filing_volume_growth_pct?: number | null
          filing_volume_year?: number | null
          flag?: string | null
          flag_emoji?: string | null
          genius_coverage_level?: string | null
          genius_coverage_score?: number | null
          genius_kb_chunks?: number | null
          genius_last_kb_update?: string | null
          grace_period_days?: number | null
          handles_designs?: boolean | null
          handles_patents?: boolean | null
          handles_trademarks?: boolean | null
          handles_utility_models?: boolean | null
          has_api?: boolean | null
          id?: string
          insights_updated_at?: string | null
          internal_notes?: string | null
          ip_types?: string[] | null
          is_active?: boolean | null
          is_connected?: boolean | null
          languages?: string[] | null
          last_data_verification?: string | null
          last_health_check?: string | null
          last_interaction_at?: string | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          last_sync_type?: string | null
          latam_relevance_score?: number | null
          linkedin_page?: string | null
          main_rejection_reasons?: Json | null
          member_madrid_protocol?: boolean | null
          name?: string | null
          name_en?: string | null
          name_es?: string | null
          name_official?: string
          name_short?: string | null
          next_review_date?: string | null
          nice_version?: string | null
          notes?: string | null
          office_acronym?: string | null
          office_hours?: string | null
          office_type?: string | null
          official_gazette_url?: string | null
          online_payment?: boolean | null
          open_data_available?: boolean | null
          operational_status?: string | null
          opposition_count_from?: string | null
          opposition_extensible?: boolean | null
          opposition_form_url?: string | null
          opposition_legal_basis?: string | null
          opposition_max_extension_days?: number | null
          opposition_period_days?: number | null
          opposition_procedure?: Json | null
          opposition_success_rate?: number | null
          paris_convention_member?: boolean | null
          payment_methods?: Json | null
          phone_general?: string | null
          poa_notarization_required?: boolean | null
          power_of_attorney_required?: boolean | null
          preparation_tips?: string | null
          priority_claim_months?: number | null
          priority_score?: number | null
          product_id?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          region?: string | null
          registration_timeline_days?: number | null
          rejection_rate?: number | null
          rejection_rate_pct?: number | null
          renewal_form_url?: string | null
          renewal_grace_period_days?: number | null
          renewal_period_years?: number | null
          renewal_procedure?: Json | null
          rep_requirement_notes?: string | null
          rep_requirement_type?: string | null
          requires_local_agent?: boolean | null
          requires_translation?: boolean | null
          search_url?: string | null
          spanish_companies_active?: boolean | null
          special_requirements?: Json | null
          stats_patent_applications?: number | null
          stats_patent_grants?: number | null
          stats_source_url?: string | null
          stats_tm_applications?: number | null
          stats_tm_registrations?: number | null
          stats_year?: number | null
          status?: string | null
          success_rate_approvals?: number | null
          success_rate_sample_size?: number | null
          success_rate_updated_at?: string | null
          support_email?: string | null
          support_phone?: string | null
          supported_ip_types?: string[] | null
          supported_mark_types?: Json | null
          supports_documents?: boolean | null
          supports_events?: boolean | null
          supports_fees?: boolean | null
          supports_search?: boolean | null
          supports_status?: boolean | null
          sync_frequency?: string | null
          tier?: string | null
          timezone?: string | null
          tm_appeal_fee?: number | null
          tm_class_extra_fee?: number | null
          tm_estimated_registration_months?: number | null
          tm_expedited_fee?: number | null
          tm_fee_change_pct_last?: number | null
          tm_fee_currency?: string | null
          tm_fee_last_change_date?: string | null
          tm_fee_next_review_date?: string | null
          tm_filing_fee?: number | null
          tm_multi_class?: boolean | null
          tm_online_filing_url?: string | null
          tm_opposition_fee?: number | null
          tm_opposition_period_days?: number | null
          tm_recordal_fee?: number | null
          tm_registration_duration_years?: number | null
          tm_renewal_fee?: number | null
          tm_search_url?: string | null
          tm_use_requirement?: boolean | null
          tmview_available?: boolean | null
          top_filing_countries?: Json | null
          top_filing_sectors?: Json | null
          total_filings_tracked?: number | null
          translation_languages?: Json | null
          translation_required?: boolean | null
          translation_requirements?: string | null
          ub_integration_notes?: string | null
          ub_integration_status?: string | null
          updated_at?: string
          url_status?: string | null
          use_requirement_details?: string | null
          use_requirement_years?: number | null
          uses_nice_classification?: boolean | null
          website_main?: string | null
          website_official?: string | null
          website_search?: string | null
          wipo_madrid_code?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      ipo_official_fees: {
        Row: {
          amount: number
          amount_eur: number | null
          channel: string | null
          created_at: string | null
          currency: string
          description: string | null
          effective_from: string | null
          effective_until: string | null
          fee_base_includes: number | null
          fee_per_additional: number | null
          fee_type: string
          id: string
          ip_type: string
          is_active: boolean | null
          notes: string | null
          office_id: string
          online_discount_pct: number | null
          service_category: string
          service_name: string
          sme_discount_pct: number | null
          source_url: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number
          amount_eur?: number | null
          channel?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          fee_base_includes?: number | null
          fee_per_additional?: number | null
          fee_type?: string
          id?: string
          ip_type?: string
          is_active?: boolean | null
          notes?: string | null
          office_id: string
          online_discount_pct?: number | null
          service_category?: string
          service_name?: string
          sme_discount_pct?: number | null
          source_url?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          amount_eur?: number | null
          channel?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          fee_base_includes?: number | null
          fee_per_additional?: number | null
          fee_type?: string
          id?: string
          ip_type?: string
          is_active?: boolean | null
          notes?: string | null
          office_id?: string
          online_discount_pct?: number | null
          service_category?: string
          service_name?: string
          sme_discount_pct?: number | null
          source_url?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipo_official_fees_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      ipo_procedures: {
        Row: {
          country_code: string | null
          created_at: string | null
          description: string | null
          estimated_duration_days: number | null
          id: string
          is_active: boolean | null
          name_en: string | null
          name_es: string | null
          official_fee_amount: number | null
          official_fee_currency: string | null
          procedure_type: string | null
          required_documents: string[] | null
          right_type: string | null
          sort_order: number | null
          source_url: string | null
          steps: Json | null
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          name_en?: string | null
          name_es?: string | null
          official_fee_amount?: number | null
          official_fee_currency?: string | null
          procedure_type?: string | null
          required_documents?: string[] | null
          right_type?: string | null
          sort_order?: number | null
          source_url?: string | null
          steps?: Json | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          name_en?: string | null
          name_es?: string | null
          official_fee_amount?: number | null
          official_fee_currency?: string | null
          procedure_type?: string | null
          required_documents?: string[] | null
          right_type?: string | null
          sort_order?: number | null
          source_url?: string | null
          steps?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ipo_rejection_analysis: {
        Row: {
          ai_suggestions: Json | null
          country_code: string | null
          created_at: string | null
          id: string
          matter_id: string | null
          office_action_text: string | null
          rejection_category: string | null
          rejection_date: string | null
          response_deadline: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_suggestions?: Json | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          matter_id?: string | null
          office_action_text?: string | null
          rejection_category?: string | null
          rejection_date?: string | null
          response_deadline?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_suggestions?: Json | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          matter_id?: string | null
          office_action_text?: string | null
          rejection_category?: string | null
          rejection_date?: string | null
          response_deadline?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ipo_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          deadlines_created: number | null
          documents_downloaded: number | null
          error_details: Json | null
          errors_count: number | null
          id: string
          matters_checked: number | null
          matters_updated: number | null
          office_code: string | null
          office_id: string | null
          started_at: string | null
          status: string
          sync_type: string | null
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deadlines_created?: number | null
          documents_downloaded?: number | null
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          matters_checked?: number | null
          matters_updated?: number | null
          office_code?: string | null
          office_id?: string | null
          started_at?: string | null
          status?: string
          sync_type?: string | null
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deadlines_created?: number | null
          documents_downloaded?: number | null
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          matters_checked?: number | null
          matters_updated?: number | null
          office_code?: string | null
          office_id?: string | null
          started_at?: string | null
          status?: string
          sync_type?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipo_sync_logs_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      ipo_treaty_status: {
        Row: {
          created_at: string | null
          declarations: string | null
          entry_into_force_date: string | null
          has_reservations: boolean | null
          id: string
          member_since: string | null
          notes: string | null
          office_id: string
          ratification_date: string | null
          reservations_text: string | null
          source_url: string | null
          status: string
          treaty_code: string | null
          treaty_full_name: string | null
          treaty_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          declarations?: string | null
          entry_into_force_date?: string | null
          has_reservations?: boolean | null
          id?: string
          member_since?: string | null
          notes?: string | null
          office_id: string
          ratification_date?: string | null
          reservations_text?: string | null
          source_url?: string | null
          status?: string
          treaty_code?: string | null
          treaty_full_name?: string | null
          treaty_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          declarations?: string | null
          entry_into_force_date?: string | null
          has_reservations?: boolean | null
          id?: string
          member_since?: string | null
          notes?: string | null
          office_id?: string
          ratification_date?: string | null
          reservations_text?: string | null
          source_url?: string | null
          status?: string
          treaty_code?: string | null
          treaty_full_name?: string | null
          treaty_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipo_treaty_status_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_aliases: {
        Row: {
          alias: string
          alias_type: string | null
          country_code: string
          created_at: string | null
          id: string
          language: string | null
        }
        Insert: {
          alias: string
          alias_type?: string | null
          country_code: string
          created_at?: string | null
          id?: string
          language?: string | null
        }
        Update: {
          alias?: string
          alias_type?: string | null
          country_code?: string
          created_at?: string | null
          id?: string
          language?: string | null
        }
        Relationships: []
      }
      jurisdiction_change_patterns: {
        Row: {
          advance_notice_days: number | null
          announcement_url: string | null
          avg_change_interval_days: number | null
          change_type: string
          confidence_in_pattern: number | null
          created_at: string | null
          gives_advance_notice: boolean | null
          id: string
          interval_variance_days: number | null
          ipo_office_id: string
          known_change_dates: string[] | null
          last_pattern_review: string | null
          legal_framework: string | null
          notes: string | null
          requires_legislative_change: boolean | null
          research_sources: Json | null
          researched_at: string | null
          signal_search_terms: string[] | null
          source: string | null
          typical_change_magnitude_pct: number | null
          typical_change_months: number[] | null
          updated_at: string | null
        }
        Insert: {
          advance_notice_days?: number | null
          announcement_url?: string | null
          avg_change_interval_days?: number | null
          change_type: string
          confidence_in_pattern?: number | null
          created_at?: string | null
          gives_advance_notice?: boolean | null
          id?: string
          interval_variance_days?: number | null
          ipo_office_id: string
          known_change_dates?: string[] | null
          last_pattern_review?: string | null
          legal_framework?: string | null
          notes?: string | null
          requires_legislative_change?: boolean | null
          research_sources?: Json | null
          researched_at?: string | null
          signal_search_terms?: string[] | null
          source?: string | null
          typical_change_magnitude_pct?: number | null
          typical_change_months?: number[] | null
          updated_at?: string | null
        }
        Update: {
          advance_notice_days?: number | null
          announcement_url?: string | null
          avg_change_interval_days?: number | null
          change_type?: string
          confidence_in_pattern?: number | null
          created_at?: string | null
          gives_advance_notice?: boolean | null
          id?: string
          interval_variance_days?: number | null
          ipo_office_id?: string
          known_change_dates?: string[] | null
          last_pattern_review?: string | null
          legal_framework?: string | null
          notes?: string | null
          requires_legislative_change?: boolean | null
          research_sources?: Json | null
          researched_at?: string | null
          signal_search_terms?: string[] | null
          source?: string | null
          typical_change_magnitude_pct?: number | null
          typical_change_months?: number[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_change_patterns_ipo_office_id_fkey"
            columns: ["ipo_office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_change_signals: {
        Row: {
          change_type: string
          confirmed_change: boolean | null
          created_at: string | null
          detected_by: string
          expires_at: string | null
          id: string
          ipo_office_id: string
          is_active: boolean | null
          signal_date: string
          signal_description: string | null
          signal_title: string
          signal_type: string
          signal_url: string | null
          triggered_check_frequency_hours: number
          updated_at: string | null
          urgency_level: string
        }
        Insert: {
          change_type: string
          confirmed_change?: boolean | null
          created_at?: string | null
          detected_by?: string
          expires_at?: string | null
          id?: string
          ipo_office_id: string
          is_active?: boolean | null
          signal_date: string
          signal_description?: string | null
          signal_title: string
          signal_type: string
          signal_url?: string | null
          triggered_check_frequency_hours: number
          updated_at?: string | null
          urgency_level?: string
        }
        Update: {
          change_type?: string
          confirmed_change?: boolean | null
          created_at?: string | null
          detected_by?: string
          expires_at?: string | null
          id?: string
          ipo_office_id?: string
          is_active?: boolean | null
          signal_date?: string
          signal_description?: string | null
          signal_title?: string
          signal_type?: string
          signal_url?: string | null
          triggered_check_frequency_hours?: number
          updated_at?: string | null
          urgency_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_change_signals_ipo_office_id_fkey"
            columns: ["ipo_office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_document_requirements: {
        Row: {
          country_code: string | null
          created_at: string | null
          description: string | null
          document_type: string | null
          id: string
          is_mandatory: boolean | null
          notes: string | null
          right_type: string | null
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          right_type?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          right_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jurisdiction_extraction_config: {
        Row: {
          api_auth_header: string | null
          api_endpoint: string | null
          api_requires_auth: boolean | null
          check_frequency_hours: number
          consecutive_failures: number | null
          created_at: string | null
          extraction_method: string
          extraction_prompt_hint: string
          history_research_confidence: number | null
          history_researched: boolean | null
          history_researched_at: string | null
          id: string
          ipo_office_id: string
          is_active: boolean | null
          last_checked_at: string | null
          last_error: string | null
          last_success_at: string | null
          next_check_at: string | null
          office_code: string
          office_name: string
          primary_url: string
          updated_at: string | null
          verification_url: string | null
        }
        Insert: {
          api_auth_header?: string | null
          api_endpoint?: string | null
          api_requires_auth?: boolean | null
          check_frequency_hours?: number
          consecutive_failures?: number | null
          created_at?: string | null
          extraction_method: string
          extraction_prompt_hint: string
          history_research_confidence?: number | null
          history_researched?: boolean | null
          history_researched_at?: string | null
          id?: string
          ipo_office_id: string
          is_active?: boolean | null
          last_checked_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          next_check_at?: string | null
          office_code: string
          office_name: string
          primary_url: string
          updated_at?: string | null
          verification_url?: string | null
        }
        Update: {
          api_auth_header?: string | null
          api_endpoint?: string | null
          api_requires_auth?: boolean | null
          check_frequency_hours?: number
          consecutive_failures?: number | null
          created_at?: string | null
          extraction_method?: string
          extraction_prompt_hint?: string
          history_research_confidence?: number | null
          history_researched?: boolean | null
          history_researched_at?: string | null
          id?: string
          ipo_office_id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          next_check_at?: string | null
          office_code?: string
          office_name?: string
          primary_url?: string
          updated_at?: string | null
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_extraction_config_ipo_office_id_fkey"
            columns: ["ipo_office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_fees: {
        Row: {
          base_fee: number | null
          canonical_key: string | null
          class_additional_fee: number | null
          classes_1_fee: number | null
          confidence: number
          created_at: string | null
          currency: string
          extraction_method: string | null
          fee_type: string
          id: string
          ipo_office_id: string
          is_active: boolean | null
          last_verified_at: string | null
          notes: string | null
          service_type: string
          source_name: string | null
          source_url: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          verified_by: string | null
        }
        Insert: {
          base_fee?: number | null
          canonical_key?: string | null
          class_additional_fee?: number | null
          classes_1_fee?: number | null
          confidence?: number
          created_at?: string | null
          currency?: string
          extraction_method?: string | null
          fee_type?: string
          id?: string
          ipo_office_id: string
          is_active?: boolean | null
          last_verified_at?: string | null
          notes?: string | null
          service_type: string
          source_name?: string | null
          source_url?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          verified_by?: string | null
        }
        Update: {
          base_fee?: number | null
          canonical_key?: string | null
          class_additional_fee?: number | null
          classes_1_fee?: number | null
          confidence?: number
          created_at?: string | null
          currency?: string
          extraction_method?: string | null
          fee_type?: string
          id?: string
          ipo_office_id?: string
          is_active?: boolean | null
          last_verified_at?: string | null
          notes?: string | null
          service_type?: string
          source_name?: string | null
          source_url?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_fees_canonical_key_fkey"
            columns: ["canonical_key"]
            isOneToOne: false
            referencedRelation: "jurisdiction_service_map"
            referencedColumns: ["canonical_key"]
          },
          {
            foreignKeyName: "jurisdiction_fees_ipo_office_id_fkey"
            columns: ["ipo_office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_field_configs: {
        Row: {
          code: string | null
          config: Json | null
          created_at: string | null
          description: string | null
          display_name: string | null
          field_type: string | null
          id: string
          is_required: boolean | null
          jurisdiction_code: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          jurisdiction_code?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          jurisdiction_code?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jurisdiction_filing_requirements: {
        Row: {
          country_code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_required: boolean | null
          metadata: Json | null
          name: string | null
          requirement_type: string | null
          right_type: string | null
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          metadata?: Json | null
          name?: string | null
          requirement_type?: string | null
          right_type?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          metadata?: Json | null
          name?: string | null
          requirement_type?: string | null
          right_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jurisdiction_knowledge_base: {
        Row: {
          content: string | null
          country_code: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          language: string | null
          legal_area: string | null
          source: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          language?: string | null
          legal_area?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          language?: string | null
          legal_area?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jurisdiction_requirements: {
        Row: {
          country_code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_verified: string | null
          metadata: Json | null
          name: string | null
          requirement_type: string | null
          right_type: string | null
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_verified?: string | null
          metadata?: Json | null
          name?: string | null
          requirement_type?: string | null
          right_type?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_verified?: string | null
          metadata?: Json | null
          name?: string | null
          requirement_type?: string | null
          right_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jurisdiction_risk_windows: {
        Row: {
          calculated_at: string | null
          calculation_basis: string | null
          change_date: string | null
          change_occurred: boolean | null
          change_probability: number | null
          change_type: string
          check_frequency_in_window_hours: number
          check_frequency_stable_hours: number
          created_at: string | null
          id: string
          ipo_office_id: string
          is_currently_in_window: boolean | null
          pattern_id: string
          updated_at: string | null
          window_end: string
          window_start: string
        }
        Insert: {
          calculated_at?: string | null
          calculation_basis?: string | null
          change_date?: string | null
          change_occurred?: boolean | null
          change_probability?: number | null
          change_type: string
          check_frequency_in_window_hours: number
          check_frequency_stable_hours: number
          created_at?: string | null
          id?: string
          ipo_office_id: string
          is_currently_in_window?: boolean | null
          pattern_id: string
          updated_at?: string | null
          window_end: string
          window_start: string
        }
        Update: {
          calculated_at?: string | null
          calculation_basis?: string | null
          change_date?: string | null
          change_occurred?: boolean | null
          change_probability?: number | null
          change_type?: string
          check_frequency_in_window_hours?: number
          check_frequency_stable_hours?: number
          created_at?: string | null
          id?: string
          ipo_office_id?: string
          is_currently_in_window?: boolean | null
          pattern_id?: string
          updated_at?: string | null
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_risk_windows_ipo_office_id_fkey"
            columns: ["ipo_office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jurisdiction_risk_windows_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_change_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_service_map: {
        Row: {
          canonical_key: string
          created_at: string | null
          display_name_en: string
          display_name_es: string
          id: string
          service_type: string
        }
        Insert: {
          canonical_key: string
          created_at?: string | null
          display_name_en: string
          display_name_es: string
          id?: string
          service_type: string
        }
        Update: {
          canonical_key?: string
          created_at?: string | null
          display_name_en?: string
          display_name_es?: string
          id?: string
          service_type?: string
        }
        Relationships: []
      }
      jurisdiction_update_queue: {
        Row: {
          admin_notified: boolean | null
          attempt_count: number | null
          auto_approved_count: number | null
          changes_detected: Json | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          extracted_data: Json | null
          extraction_config_id: string
          id: string
          ipo_office_id: string
          max_attempts: number | null
          needs_review_count: number | null
          rejected_count: number | null
          scheduled_for: string
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notified?: boolean | null
          attempt_count?: number | null
          auto_approved_count?: number | null
          changes_detected?: Json | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          extraction_config_id: string
          id?: string
          ipo_office_id: string
          max_attempts?: number | null
          needs_review_count?: number | null
          rejected_count?: number | null
          scheduled_for?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notified?: boolean | null
          attempt_count?: number | null
          auto_approved_count?: number | null
          changes_detected?: Json | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          extraction_config_id?: string
          id?: string
          ipo_office_id?: string
          max_attempts?: number | null
          needs_review_count?: number | null
          rejected_count?: number | null
          scheduled_for?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_update_queue_extraction_config_id_fkey"
            columns: ["extraction_config_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_extraction_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jurisdiction_update_queue_ipo_office_id_fkey"
            columns: ["ipo_office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_updates_log: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          auto_approval_reason: string | null
          auto_approved: boolean | null
          changes_detected: Json | null
          check_type: string | null
          checked_at: string | null
          created_at: string | null
          error_message: string | null
          had_changes: boolean | null
          id: string
          ipo_office_id: string | null
          jurisdiction_fee_id: string | null
          notes: string | null
          processing_ms: number | null
          raw_extraction: Json | null
          requires_human_review: boolean | null
          review_reason: string | null
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_approval_reason?: string | null
          auto_approved?: boolean | null
          changes_detected?: Json | null
          check_type?: string | null
          checked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          had_changes?: boolean | null
          id?: string
          ipo_office_id?: string | null
          jurisdiction_fee_id?: string | null
          notes?: string | null
          processing_ms?: number | null
          raw_extraction?: Json | null
          requires_human_review?: boolean | null
          review_reason?: string | null
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_approval_reason?: string | null
          auto_approved?: boolean | null
          changes_detected?: Json | null
          check_type?: string | null
          checked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          had_changes?: boolean | null
          id?: string
          ipo_office_id?: string | null
          jurisdiction_fee_id?: string | null
          notes?: string | null
          processing_ms?: number | null
          raw_extraction?: Json | null
          requires_human_review?: boolean | null
          review_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_updates_log_ipo_office_id_fkey"
            columns: ["ipo_office_id"]
            isOneToOne: false
            referencedRelation: "ipo_offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jurisdiction_updates_log_jurisdiction_fee_id_fkey"
            columns: ["jurisdiction_fee_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdictions: {
        Row: {
          code: string | null
          continent: string | null
          country_name: string | null
          country_name_es: string | null
          created_at: string | null
          currency: string | null
          flag_emoji: string | null
          id: string
          ip_office_id: string | null
          is_active: boolean | null
          is_madrid_member: boolean | null
          language: string | null
          region: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          continent?: string | null
          country_name?: string | null
          country_name_es?: string | null
          created_at?: string | null
          currency?: string | null
          flag_emoji?: string | null
          id?: string
          ip_office_id?: string | null
          is_active?: boolean | null
          is_madrid_member?: boolean | null
          language?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          continent?: string | null
          country_name?: string | null
          country_name_es?: string | null
          created_at?: string | null
          currency?: string | null
          flag_emoji?: string | null
          id?: string
          ip_office_id?: string | null
          is_active?: boolean | null
          is_madrid_member?: boolean | null
          language?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads_billing: {
        Row: {
          billing_cycle: string | null
          comments: string | null
          created_at: string | null
          email: string
          estimated_monthly_eur: number | null
          id: string
          organization_id: string | null
          selected_addons: Json | null
          selected_plan_code: string | null
          user_id: string | null
        }
        Insert: {
          billing_cycle?: string | null
          comments?: string | null
          created_at?: string | null
          email: string
          estimated_monthly_eur?: number | null
          id?: string
          organization_id?: string | null
          selected_addons?: Json | null
          selected_plan_code?: string | null
          user_id?: string | null
        }
        Update: {
          billing_cycle?: string | null
          comments?: string | null
          created_at?: string | null
          email?: string
          estimated_monthly_eur?: number | null
          id?: string
          organization_id?: string | null
          selected_addons?: Json | null
          selected_plan_code?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_billing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_acceptances: {
        Row: {
          acceptance_method: string | null
          accepted_at: string | null
          content_hash: string | null
          created_at: string | null
          document_id: string | null
          id: string
          ip_address: string | null
          organization_id: string | null
          signature_data: Json | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          version_accepted: string | null
        }
        Insert: {
          acceptance_method?: string | null
          accepted_at?: string | null
          content_hash?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          signature_data?: Json | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          version_accepted?: string | null
        }
        Update: {
          acceptance_method?: string | null
          accepted_at?: string | null
          content_hash?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          signature_data?: Json | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          version_accepted?: string | null
        }
        Relationships: []
      }
      legal_deadlines_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          field_changed: string | null
          id: string
          legal_deadline_id: string | null
          new_value: string | null
          old_value: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          field_changed?: string | null
          id?: string
          legal_deadline_id?: string | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          field_changed?: string | null
          id?: string
          legal_deadline_id?: string | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      legal_document_contents: {
        Row: {
          checkbox_text: string | null
          code: string | null
          created_at: string | null
          full_content: string | null
          id: string
          is_active: boolean | null
          link_text: string | null
          short_summary: string | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
          version: string | null
        }
        Insert: {
          checkbox_text?: string | null
          code?: string | null
          created_at?: string | null
          full_content?: string | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          short_summary?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          version?: string | null
        }
        Update: {
          checkbox_text?: string | null
          code?: string | null
          created_at?: string | null
          full_content?: string | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          short_summary?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          version?: string | null
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          changelog: string | null
          code: string | null
          content: string | null
          content_hash: string | null
          created_at: string | null
          created_by: string | null
          doc_type: string | null
          effective_date: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          is_active: boolean | null
          is_current: boolean | null
          language: string | null
          organization_id: string | null
          requires_re_consent: boolean | null
          requires_signature: boolean | null
          show_on_ai_first_use: boolean | null
          signature_type: string | null
          title: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          changelog?: string | null
          code?: string | null
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          doc_type?: string | null
          effective_date?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          language?: string | null
          organization_id?: string | null
          requires_re_consent?: boolean | null
          requires_signature?: boolean | null
          show_on_ai_first_use?: boolean | null
          signature_type?: string | null
          title?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          changelog?: string | null
          code?: string | null
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          doc_type?: string | null
          effective_date?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          language?: string | null
          organization_id?: string | null
          requires_re_consent?: boolean | null
          requires_signature?: boolean | null
          show_on_ai_first_use?: boolean | null
          signature_type?: string | null
          title?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      legalops_ai_feedback: {
        Row: {
          approved_for_training: boolean | null
          corrected_output: string | null
          created_at: string
          feedback_comment: string | null
          feedback_type: string
          id: string
          interaction_id: string | null
          organization_id: string
          original_output: string | null
          training_exported_at: string | null
          user_id: string
        }
        Insert: {
          approved_for_training?: boolean | null
          corrected_output?: string | null
          created_at?: string
          feedback_comment?: string | null
          feedback_type: string
          id?: string
          interaction_id?: string | null
          organization_id: string
          original_output?: string | null
          training_exported_at?: string | null
          user_id: string
        }
        Update: {
          approved_for_training?: boolean | null
          corrected_output?: string | null
          created_at?: string
          feedback_comment?: string | null
          feedback_type?: string
          id?: string
          interaction_id?: string | null
          organization_id?: string
          original_output?: string | null
          training_exported_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legalops_ai_feedback_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "legalops_ai_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legalops_ai_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      legalops_ai_interactions: {
        Row: {
          client_id: string | null
          confidence: number | null
          confidence_level: string | null
          cost_usd: number | null
          created_at: string
          feedback_at: string | null
          id: string
          input_metadata: Json | null
          input_text: string | null
          input_tokens: number | null
          interaction_type: string
          latency_ms: number | null
          matter_id: string | null
          model_name: string | null
          model_provider: string | null
          model_version: string | null
          organization_id: string
          output_metadata: Json | null
          output_text: string | null
          output_tokens: number | null
          sources: Json | null
          user_correction: string | null
          user_feedback: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          confidence?: number | null
          confidence_level?: string | null
          cost_usd?: number | null
          created_at?: string
          feedback_at?: string | null
          id?: string
          input_metadata?: Json | null
          input_text?: string | null
          input_tokens?: number | null
          interaction_type: string
          latency_ms?: number | null
          matter_id?: string | null
          model_name?: string | null
          model_provider?: string | null
          model_version?: string | null
          organization_id: string
          output_metadata?: Json | null
          output_text?: string | null
          output_tokens?: number | null
          sources?: Json | null
          user_correction?: string | null
          user_feedback?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          confidence?: number | null
          confidence_level?: string | null
          cost_usd?: number | null
          created_at?: string
          feedback_at?: string | null
          id?: string
          input_metadata?: Json | null
          input_text?: string | null
          input_tokens?: number | null
          interaction_type?: string
          latency_ms?: number | null
          matter_id?: string | null
          model_name?: string | null
          model_provider?: string | null
          model_version?: string | null
          organization_id?: string
          output_metadata?: Json | null
          output_text?: string | null
          output_tokens?: number | null
          sources?: Json | null
          user_correction?: string | null
          user_feedback?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legalops_ai_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legalops_ai_interactions_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legalops_ai_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locarno_classes: {
        Row: {
          class_number: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          note_es: string | null
          title_en: string | null
          title_es: string | null
          version: string | null
        }
        Insert: {
          class_number?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          note_es?: string | null
          title_en?: string | null
          title_es?: string | null
          version?: string | null
        }
        Update: {
          class_number?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          note_es?: string | null
          title_en?: string | null
          title_es?: string | null
          version?: string | null
        }
        Relationships: []
      }
      locarno_items: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          item_number: string | null
          subclass_id: string | null
          term_en: string | null
          term_es: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_number?: string | null
          subclass_id?: string | null
          term_en?: string | null
          term_es?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_number?: string | null
          subclass_id?: string | null
          term_en?: string | null
          term_es?: string | null
          version?: string | null
        }
        Relationships: []
      }
      locarno_subclasses: {
        Row: {
          class_id: string | null
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          title_en: string | null
          title_es: string | null
          version: string | null
        }
        Insert: {
          class_id?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title_en?: string | null
          title_es?: string | null
          version?: string | null
        }
        Update: {
          class_id?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title_en?: string | null
          title_es?: string | null
          version?: string | null
        }
        Relationships: []
      }
      market_opportunities: {
        Row: {
          country_iso2: string | null
          created_at: string | null
          description: string | null
          growth_rate: number | null
          id: string
          market_size: number | null
          opportunity_score: number | null
        }
        Insert: {
          country_iso2?: string | null
          created_at?: string | null
          description?: string | null
          growth_rate?: number | null
          id?: string
          market_size?: number | null
          opportunity_score?: number | null
        }
        Update: {
          country_iso2?: string | null
          created_at?: string | null
          description?: string | null
          growth_rate?: number | null
          id?: string
          market_size?: number | null
          opportunity_score?: number | null
        }
        Relationships: []
      }
      market_users: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean | null
          is_agent: boolean | null
          languages: string[] | null
          organization_id: string | null
          rating_avg: number | null
          rating_count: number | null
          specializations: string[] | null
          success_rate: number | null
          total_transactions: number | null
          updated_at: string
          user_type: string | null
          verified: boolean | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_agent?: boolean | null
          languages?: string[] | null
          organization_id?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          specializations?: string[] | null
          success_rate?: number | null
          total_transactions?: number | null
          updated_at?: string
          user_type?: string | null
          verified?: boolean | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_agent?: boolean | null
          languages?: string[] | null
          organization_id?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          specializations?: string[] | null
          success_rate?: number | null
          total_transactions?: number | null
          updated_at?: string
          user_type?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "market_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          campaign_type: string | null
          click_count: number | null
          content: Json | null
          conversion_count: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          open_count: number | null
          organization_id: string
          sent_count: number | null
          start_date: string | null
          status: string | null
          target_audience: Json | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          campaign_type?: string | null
          click_count?: number | null
          content?: Json | null
          conversion_count?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          open_count?: number | null
          organization_id: string
          sent_count?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: Json | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          campaign_type?: string | null
          click_count?: number | null
          content?: Json | null
          conversion_count?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          open_count?: number | null
          organization_id?: string
          sent_count?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      matter_activity: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          matter_id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          organization_id: string
          title: string | null
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          matter_id: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id: string
          title?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          matter_id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matter_activity_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_activity_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      matter_comments: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_internal: boolean | null
          matter_id: string
          organization_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          matter_id: string
          organization_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          matter_id?: string
          organization_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matter_comments_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "matter_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      matter_costs: {
        Row: {
          amount: number
          amount_local: number | null
          cost_date: string
          cost_type: string
          created_at: string
          created_by: string | null
          currency: string | null
          description: string
          due_date: string | null
          exchange_rate: number | null
          id: string
          invoice_id: string | null
          is_billable: boolean | null
          matter_id: string
          notes: string | null
          official_fee_id: string | null
          organization_id: string
          paid_date: string | null
          quantity: number
          service_fee_id: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount?: number
          amount_local?: number | null
          cost_date?: string
          cost_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description: string
          due_date?: string | null
          exchange_rate?: number | null
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          matter_id: string
          notes?: string | null
          official_fee_id?: string | null
          organization_id: string
          paid_date?: string | null
          quantity?: number
          service_fee_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_local?: number | null
          cost_date?: string
          cost_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string
          due_date?: string | null
          exchange_rate?: number | null
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          matter_id?: string
          notes?: string | null
          official_fee_id?: string | null
          organization_id?: string
          paid_date?: string | null
          quantity?: number
          service_fee_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matter_costs_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_costs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      matter_deadlines: {
        Row: {
          alerts_sent: Json | null
          auto_generated: boolean | null
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          created_at: string
          deadline_date: string
          deadline_type: string
          description: string | null
          extended_by: string | null
          extension_count: number | null
          extension_reason: string | null
          google_event_id: string | null
          id: string
          matter_id: string
          metadata: Json | null
          next_alert_date: string | null
          organization_id: string
          original_deadline: string | null
          outlook_event_id: string | null
          priority: string
          rule_code: string | null
          rule_id: string | null
          source: string | null
          status: string
          task_id: string | null
          title: string
          trigger_date: string | null
          updated_at: string
        }
        Insert: {
          alerts_sent?: Json | null
          auto_generated?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          deadline_date: string
          deadline_type?: string
          description?: string | null
          extended_by?: string | null
          extension_count?: number | null
          extension_reason?: string | null
          google_event_id?: string | null
          id?: string
          matter_id: string
          metadata?: Json | null
          next_alert_date?: string | null
          organization_id: string
          original_deadline?: string | null
          outlook_event_id?: string | null
          priority?: string
          rule_code?: string | null
          rule_id?: string | null
          source?: string | null
          status?: string
          task_id?: string | null
          title: string
          trigger_date?: string | null
          updated_at?: string
        }
        Update: {
          alerts_sent?: Json | null
          auto_generated?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          deadline_date?: string
          deadline_type?: string
          description?: string | null
          extended_by?: string | null
          extension_count?: number | null
          extension_reason?: string | null
          google_event_id?: string | null
          id?: string
          matter_id?: string
          metadata?: Json | null
          next_alert_date?: string | null
          organization_id?: string
          original_deadline?: string | null
          outlook_event_id?: string | null
          priority?: string
          rule_code?: string | null
          rule_id?: string | null
          source?: string | null
          status?: string
          task_id?: string | null
          title?: string
          trigger_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matter_deadlines_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_deadlines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      matter_documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          document_date: string | null
          expiry_date: string | null
          file_path: string
          file_size: number | null
          id: string
          is_official: boolean | null
          matter_id: string
          mime_type: string | null
          name: string
          organization_id: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          document_date?: string | null
          expiry_date?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          is_official?: boolean | null
          matter_id: string
          mime_type?: string | null
          name: string
          organization_id: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          document_date?: string | null
          expiry_date?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          is_official?: boolean | null
          matter_id?: string
          mime_type?: string | null
          name?: string
          organization_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matter_documents_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      matter_parties: {
        Row: {
          client_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          external_address: string | null
          external_country: string | null
          external_email: string | null
          external_name: string | null
          external_phone: string | null
          id: string
          is_primary: boolean | null
          jurisdiction: string | null
          matter_id: string
          notes: string | null
          organization_id: string
          party_role: string
          percentage: number | null
          source_relationship_id: string | null
          source_type: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          external_address?: string | null
          external_country?: string | null
          external_email?: string | null
          external_name?: string | null
          external_phone?: string | null
          id?: string
          is_primary?: boolean | null
          jurisdiction?: string | null
          matter_id: string
          notes?: string | null
          organization_id: string
          party_role: string
          percentage?: number | null
          source_relationship_id?: string | null
          source_type?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          external_address?: string | null
          external_country?: string | null
          external_email?: string | null
          external_name?: string | null
          external_phone?: string | null
          id?: string
          is_primary?: boolean | null
          jurisdiction?: string | null
          matter_id?: string
          notes?: string | null
          organization_id?: string
          party_role?: string
          percentage?: number | null
          source_relationship_id?: string | null
          source_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matter_parties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_parties_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_parties_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_parties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      matter_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          matter_id: string
          organization_id: string
          priority: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          matter_id: string
          organization_id: string
          priority?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          matter_id?: string
          organization_id?: string
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matter_tasks_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      matters: {
        Row: {
          application_number: string | null
          assigned_to: string | null
          auto_renewal: boolean | null
          client_id: string | null
          cost_center: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          estimated_value: number | null
          expiry_date: string | null
          filing_date: string | null
          filing_number: string | null
          goods_services: string | null
          id: string
          images: string[] | null
          internal_notes: string | null
          ip_type: string | null
          is_archived: boolean | null
          jurisdiction: string | null
          jurisdiction_code: string | null
          mark_image_url: string | null
          mark_name: string | null
          mark_type: string | null
          next_renewal_date: string | null
          nice_classes: number[] | null
          notes: string | null
          official_fees: number | null
          organization_id: string
          owner_name: string | null
          priority_country: string | null
          priority_date: string | null
          priority_number: string | null
          professional_fees: number | null
          reference: string
          registration_date: string | null
          registration_number: string | null
          renewal_instructions: string | null
          status: string
          status_code: string | null
          status_date: string | null
          tags: string[] | null
          title: string
          total_cost: number | null
          type: string
          updated_at: string
        }
        Insert: {
          application_number?: string | null
          assigned_to?: string | null
          auto_renewal?: boolean | null
          client_id?: string | null
          cost_center?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          estimated_value?: number | null
          expiry_date?: string | null
          filing_date?: string | null
          filing_number?: string | null
          goods_services?: string | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          ip_type?: string | null
          is_archived?: boolean | null
          jurisdiction?: string | null
          jurisdiction_code?: string | null
          mark_image_url?: string | null
          mark_name?: string | null
          mark_type?: string | null
          next_renewal_date?: string | null
          nice_classes?: number[] | null
          notes?: string | null
          official_fees?: number | null
          organization_id: string
          owner_name?: string | null
          priority_country?: string | null
          priority_date?: string | null
          priority_number?: string | null
          professional_fees?: number | null
          reference: string
          registration_date?: string | null
          registration_number?: string | null
          renewal_instructions?: string | null
          status?: string
          status_code?: string | null
          status_date?: string | null
          tags?: string[] | null
          title: string
          total_cost?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          application_number?: string | null
          assigned_to?: string | null
          auto_renewal?: boolean | null
          client_id?: string | null
          cost_center?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          estimated_value?: number | null
          expiry_date?: string | null
          filing_date?: string | null
          filing_number?: string | null
          goods_services?: string | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          ip_type?: string | null
          is_archived?: boolean | null
          jurisdiction?: string | null
          jurisdiction_code?: string | null
          mark_image_url?: string | null
          mark_name?: string | null
          mark_type?: string | null
          next_renewal_date?: string | null
          nice_classes?: number[] | null
          notes?: string | null
          official_fees?: number | null
          organization_id?: string
          owner_name?: string | null
          priority_country?: string | null
          priority_date?: string | null
          priority_number?: string | null
          professional_fees?: number | null
          reference?: string
          registration_date?: string | null
          registration_number?: string | null
          renewal_instructions?: string | null
          status?: string
          status_code?: string | null
          status_date?: string | null
          tags?: string[] | null
          title?: string
          total_cost?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matters_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_learned_mappings: {
        Row: {
          confidence: number | null
          created_at: string
          entity_type: string
          id: string
          organization_id: string | null
          source_field: string
          target_field: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          entity_type: string
          id?: string
          organization_id?: string | null
          source_field: string
          target_field: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          entity_type?: string
          id?: string
          organization_id?: string | null
          source_field?: string
          target_field?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "migration_learned_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      model_change_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          function_name: string | null
          id: string
          new_model_id: string | null
          old_model_id: string | null
          suggestion_id: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          function_name?: string | null
          id?: string
          new_model_id?: string | null
          old_model_id?: string | null
          suggestion_id?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          function_name?: string | null
          id?: string
          new_model_id?: string | null
          old_model_id?: string | null
          suggestion_id?: string | null
        }
        Relationships: []
      }
      monitored_deadlines: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          deadline_date: string | null
          deadline_type: string | null
          description: string | null
          id: string
          last_reminder_sent: string | null
          matter_id: string | null
          organization_id: string | null
          reminder_days: number[] | null
          status: string | null
          title: string | null
          watch_result_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          deadline_date?: string | null
          deadline_type?: string | null
          description?: string | null
          id?: string
          last_reminder_sent?: string | null
          matter_id?: string | null
          organization_id?: string | null
          reminder_days?: number[] | null
          status?: string | null
          title?: string | null
          watch_result_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          deadline_date?: string | null
          deadline_type?: string | null
          description?: string | null
          id?: string
          last_reminder_sent?: string | null
          matter_id?: string | null
          organization_id?: string | null
          reminder_days?: number[] | null
          status?: string | null
          title?: string | null
          watch_result_id?: string | null
        }
        Relationships: []
      }
      nice_class_items: {
        Row: {
          alternate_names: string[] | null
          class_id: string | null
          class_number: number
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_generic_term: boolean | null
          is_popular: boolean | null
          item_code: string
          item_name_en: string
          item_name_es: string | null
          updated_at: string | null
          version_id: string | null
        }
        Insert: {
          alternate_names?: string[] | null
          class_id?: string | null
          class_number: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_generic_term?: boolean | null
          is_popular?: boolean | null
          item_code: string
          item_name_en: string
          item_name_es?: string | null
          updated_at?: string | null
          version_id?: string | null
        }
        Update: {
          alternate_names?: string[] | null
          class_id?: string | null
          class_number?: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_generic_term?: boolean | null
          is_popular?: boolean | null
          item_code?: string
          item_name_en?: string
          item_name_es?: string | null
          updated_at?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nice_class_items_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "nice_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nice_class_items_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "nice_classification_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      nice_classes: {
        Row: {
          category: string | null
          class_number: number
          class_type: string
          color: string | null
          created_at: string | null
          excludes_en: string[] | null
          excludes_es: string[] | null
          explanatory_note_en: string | null
          explanatory_note_es: string | null
          icon: string | null
          id: string
          includes_en: string[] | null
          includes_es: string[] | null
          is_active: boolean | null
          is_popular: boolean | null
          last_reviewed_at: string | null
          notes: string | null
          reviewed_by: string | null
          title_en: string
          title_es: string | null
          updated_at: string | null
          version_id: string | null
        }
        Insert: {
          category?: string | null
          class_number: number
          class_type: string
          color?: string | null
          created_at?: string | null
          excludes_en?: string[] | null
          excludes_es?: string[] | null
          explanatory_note_en?: string | null
          explanatory_note_es?: string | null
          icon?: string | null
          id?: string
          includes_en?: string[] | null
          includes_es?: string[] | null
          is_active?: boolean | null
          is_popular?: boolean | null
          last_reviewed_at?: string | null
          notes?: string | null
          reviewed_by?: string | null
          title_en: string
          title_es?: string | null
          updated_at?: string | null
          version_id?: string | null
        }
        Update: {
          category?: string | null
          class_number?: number
          class_type?: string
          color?: string | null
          created_at?: string | null
          excludes_en?: string[] | null
          excludes_es?: string[] | null
          explanatory_note_en?: string | null
          explanatory_note_es?: string | null
          icon?: string | null
          id?: string
          includes_en?: string[] | null
          includes_es?: string[] | null
          is_active?: boolean | null
          is_popular?: boolean | null
          last_reviewed_at?: string | null
          notes?: string | null
          reviewed_by?: string | null
          title_en?: string
          title_es?: string | null
          updated_at?: string | null
          version_id?: string | null
        }
        Relationships: []
      }
      nice_classification_versions: {
        Row: {
          edition: string
          effective_date: string | null
          id: string
          imported_at: string | null
          imported_by: string | null
          is_active: boolean | null
          notes: string | null
          total_classes: number | null
          total_items: number | null
          version_number: string
        }
        Insert: {
          edition: string
          effective_date?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          is_active?: boolean | null
          notes?: string | null
          total_classes?: number | null
          total_items?: number | null
          version_number: string
        }
        Update: {
          edition?: string
          effective_date?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          is_active?: boolean | null
          notes?: string | null
          total_classes?: number | null
          total_items?: number | null
          version_number?: string
        }
        Relationships: []
      }
      nice_import_log: {
        Row: {
          classes_imported: number | null
          created_at: string
          error_details: Json | null
          errors_count: number | null
          id: string
          import_type: string | null
          performed_by: string | null
          products_imported: number | null
          source: string | null
        }
        Insert: {
          classes_imported?: number | null
          created_at?: string
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          import_type?: string | null
          performed_by?: string | null
          products_imported?: number | null
          source?: string | null
        }
        Update: {
          classes_imported?: number | null
          created_at?: string
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          import_type?: string | null
          performed_by?: string | null
          products_imported?: number | null
          source?: string | null
        }
        Relationships: []
      }
      nice_products: {
        Row: {
          added_at: string | null
          added_by: string | null
          class_number: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_common: boolean | null
          name_en: string | null
          name_es: string | null
          search_keywords: string[] | null
          wipo_code: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          class_number?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_common?: boolean | null
          name_en?: string | null
          name_es?: string | null
          search_keywords?: string[] | null
          wipo_code?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          class_number?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_common?: boolean | null
          name_en?: string | null
          name_es?: string | null
          search_keywords?: string[] | null
          wipo_code?: string | null
        }
        Relationships: []
      }
      nice_revision_log: {
        Row: {
          action: string
          class_number: number | null
          created_at: string
          details: Json | null
          id: string
          performed_by: string | null
        }
        Insert: {
          action: string
          class_number?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          class_number?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          performed_by?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          deadline_reminder_days: number[] | null
          deadline_reminders: boolean | null
          digest_day: number | null
          digest_enabled: boolean | null
          digest_frequency: string | null
          digest_time: string | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          invoice_notifications: boolean | null
          marketing_notifications: boolean | null
          preferences: Json | null
          push_enabled: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          renewal_reminder_days: number[] | null
          renewal_reminders: boolean | null
          team_notifications: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          watch_alerts: boolean | null
        }
        Insert: {
          created_at?: string | null
          deadline_reminder_days?: number[] | null
          deadline_reminders?: boolean | null
          digest_day?: number | null
          digest_enabled?: boolean | null
          digest_frequency?: string | null
          digest_time?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          invoice_notifications?: boolean | null
          marketing_notifications?: boolean | null
          preferences?: Json | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          renewal_reminder_days?: number[] | null
          renewal_reminders?: boolean | null
          team_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          watch_alerts?: boolean | null
        }
        Update: {
          created_at?: string | null
          deadline_reminder_days?: number[] | null
          deadline_reminders?: boolean | null
          digest_day?: number | null
          digest_enabled?: boolean | null
          digest_frequency?: string | null
          digest_time?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          invoice_notifications?: boolean | null
          marketing_notifications?: boolean | null
          preferences?: Json | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          renewal_reminder_days?: number[] | null
          renewal_reminders?: boolean | null
          team_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          watch_alerts?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_data: Json | null
          action_label: string | null
          action_url: string | null
          archived_at: string | null
          body: string
          category: string | null
          channels_sent: Json | null
          created_at: string | null
          data: Json | null
          expires_at: string | null
          group_key: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_archived: boolean | null
          is_read: boolean | null
          metadata: Json | null
          organization_id: string | null
          priority: string | null
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          resolved: boolean
          sent_via: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          body: string
          category?: string | null
          channels_sent?: Json | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          group_key?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          resolved?: boolean
          sent_via?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          body?: string
          category?: string | null
          channels_sent?: Json | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          group_key?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          resolved?: boolean
          sent_via?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      office_actions: {
        Row: {
          action_type: string | null
          created_at: string | null
          created_by: string | null
          deadline_date: string | null
          description: string | null
          id: string
          jurisdiction_code: string | null
          notes: string | null
          office_reference: string | null
          priority: string | null
          response_date: string | null
          status: string | null
          title: string | null
          trademark_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_type?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_date?: string | null
          description?: string | null
          id?: string
          jurisdiction_code?: string | null
          notes?: string | null
          office_reference?: string | null
          priority?: string | null
          response_date?: string | null
          status?: string | null
          title?: string | null
          trademark_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_date?: string | null
          description?: string | null
          id?: string
          jurisdiction_code?: string | null
          notes?: string | null
          office_reference?: string | null
          priority?: string | null
          response_date?: string | null
          status?: string | null
          title?: string | null
          trademark_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      office_document_requirements: {
        Row: {
          created_at: string | null
          default_template_id: string | null
          document_type: string | null
          id: string
          last_verified_date: string | null
          office_code: string | null
          official_form_number: string | null
          official_form_url: string | null
          organization_id: string | null
          requirements: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_template_id?: string | null
          document_type?: string | null
          id?: string
          last_verified_date?: string | null
          office_code?: string | null
          official_form_number?: string | null
          official_form_url?: string | null
          organization_id?: string | null
          requirements?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_template_id?: string | null
          document_type?: string | null
          id?: string
          last_verified_date?: string | null
          office_code?: string | null
          official_form_number?: string | null
          official_form_url?: string | null
          organization_id?: string | null
          requirements?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      office_documents: {
        Row: {
          created_at: string | null
          description: string | null
          download_status: string | null
          downloaded_at: string | null
          error_message: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          matter_id: string | null
          mime_type: string | null
          office_code: string | null
          office_doc_date: string | null
          office_doc_id: string | null
          office_doc_type: string | null
          office_metadata: Json | null
          tenant_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          download_status?: string | null
          downloaded_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          matter_id?: string | null
          mime_type?: string | null
          office_code?: string | null
          office_doc_date?: string | null
          office_doc_id?: string | null
          office_doc_type?: string | null
          office_metadata?: Json | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          download_status?: string | null
          downloaded_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          matter_id?: string | null
          mime_type?: string | null
          office_code?: string | null
          office_doc_date?: string | null
          office_doc_id?: string | null
          office_doc_type?: string | null
          office_metadata?: Json | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      office_file_imports: {
        Row: {
          created_at: string | null
          errors: Json | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          import_status: string | null
          office_code: string | null
          processed_at: string | null
          processing_method: string | null
          records_failed: number | null
          records_found: number | null
          records_imported: number | null
          records_updated: number | null
          requires_review: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          errors?: Json | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          import_status?: string | null
          office_code?: string | null
          processed_at?: string | null
          processing_method?: string | null
          records_failed?: number | null
          records_found?: number | null
          records_imported?: number | null
          records_updated?: number | null
          requires_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          errors?: Json | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          import_status?: string | null
          office_code?: string | null
          processed_at?: string | null
          processing_method?: string | null
          records_failed?: number | null
          records_found?: number | null
          records_imported?: number | null
          records_updated?: number | null
          requires_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      office_holidays: {
        Row: {
          country_code: string | null
          created_at: string | null
          holiday_date: string | null
          id: string
          is_recurring: boolean | null
          name: string | null
          name_local: string | null
          type: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          holiday_date?: string | null
          id?: string
          is_recurring?: boolean | null
          name?: string | null
          name_local?: string | null
          type?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          holiday_date?: string | null
          id?: string
          is_recurring?: boolean | null
          name?: string | null
          name_local?: string | null
          type?: string | null
        }
        Relationships: []
      }
      office_import_review_queue: {
        Row: {
          action: string | null
          admin_notes: string | null
          confidence: number | null
          created_at: string | null
          field_name: string | null
          id: string
          import_id: string | null
          new_value: string | null
          office_id: string | null
          old_value: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          admin_notes?: string | null
          confidence?: number | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          import_id?: string | null
          new_value?: string | null
          office_id?: string | null
          old_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          admin_notes?: string | null
          confidence?: number | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          import_id?: string | null
          new_value?: string | null
          office_id?: string | null
          old_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      office_import_templates: {
        Row: {
          created_at: string | null
          description: string | null
          field_mappings: Json | null
          id: string
          is_active: boolean | null
          name: string | null
          source_type: string | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          field_mappings?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          source_type?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          field_mappings?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          source_type?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      office_query_cache: {
        Row: {
          country_code: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          query_hash: string | null
          response_data: Json | null
          service_type: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          query_hash?: string | null
          response_data?: Json | null
          service_type?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          query_hash?: string | null
          response_data?: Json | null
          service_type?: string | null
        }
        Relationships: []
      }
      office_request_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          office_code: string | null
          request_type: string | null
          response_time_ms: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          office_code?: string | null
          request_type?: string | null
          response_time_ms?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          office_code?: string | null
          request_type?: string | null
          response_time_ms?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      office_status_mappings: {
        Row: {
          created_at: string | null
          id: string
          internal_status: string | null
          is_active: boolean | null
          office_code: string | null
          office_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          internal_status?: string | null
          is_active?: boolean | null
          office_code?: string | null
          office_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          internal_status?: string | null
          is_active?: boolean | null
          office_code?: string | null
          office_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          amount_with_vat: number | null
          client_email: string
          client_id: string | null
          client_name: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          jurisdiction: string | null
          metadata: Json | null
          nice_classes: Json | null
          notes: string | null
          official_fee: number | null
          order_number: string
          paid_at: string | null
          payment_method: string | null
          service_fee: number | null
          service_name: string
          service_type: string
          source: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          trademark_name: string | null
          updated_at: string | null
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          amount: number
          amount_with_vat?: number | null
          client_email: string
          client_id?: string | null
          client_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          jurisdiction?: string | null
          metadata?: Json | null
          nice_classes?: Json | null
          notes?: string | null
          official_fee?: number | null
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          service_fee?: number | null
          service_name: string
          service_type: string
          source?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          trademark_name?: string | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          amount_with_vat?: number | null
          client_email?: string
          client_id?: string | null
          client_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          jurisdiction?: string | null
          metadata?: Json | null
          nice_classes?: Json | null
          notes?: string | null
          official_fee?: number | null
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          service_fee?: number | null
          service_name?: string
          service_type?: string
          source?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          trademark_name?: string | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          plan: string | null
          settings: Json | null
          slug: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          plan?: string | null
          settings?: Json | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          plan?: string | null
          settings?: Json | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          address: string | null
          city: string | null
          commission_rate: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string | null
          notes: string | null
          partner_type: string | null
          payment_terms: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          partner_type?: string | null
          payment_terms?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          partner_type?: string | null
          payment_terms?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      party_roles: {
        Row: {
          applies_to: string[] | null
          category: string
          code: string
          created_at: string
          icon: string | null
          id: string
          name_en: string
          name_es: string
          sort_order: number | null
        }
        Insert: {
          applies_to?: string[] | null
          category?: string
          code: string
          created_at?: string
          icon?: string | null
          id?: string
          name_en: string
          name_es: string
          sort_order?: number | null
        }
        Update: {
          applies_to?: string[] | null
          category?: string
          code?: string
          created_at?: string
          icon?: string | null
          id?: string
          name_en?: string
          name_es?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          bank_details: Json | null
          created_at: string | null
          currency: string | null
          default_payment_terms: number | null
          id: string
          invoice_footer: string | null
          invoice_notes: string | null
          organization_id: string | null
          payment_methods: Json | null
          tax_config: Json | null
          updated_at: string | null
        }
        Insert: {
          bank_details?: Json | null
          created_at?: string | null
          currency?: string | null
          default_payment_terms?: number | null
          id?: string
          invoice_footer?: string | null
          invoice_notes?: string | null
          organization_id?: string | null
          payment_methods?: Json | null
          tax_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          bank_details?: Json | null
          created_at?: string | null
          currency?: string | null
          default_payment_terms?: number | null
          id?: string
          invoice_footer?: string | null
          invoice_notes?: string | null
          organization_id?: string | null
          payment_methods?: Json | null
          tax_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      predictive_alerts: {
        Row: {
          alert_type: string | null
          confidence: number | null
          created_at: string | null
          description: string | null
          dismissed_at: string | null
          id: string
          matter_id: string | null
          metadata: Json | null
          organization_id: string | null
          priority: string | null
          resolved_at: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          alert_type?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          dismissed_at?: string | null
          id?: string
          matter_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          alert_type?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          dismissed_at?: string | null
          id?: string
          matter_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      pricing_jurisdictions: {
        Row: {
          automation_level: string
          automation_reason: string | null
          code: string
          coverage_countries: number | null
          coverage_description: string | null
          created_at: string | null
          default_currency: string | null
          display_order: number | null
          estimated_time_platform: string | null
          estimated_time_total: string | null
          external_portal_name: string | null
          external_portal_url: string | null
          flag: string | null
          flag_image_url: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_classes: number | null
          name: string
          name_en: string | null
          notes: string | null
          office_code: string | null
          office_name: string | null
          office_website: string | null
          requirements: Json | null
          supports_classes: boolean | null
          supports_designs: boolean | null
          supports_patents: boolean | null
          supports_trademarks: boolean | null
          updated_at: string | null
        }
        Insert: {
          automation_level?: string
          automation_reason?: string | null
          code: string
          coverage_countries?: number | null
          coverage_description?: string | null
          created_at?: string | null
          default_currency?: string | null
          display_order?: number | null
          estimated_time_platform?: string | null
          estimated_time_total?: string | null
          external_portal_name?: string | null
          external_portal_url?: string | null
          flag?: string | null
          flag_image_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_classes?: number | null
          name: string
          name_en?: string | null
          notes?: string | null
          office_code?: string | null
          office_name?: string | null
          office_website?: string | null
          requirements?: Json | null
          supports_classes?: boolean | null
          supports_designs?: boolean | null
          supports_patents?: boolean | null
          supports_trademarks?: boolean | null
          updated_at?: string | null
        }
        Update: {
          automation_level?: string
          automation_reason?: string | null
          code?: string
          coverage_countries?: number | null
          coverage_description?: string | null
          created_at?: string | null
          default_currency?: string | null
          display_order?: number | null
          estimated_time_platform?: string | null
          estimated_time_total?: string | null
          external_portal_name?: string | null
          external_portal_url?: string | null
          flag?: string | null
          flag_image_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_classes?: number | null
          name?: string
          name_en?: string | null
          notes?: string | null
          office_code?: string | null
          office_name?: string | null
          office_website?: string | null
          requirements?: Json | null
          supports_classes?: boolean | null
          supports_designs?: boolean | null
          supports_patents?: boolean | null
          supports_trademarks?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_services: {
        Row: {
          additional_class_price: number | null
          allows_additional_classes: boolean | null
          base_classes: number | null
          base_price: number
          code: string
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          currency: string | null
          description: string | null
          description_en: string | null
          display_order: number | null
          estimated_time: string | null
          features: Json | null
          id: string
          internal_cost: number | null
          internal_cost_per_class: number | null
          is_active: boolean | null
          is_featured: boolean | null
          jurisdiction_id: string | null
          name: string
          name_en: string | null
          notes: string | null
          official_fee: number | null
          official_fee_currency: string | null
          official_fee_included: boolean | null
          official_fee_per_class: Json | null
          requirements: Json | null
          service_subtype: string | null
          service_type: string
          show_on_pricing_page: boolean | null
          show_on_wizard: boolean | null
          third_party_cost_included: boolean | null
          third_party_cost_max: number | null
          third_party_cost_min: number | null
          third_party_description: string | null
          updated_at: string | null
        }
        Insert: {
          additional_class_price?: number | null
          allows_additional_classes?: boolean | null
          base_classes?: number | null
          base_price: number
          code: string
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          currency?: string | null
          description?: string | null
          description_en?: string | null
          display_order?: number | null
          estimated_time?: string | null
          features?: Json | null
          id?: string
          internal_cost?: number | null
          internal_cost_per_class?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          jurisdiction_id?: string | null
          name: string
          name_en?: string | null
          notes?: string | null
          official_fee?: number | null
          official_fee_currency?: string | null
          official_fee_included?: boolean | null
          official_fee_per_class?: Json | null
          requirements?: Json | null
          service_subtype?: string | null
          service_type: string
          show_on_pricing_page?: boolean | null
          show_on_wizard?: boolean | null
          third_party_cost_included?: boolean | null
          third_party_cost_max?: number | null
          third_party_cost_min?: number | null
          third_party_description?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_class_price?: number | null
          allows_additional_classes?: boolean | null
          base_classes?: number | null
          base_price?: number
          code?: string
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          currency?: string | null
          description?: string | null
          description_en?: string | null
          display_order?: number | null
          estimated_time?: string | null
          features?: Json | null
          id?: string
          internal_cost?: number | null
          internal_cost_per_class?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          jurisdiction_id?: string | null
          name?: string
          name_en?: string | null
          notes?: string | null
          official_fee?: number | null
          official_fee_currency?: string | null
          official_fee_included?: boolean | null
          official_fee_per_class?: Json | null
          requirements?: Json | null
          service_subtype?: string | null
          service_type?: string
          show_on_pricing_page?: boolean | null
          show_on_wizard?: boolean | null
          third_party_cost_included?: boolean | null
          third_party_cost_max?: number | null
          third_party_cost_min?: number | null
          third_party_description?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_services_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "pricing_jurisdictions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string | null
          preferences: Json | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          organization_id?: string | null
          preferences?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          preferences?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provisions: {
        Row: {
          amount: number
          client_id: string | null
          concept: string
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          id: string
          invoice_id: string | null
          matter_id: string | null
          organization_id: string
          payment_date: string | null
          payment_reference: string | null
          quote_id: string | null
          quote_line_id: string | null
          received_at: string | null
          requested_at: string | null
          returned_amount: number | null
          returned_at: string | null
          status: string
          updated_at: string
          used_amount: number | null
          used_for: string | null
        }
        Insert: {
          amount?: number
          client_id?: string | null
          concept: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          matter_id?: string | null
          organization_id: string
          payment_date?: string | null
          payment_reference?: string | null
          quote_id?: string | null
          quote_line_id?: string | null
          received_at?: string | null
          requested_at?: string | null
          returned_amount?: number | null
          returned_at?: string | null
          status?: string
          updated_at?: string
          used_amount?: number | null
          used_for?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          concept?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          matter_id?: string | null
          organization_id?: string
          payment_date?: string | null
          payment_reference?: string | null
          quote_id?: string | null
          quote_line_id?: string | null
          received_at?: string | null
          requested_at?: string | null
          returned_amount?: number | null
          returned_at?: string | null
          status?: string
          updated_at?: string
          used_amount?: number | null
          used_for?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provisions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisions_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string | null
          created_at: string
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_key?: string | null
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_key?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          description: string
          id: string
          jurisdiction_code: string | null
          line_type: string | null
          organization_id: string
          quantity: number | null
          quote_id: string
          sort_order: number | null
          subtotal: number
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          jurisdiction_code?: string | null
          line_type?: string | null
          organization_id: string
          quantity?: number | null
          quote_id: string
          sort_order?: number | null
          subtotal: number
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          jurisdiction_code?: string | null
          line_type?: string | null
          organization_id?: string
          quantity?: number | null
          quote_id?: string
          sort_order?: number | null
          subtotal?: number
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          client_email: string | null
          client_name: string
          converted_to_invoice_id: string | null
          created_at: string | null
          created_by: string | null
          crm_account_id: string | null
          crm_deal_id: string | null
          currency: string | null
          id: string
          jurisdictions: Json | null
          notes: string | null
          organization_id: string
          quote_number: string | null
          rejected_at: string | null
          sent_at: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          terms: string | null
          total_amount: number | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_email?: string | null
          client_name: string
          converted_to_invoice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_account_id?: string | null
          crm_deal_id?: string | null
          currency?: string | null
          id?: string
          jurisdictions?: Json | null
          notes?: string | null
          organization_id: string
          quote_number?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_email?: string | null
          client_name?: string
          converted_to_invoice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_account_id?: string | null
          crm_deal_id?: string | null
          currency?: string | null
          id?: string
          jurisdictions?: Json | null
          notes?: string | null
          organization_id?: string
          quote_number?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_converted_to_invoice_id_fkey"
            columns: ["converted_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_crm_account_id_fkey"
            columns: ["crm_account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_crm_deal_id_fkey"
            columns: ["crm_deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_chunks: {
        Row: {
          chunk_index: number | null
          content: string | null
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          token_count: number | null
        }
        Insert: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Relationships: []
      }
      rag_documents: {
        Row: {
          chunk_count: number | null
          collection_id: string | null
          content: string | null
          created_at: string | null
          file_path: string | null
          id: string
          metadata: Json | null
          source: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          chunk_count?: number | null
          collection_id?: string | null
          content?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          chunk_count?: number | null
          collection_id?: string | null
          content?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rag_knowledge_bases: {
        Row: {
          chunk_count: number | null
          created_at: string | null
          description: string | null
          document_count: number | null
          embedding_model: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string | null
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          embedding_model?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chunk_count?: number | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          embedding_model?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rag_queries: {
        Row: {
          chunks_retrieved: number | null
          created_at: string | null
          id: string
          knowledge_base_id: string | null
          query_text: string | null
          response_text: string | null
          similarity_threshold: number | null
          user_id: string | null
        }
        Insert: {
          chunks_retrieved?: number | null
          created_at?: string | null
          id?: string
          knowledge_base_id?: string | null
          query_text?: string | null
          response_text?: string | null
          similarity_threshold?: number | null
          user_id?: string | null
        }
        Update: {
          chunks_retrieved?: number | null
          created_at?: string | null
          id?: string
          knowledge_base_id?: string | null
          query_text?: string | null
          response_text?: string | null
          similarity_threshold?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      rag_search_logs: {
        Row: {
          avg_similarity: number | null
          chunks_returned: number | null
          created_at: string | null
          id: string
          knowledge_base_id: string | null
          max_similarity: number | null
          min_similarity: number | null
          query_text: string | null
          search_time_ms: number | null
          user_id: string | null
        }
        Insert: {
          avg_similarity?: number | null
          chunks_returned?: number | null
          created_at?: string | null
          id?: string
          knowledge_base_id?: string | null
          max_similarity?: number | null
          min_similarity?: number | null
          query_text?: string | null
          search_time_ms?: number | null
          user_id?: string | null
        }
        Update: {
          avg_similarity?: number | null
          chunks_returned?: number | null
          created_at?: string | null
          id?: string
          knowledge_base_id?: string | null
          max_similarity?: number | null
          min_similarity?: number | null
          query_text?: string | null
          search_time_ms?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      regional_agent_config: {
        Row: {
          country_codes: string[]
          created_at: string | null
          currencies: string[]
          extraction_system_prompt: string
          handles_tier_2: boolean | null
          handles_tier_4: boolean | null
          id: string
          is_active: boolean | null
          jurisdictions_with_data: number | null
          last_batch_run: string | null
          last_batch_success_rate: number | null
          model_id: string | null
          region_code: string
          region_emoji: string
          region_name: string
          regional_context: string
          scheduled_day_of_week: number | null
          scheduled_hour_utc: number | null
          total_jurisdictions: number | null
          updated_at: string | null
          web_languages: string[]
        }
        Insert: {
          country_codes: string[]
          created_at?: string | null
          currencies: string[]
          extraction_system_prompt: string
          handles_tier_2?: boolean | null
          handles_tier_4?: boolean | null
          id?: string
          is_active?: boolean | null
          jurisdictions_with_data?: number | null
          last_batch_run?: string | null
          last_batch_success_rate?: number | null
          model_id?: string | null
          region_code: string
          region_emoji: string
          region_name: string
          regional_context: string
          scheduled_day_of_week?: number | null
          scheduled_hour_utc?: number | null
          total_jurisdictions?: number | null
          updated_at?: string | null
          web_languages: string[]
        }
        Update: {
          country_codes?: string[]
          created_at?: string | null
          currencies?: string[]
          extraction_system_prompt?: string
          handles_tier_2?: boolean | null
          handles_tier_4?: boolean | null
          id?: string
          is_active?: boolean | null
          jurisdictions_with_data?: number | null
          last_batch_run?: string | null
          last_batch_success_rate?: number | null
          model_id?: string | null
          region_code?: string
          region_emoji?: string
          region_name?: string
          regional_context?: string
          scheduled_day_of_week?: number | null
          scheduled_hour_utc?: number | null
          total_jurisdictions?: number | null
          updated_at?: string | null
          web_languages?: string[]
        }
        Relationships: []
      }
      relationship_to_party_mapping: {
        Row: {
          auto_import: boolean | null
          created_at: string
          id: string
          ip_types: string[] | null
          notes: string | null
          party_role_code: string
          relationship_type: string
        }
        Insert: {
          auto_import?: boolean | null
          created_at?: string
          id?: string
          ip_types?: string[] | null
          notes?: string | null
          party_role_code: string
          relationship_type: string
        }
        Update: {
          auto_import?: boolean | null
          created_at?: string
          id?: string
          ip_types?: string[] | null
          notes?: string | null
          party_role_code?: string
          relationship_type?: string
        }
        Relationships: []
      }
      renewal_schedule: {
        Row: {
          created_at: string | null
          id: string
          matter_id: string | null
          next_renewal_date: string | null
          organization_id: string | null
          renewal_cost: number | null
          renewal_number: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          matter_id?: string | null
          next_renewal_date?: string | null
          organization_id?: string | null
          renewal_cost?: number | null
          renewal_number?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          matter_id?: string | null
          next_renewal_date?: string | null
          organization_id?: string | null
          renewal_cost?: number | null
          renewal_number?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      report_definitions: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string | null
          organization_id: string | null
          report_type: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          report_type?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          report_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      report_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_url: string | null
          id: string
          organization_id: string | null
          report_id: string | null
          started_at: string | null
          status: string | null
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_url?: string | null
          id?: string
          organization_id?: string | null
          report_id?: string | null
          started_at?: string | null
          status?: string | null
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_url?: string | null
          id?: string
          organization_id?: string | null
          report_id?: string | null
          started_at?: string | null
          status?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          category: string | null
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string | null
          organization_id: string | null
          template_type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          template_type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          template_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          actions: string[] | null
          conditions: Json | null
          created_at: string
          id: string
          resource: string
          role_id: string | null
          scope: string
        }
        Insert: {
          actions?: string[] | null
          conditions?: Json | null
          created_at?: string
          id?: string
          resource: string
          role_id?: string | null
          scope: string
        }
        Update: {
          actions?: string[] | null
          conditions?: Json | null
          created_at?: string
          id?: string
          resource?: string
          role_id?: string | null
          scope?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string
          created_by: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          organization_id: string
          parameters: Json | null
          recipients: string[] | null
          report_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id: string
          parameters?: Json | null
          recipients?: string[] | null
          report_type: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id?: string
          parameters?: Json | null
          recipients?: string[] | null
          report_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string
          entity_types: string[] | null
          filters: Json | null
          id: string
          organization_id: string | null
          query: string
          source: string | null
          total_results: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_types?: string[] | null
          filters?: Json | null
          id?: string
          organization_id?: string | null
          query: string
          source?: string | null
          total_results?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_types?: string[] | null
          filters?: Json | null
          id?: string
          organization_id?: string | null
          query?: string
          source?: string | null
          total_results?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      search_service_config: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string | null
          service_key: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          service_key?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          service_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      search_synonyms: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string | null
          source_term: string | null
          synonyms: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          source_term?: string | null
          synonyms?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          source_term?: string | null
          synonyms?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          additional_class_fee_eur: number | null
          applicable_offices: string[] | null
          available_globally: boolean | null
          base_price: number
          category: string | null
          category_id: string | null
          competitor_service_codes: string[] | null
          complexity: string | null
          created_at: string
          currency: string
          default_jurisdiction: string | null
          default_matter_subtype: string | null
          default_matter_type: string | null
          description: string | null
          description_en: string | null
          description_pt: string | null
          discovery_tags: string[] | null
          display_order: number | null
          estimated_days: number | null
          estimated_days_max: number | null
          estimated_days_min: number | null
          estimated_duration: string | null
          estimated_hours: number | null
          extra_class_fee: number | null
          fee_type_link: string | null
          generates_matter: boolean | null
          has_official_fee: boolean | null
          id: string
          includes_official_fees: boolean | null
          is_active: boolean
          is_automatable: boolean | null
          is_flagship: boolean | null
          is_preconfigured: boolean | null
          is_public: boolean | null
          is_recurring: boolean | null
          jurisdiction: string | null
          long_description: string | null
          long_description_en: string | null
          long_description_pt: string | null
          name: string
          name_de: string | null
          name_en: string | null
          name_fr: string | null
          name_pt: string | null
          nice_class_dependent: boolean | null
          nice_classes_included: number | null
          official_fee: number | null
          official_fees_note: string | null
          organization_id: string | null
          preconfigured_code: string | null
          price_from_eur: number | null
          price_to_eur: number | null
          pricing_model: string | null
          professional_fee: number | null
          recurrence_period: string | null
          reference_code: string | null
          requires_jurisdiction: boolean | null
          requires_local_agent: boolean | null
          service_type: string | null
          show_in_landing: boolean | null
          show_in_portal: boolean | null
          stripe_price_id: string | null
          subcategory: string | null
          tax_rate: number | null
          updated_at: string
        }
        Insert: {
          additional_class_fee_eur?: number | null
          applicable_offices?: string[] | null
          available_globally?: boolean | null
          base_price?: number
          category?: string | null
          category_id?: string | null
          competitor_service_codes?: string[] | null
          complexity?: string | null
          created_at?: string
          currency?: string
          default_jurisdiction?: string | null
          default_matter_subtype?: string | null
          default_matter_type?: string | null
          description?: string | null
          description_en?: string | null
          description_pt?: string | null
          discovery_tags?: string[] | null
          display_order?: number | null
          estimated_days?: number | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          estimated_duration?: string | null
          estimated_hours?: number | null
          extra_class_fee?: number | null
          fee_type_link?: string | null
          generates_matter?: boolean | null
          has_official_fee?: boolean | null
          id?: string
          includes_official_fees?: boolean | null
          is_active?: boolean
          is_automatable?: boolean | null
          is_flagship?: boolean | null
          is_preconfigured?: boolean | null
          is_public?: boolean | null
          is_recurring?: boolean | null
          jurisdiction?: string | null
          long_description?: string | null
          long_description_en?: string | null
          long_description_pt?: string | null
          name: string
          name_de?: string | null
          name_en?: string | null
          name_fr?: string | null
          name_pt?: string | null
          nice_class_dependent?: boolean | null
          nice_classes_included?: number | null
          official_fee?: number | null
          official_fees_note?: string | null
          organization_id?: string | null
          preconfigured_code?: string | null
          price_from_eur?: number | null
          price_to_eur?: number | null
          pricing_model?: string | null
          professional_fee?: number | null
          recurrence_period?: string | null
          reference_code?: string | null
          requires_jurisdiction?: boolean | null
          requires_local_agent?: boolean | null
          service_type?: string | null
          show_in_landing?: boolean | null
          show_in_portal?: boolean | null
          stripe_price_id?: string | null
          subcategory?: string | null
          tax_rate?: number | null
          updated_at?: string
        }
        Update: {
          additional_class_fee_eur?: number | null
          applicable_offices?: string[] | null
          available_globally?: boolean | null
          base_price?: number
          category?: string | null
          category_id?: string | null
          competitor_service_codes?: string[] | null
          complexity?: string | null
          created_at?: string
          currency?: string
          default_jurisdiction?: string | null
          default_matter_subtype?: string | null
          default_matter_type?: string | null
          description?: string | null
          description_en?: string | null
          description_pt?: string | null
          discovery_tags?: string[] | null
          display_order?: number | null
          estimated_days?: number | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          estimated_duration?: string | null
          estimated_hours?: number | null
          extra_class_fee?: number | null
          fee_type_link?: string | null
          generates_matter?: boolean | null
          has_official_fee?: boolean | null
          id?: string
          includes_official_fees?: boolean | null
          is_active?: boolean
          is_automatable?: boolean | null
          is_flagship?: boolean | null
          is_preconfigured?: boolean | null
          is_public?: boolean | null
          is_recurring?: boolean | null
          jurisdiction?: string | null
          long_description?: string | null
          long_description_en?: string | null
          long_description_pt?: string | null
          name?: string
          name_de?: string | null
          name_en?: string | null
          name_fr?: string | null
          name_pt?: string | null
          nice_class_dependent?: boolean | null
          nice_classes_included?: number | null
          official_fee?: number | null
          official_fees_note?: string | null
          organization_id?: string | null
          preconfigured_code?: string | null
          price_from_eur?: number | null
          price_to_eur?: number | null
          pricing_model?: string | null
          professional_fee?: number | null
          recurrence_period?: string | null
          reference_code?: string | null
          requires_jurisdiction?: boolean | null
          requires_local_agent?: boolean | null
          service_type?: string | null
          show_in_landing?: boolean | null
          show_in_portal?: boolean | null
          stripe_price_id?: string | null
          subcategory?: string | null
          tax_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_catalog_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          description_en: string | null
          description_es: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_es: string
          parent_id: string | null
          position: number | null
          right_type: string | null
          right_types: string[] | null
          updated_at: string | null
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          description_en?: string | null
          description_es?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_es: string
          parent_id?: string | null
          position?: number | null
          right_type?: string | null
          right_types?: string[] | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          description_en?: string | null
          description_es?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_es?: string
          parent_id?: string | null
          position?: number | null
          right_type?: string | null
          right_types?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_pricing_rules: {
        Row: {
          base_price: number | null
          conditions: Json | null
          country_code: string | null
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          price_per_class: number | null
          service_type: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          conditions?: Json | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          price_per_class?: number | null
          service_type?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          conditions?: Json | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          price_per_class?: number | null
          service_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string | null
          priority: string | null
          request_type: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          request_type?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          request_type?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string | null
          organization_id: string | null
          service_type: string | null
          steps: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          service_type?: string | null
          steps?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          service_type?: string | null
          steps?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      settings_audit_log: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          organization_id: string | null
          setting_key: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          setting_key: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          setting_key?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          signature_request_id: string | null
          signer_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          signature_request_id?: string | null
          signer_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          signature_request_id?: string | null
          signer_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      similarity_analyses: {
        Row: {
          analysis_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          matter_id: string | null
          organization_id: string | null
          results: Json | null
          search_term: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          analysis_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          matter_id?: string | null
          organization_id?: string | null
          results?: Json | null
          search_term?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          matter_id?: string | null
          organization_id?: string | null
          results?: Json | null
          search_term?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_config: {
        Row: {
          created_at: string | null
          id: string
          key: string | null
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      spider_alert_history: {
        Row: {
          alert_id: string
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          new_status: string | null
          notes: string | null
          old_status: string | null
          organization_id: string
          performed_by: string | null
        }
        Insert: {
          alert_id: string
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          organization_id: string
          performed_by?: string | null
        }
        Update: {
          alert_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          organization_id?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spider_alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "spider_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_alert_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_alert_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spider_alerts: {
        Row: {
          action_notes: string | null
          action_taken: string | null
          actioned_at: string | null
          actioned_by: string | null
          ai_analysis: string | null
          ai_disclaimer: string | null
          ai_key_factors: string[] | null
          ai_recommendation: string | null
          ai_risk_level: string | null
          combined_score: number
          created_at: string | null
          crm_deal_id: string | null
          detected_applicant: string | null
          detected_applicant_country: string | null
          detected_application_number: string | null
          detected_at: string | null
          detected_filing_date: string | null
          detected_goods_services: string | null
          detected_jurisdiction: string
          detected_mark_image_url: string | null
          detected_mark_name: string
          detected_mark_name_normalized: string
          detected_mark_status: string | null
          detected_nice_classes: number[] | null
          detected_publication_date: string | null
          id: string
          matter_id: string | null
          opposition_days_remaining: number | null
          opposition_deadline: string | null
          opposition_matter_id: string | null
          organization_id: string
          phonetic_score: number | null
          semantic_score: number | null
          severity: string
          snoozed_until: string | null
          source_code: string
          source_reliability: string | null
          source_url: string | null
          status: string
          viewed_at: string | null
          viewed_by: string | null
          visual_score: number | null
          watch_id: string
          weight_phonetic_used: number | null
          weight_semantic_used: number | null
          weight_visual_used: number | null
          workflow_step_id: string | null
        }
        Insert: {
          action_notes?: string | null
          action_taken?: string | null
          actioned_at?: string | null
          actioned_by?: string | null
          ai_analysis?: string | null
          ai_disclaimer?: string | null
          ai_key_factors?: string[] | null
          ai_recommendation?: string | null
          ai_risk_level?: string | null
          combined_score: number
          created_at?: string | null
          crm_deal_id?: string | null
          detected_applicant?: string | null
          detected_applicant_country?: string | null
          detected_application_number?: string | null
          detected_at?: string | null
          detected_filing_date?: string | null
          detected_goods_services?: string | null
          detected_jurisdiction: string
          detected_mark_image_url?: string | null
          detected_mark_name: string
          detected_mark_name_normalized: string
          detected_mark_status?: string | null
          detected_nice_classes?: number[] | null
          detected_publication_date?: string | null
          id?: string
          matter_id?: string | null
          opposition_days_remaining?: number | null
          opposition_deadline?: string | null
          opposition_matter_id?: string | null
          organization_id: string
          phonetic_score?: number | null
          semantic_score?: number | null
          severity: string
          snoozed_until?: string | null
          source_code: string
          source_reliability?: string | null
          source_url?: string | null
          status?: string
          viewed_at?: string | null
          viewed_by?: string | null
          visual_score?: number | null
          watch_id: string
          weight_phonetic_used?: number | null
          weight_semantic_used?: number | null
          weight_visual_used?: number | null
          workflow_step_id?: string | null
        }
        Update: {
          action_notes?: string | null
          action_taken?: string | null
          actioned_at?: string | null
          actioned_by?: string | null
          ai_analysis?: string | null
          ai_disclaimer?: string | null
          ai_key_factors?: string[] | null
          ai_recommendation?: string | null
          ai_risk_level?: string | null
          combined_score?: number
          created_at?: string | null
          crm_deal_id?: string | null
          detected_applicant?: string | null
          detected_applicant_country?: string | null
          detected_application_number?: string | null
          detected_at?: string | null
          detected_filing_date?: string | null
          detected_goods_services?: string | null
          detected_jurisdiction?: string
          detected_mark_image_url?: string | null
          detected_mark_name?: string
          detected_mark_name_normalized?: string
          detected_mark_status?: string | null
          detected_nice_classes?: number[] | null
          detected_publication_date?: string | null
          id?: string
          matter_id?: string | null
          opposition_days_remaining?: number | null
          opposition_deadline?: string | null
          opposition_matter_id?: string | null
          organization_id?: string
          phonetic_score?: number | null
          semantic_score?: number | null
          severity?: string
          snoozed_until?: string | null
          source_code?: string
          source_reliability?: string | null
          source_url?: string | null
          status?: string
          viewed_at?: string | null
          viewed_by?: string | null
          visual_score?: number | null
          watch_id?: string
          weight_phonetic_used?: number | null
          weight_semantic_used?: number | null
          weight_visual_used?: number | null
          workflow_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spider_alerts_actioned_by_fkey"
            columns: ["actioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_alerts_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_alerts_opposition_matter_id_fkey"
            columns: ["opposition_matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_alerts_viewed_by_fkey"
            columns: ["viewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_alerts_watch_id_fkey"
            columns: ["watch_id"]
            isOneToOne: false
            referencedRelation: "spider_watches"
            referencedColumns: ["id"]
          },
        ]
      }
      spider_analysis_cache: {
        Row: {
          cached_at: string | null
          combined_score: number
          detected_name_normalized: string
          expires_at: string | null
          id: string
          organization_id: string
          phonetic_score: number
          semantic_score: number
          visual_score: number | null
          watch_name_normalized: string
          weights_used: Json
        }
        Insert: {
          cached_at?: string | null
          combined_score: number
          detected_name_normalized: string
          expires_at?: string | null
          id?: string
          organization_id: string
          phonetic_score: number
          semantic_score: number
          visual_score?: number | null
          watch_name_normalized: string
          weights_used: Json
        }
        Update: {
          cached_at?: string | null
          combined_score?: number
          detected_name_normalized?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          phonetic_score?: number
          semantic_score?: number
          visual_score?: number | null
          watch_name_normalized?: string
          weights_used?: Json
        }
        Relationships: [
          {
            foreignKeyName: "spider_analysis_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      spider_opposition_deadlines: {
        Row: {
          count_from: string
          id: string
          is_extendable: boolean | null
          jurisdiction_code: string
          jurisdiction_name: string
          last_verified_at: string | null
          legal_basis: string | null
          legal_notes: string | null
          max_extension_days: number | null
          opposition_days: number
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          count_from: string
          id?: string
          is_extendable?: boolean | null
          jurisdiction_code: string
          jurisdiction_name: string
          last_verified_at?: string | null
          legal_basis?: string | null
          legal_notes?: string | null
          max_extension_days?: number | null
          opposition_days: number
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          count_from?: string
          id?: string
          is_extendable?: boolean | null
          jurisdiction_code?: string
          jurisdiction_name?: string
          last_verified_at?: string | null
          legal_basis?: string | null
          legal_notes?: string | null
          max_extension_days?: number | null
          opposition_days?: number
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spider_reports: {
        Row: {
          date_from: string | null
          date_to: string | null
          error_message: string | null
          expires_at: string | null
          file_size_bytes: number | null
          generated_at: string | null
          generated_by: string | null
          id: string
          jurisdiction_codes: string[] | null
          organization_id: string
          report_type: string
          status: string | null
          storage_path: string | null
          title: string
          watch_ids: string[] | null
        }
        Insert: {
          date_from?: string | null
          date_to?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          jurisdiction_codes?: string[] | null
          organization_id: string
          report_type: string
          status?: string | null
          storage_path?: string | null
          title: string
          watch_ids?: string[] | null
        }
        Update: {
          date_from?: string | null
          date_to?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          jurisdiction_codes?: string[] | null
          organization_id?: string
          report_type?: string
          status?: string | null
          storage_path?: string | null
          title?: string
          watch_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "spider_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      spider_scan_runs: {
        Row: {
          ai_cost_eur: number | null
          ai_tokens_used: number | null
          alerts_created: number | null
          alerts_skipped_cache: number | null
          alerts_updated: number | null
          comparisons_made: number | null
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          errors_by_jurisdiction: Json | null
          id: string
          jurisdictions_attempted: string[] | null
          jurisdictions_failed: string[] | null
          jurisdictions_succeeded: string[] | null
          marks_scanned: number | null
          organization_id: string
          scan_type: string
          sources_used: string[] | null
          started_at: string | null
          status: string | null
          watch_id: string | null
        }
        Insert: {
          ai_cost_eur?: number | null
          ai_tokens_used?: number | null
          alerts_created?: number | null
          alerts_skipped_cache?: number | null
          alerts_updated?: number | null
          comparisons_made?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          errors_by_jurisdiction?: Json | null
          id?: string
          jurisdictions_attempted?: string[] | null
          jurisdictions_failed?: string[] | null
          jurisdictions_succeeded?: string[] | null
          marks_scanned?: number | null
          organization_id: string
          scan_type: string
          sources_used?: string[] | null
          started_at?: string | null
          status?: string | null
          watch_id?: string | null
        }
        Update: {
          ai_cost_eur?: number | null
          ai_tokens_used?: number | null
          alerts_created?: number | null
          alerts_skipped_cache?: number | null
          alerts_updated?: number | null
          comparisons_made?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          errors_by_jurisdiction?: Json | null
          id?: string
          jurisdictions_attempted?: string[] | null
          jurisdictions_failed?: string[] | null
          jurisdictions_succeeded?: string[] | null
          marks_scanned?: number | null
          organization_id?: string
          scan_type?: string
          sources_used?: string[] | null
          started_at?: string | null
          status?: string | null
          watch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spider_scan_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_scan_runs_watch_id_fkey"
            columns: ["watch_id"]
            isOneToOne: false
            referencedRelation: "spider_watches"
            referencedColumns: ["id"]
          },
        ]
      }
      spider_supported_sources: {
        Row: {
          api_type: string
          base_url: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          jurisdictions_covered: string[] | null
          name: string
          notes: string | null
          rate_limit_per_minute: number | null
          reliability_level: string | null
          requires_credentials: boolean | null
        }
        Insert: {
          api_type: string
          base_url?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jurisdictions_covered?: string[] | null
          name: string
          notes?: string | null
          rate_limit_per_minute?: number | null
          reliability_level?: string | null
          requires_credentials?: boolean | null
        }
        Update: {
          api_type?: string
          base_url?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jurisdictions_covered?: string[] | null
          name?: string
          notes?: string | null
          rate_limit_per_minute?: number | null
          reliability_level?: string | null
          requires_credentials?: boolean | null
        }
        Relationships: []
      }
      spider_tenant_config: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          alerts_month_reset_at: string | null
          alerts_this_month: number | null
          default_jurisdictions: string[] | null
          default_scan_frequency: string | null
          default_similarity_threshold: number | null
          domain_watch_enabled: boolean | null
          feature_phonetic: boolean | null
          feature_semantic: boolean | null
          feature_visual: boolean | null
          id: string
          is_active: boolean | null
          max_alerts_per_month: number | null
          max_jurisdictions_per_watch: number | null
          max_scans_per_month: number | null
          max_watches: number | null
          notes: string | null
          notification_emails: string[] | null
          notify_critical: boolean | null
          notify_high: boolean | null
          notify_low: boolean | null
          notify_medium: boolean | null
          organization_id: string
          plan_code: string
          realtime_scan_enabled: boolean | null
          updated_at: string | null
          webhook_secret: string | null
          webhook_url: string | null
          weight_phonetic: number | null
          weight_semantic: number | null
          weight_visual: number | null
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          alerts_month_reset_at?: string | null
          alerts_this_month?: number | null
          default_jurisdictions?: string[] | null
          default_scan_frequency?: string | null
          default_similarity_threshold?: number | null
          domain_watch_enabled?: boolean | null
          feature_phonetic?: boolean | null
          feature_semantic?: boolean | null
          feature_visual?: boolean | null
          id?: string
          is_active?: boolean | null
          max_alerts_per_month?: number | null
          max_jurisdictions_per_watch?: number | null
          max_scans_per_month?: number | null
          max_watches?: number | null
          notes?: string | null
          notification_emails?: string[] | null
          notify_critical?: boolean | null
          notify_high?: boolean | null
          notify_low?: boolean | null
          notify_medium?: boolean | null
          organization_id: string
          plan_code?: string
          realtime_scan_enabled?: boolean | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
          weight_phonetic?: number | null
          weight_semantic?: number | null
          weight_visual?: number | null
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          alerts_month_reset_at?: string | null
          alerts_this_month?: number | null
          default_jurisdictions?: string[] | null
          default_scan_frequency?: string | null
          default_similarity_threshold?: number | null
          domain_watch_enabled?: boolean | null
          feature_phonetic?: boolean | null
          feature_semantic?: boolean | null
          feature_visual?: boolean | null
          id?: string
          is_active?: boolean | null
          max_alerts_per_month?: number | null
          max_jurisdictions_per_watch?: number | null
          max_scans_per_month?: number | null
          max_watches?: number | null
          notes?: string | null
          notification_emails?: string[] | null
          notify_critical?: boolean | null
          notify_high?: boolean | null
          notify_low?: boolean | null
          notify_medium?: boolean | null
          organization_id?: string
          plan_code?: string
          realtime_scan_enabled?: boolean | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
          weight_phonetic?: number | null
          weight_semantic?: number | null
          weight_visual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spider_tenant_config_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_tenant_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      spider_watches: {
        Row: {
          active_alerts_count: number | null
          check_phonetic: boolean | null
          check_semantic: boolean | null
          check_visual: boolean | null
          created_at: string | null
          created_by: string | null
          false_positives_count: number | null
          id: string
          is_active: boolean | null
          jurisdictions: string[]
          last_scanned_at: string | null
          mark_image_path: string | null
          mark_image_url: string | null
          matter_id: string | null
          next_scan_at: string | null
          nice_classes: number[] | null
          notes: string | null
          organization_id: string
          scan_frequency: string | null
          similarity_threshold: number | null
          total_alerts_generated: number | null
          updated_at: string | null
          watch_name: string
          watch_name_normalized: string
          watch_related_classes: boolean | null
          watch_type: string | null
          weight_phonetic: number | null
          weight_semantic: number | null
          weight_visual: number | null
          workflow_id: string | null
        }
        Insert: {
          active_alerts_count?: number | null
          check_phonetic?: boolean | null
          check_semantic?: boolean | null
          check_visual?: boolean | null
          created_at?: string | null
          created_by?: string | null
          false_positives_count?: number | null
          id?: string
          is_active?: boolean | null
          jurisdictions?: string[]
          last_scanned_at?: string | null
          mark_image_path?: string | null
          mark_image_url?: string | null
          matter_id?: string | null
          next_scan_at?: string | null
          nice_classes?: number[] | null
          notes?: string | null
          organization_id: string
          scan_frequency?: string | null
          similarity_threshold?: number | null
          total_alerts_generated?: number | null
          updated_at?: string | null
          watch_name: string
          watch_name_normalized?: string
          watch_related_classes?: boolean | null
          watch_type?: string | null
          weight_phonetic?: number | null
          weight_semantic?: number | null
          weight_visual?: number | null
          workflow_id?: string | null
        }
        Update: {
          active_alerts_count?: number | null
          check_phonetic?: boolean | null
          check_semantic?: boolean | null
          check_visual?: boolean | null
          created_at?: string | null
          created_by?: string | null
          false_positives_count?: number | null
          id?: string
          is_active?: boolean | null
          jurisdictions?: string[]
          last_scanned_at?: string | null
          mark_image_path?: string | null
          mark_image_url?: string | null
          matter_id?: string | null
          next_scan_at?: string | null
          nice_classes?: number[] | null
          notes?: string | null
          organization_id?: string
          scan_frequency?: string | null
          similarity_threshold?: number | null
          total_alerts_generated?: number | null
          updated_at?: string | null
          watch_name?: string
          watch_name_normalized?: string
          watch_related_classes?: boolean | null
          watch_type?: string | null
          weight_phonetic?: number | null
          weight_semantic?: number | null
          weight_visual?: number | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spider_watches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_watches_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_watches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      spider_workflow_steps: {
        Row: {
          actions_available: string[] | null
          assignee_role: string | null
          auto_escalate: boolean | null
          created_at: string | null
          id: string
          organization_id: string
          sla_hours: number | null
          step_name: string
          step_order: number
          workflow_id: string
        }
        Insert: {
          actions_available?: string[] | null
          assignee_role?: string | null
          auto_escalate?: boolean | null
          created_at?: string | null
          id?: string
          organization_id: string
          sla_hours?: number | null
          step_name: string
          step_order: number
          workflow_id: string
        }
        Update: {
          actions_available?: string[] | null
          assignee_role?: string | null
          auto_escalate?: boolean | null
          created_at?: string | null
          id?: string
          organization_id?: string
          sla_hours?: number | null
          step_name?: string
          step_order?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spider_workflow_steps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spider_workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "spider_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      spider_workflows: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spider_workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          organization_id: string
          plan_id: string
          status: string
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id: string
          plan_id: string
          status?: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id?: string
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      surveillance_alerts: {
        Row: {
          action_notes: string | null
          action_taken: string | null
          ai_analysis: string | null
          alert_type: string | null
          applicant_name: string | null
          confidence: number | null
          config_id: string | null
          created_at: string | null
          description: string | null
          detected_trademark: string | null
          filing_date: string | null
          filing_number: string | null
          id: string
          jurisdiction: string | null
          matter_id: string | null
          metadata: Json | null
          nice_classes: number[] | null
          organization_id: string | null
          resolved_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string | null
          similarity_score: number | null
          source: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          action_notes?: string | null
          action_taken?: string | null
          ai_analysis?: string | null
          alert_type?: string | null
          applicant_name?: string | null
          confidence?: number | null
          config_id?: string | null
          created_at?: string | null
          description?: string | null
          detected_trademark?: string | null
          filing_date?: string | null
          filing_number?: string | null
          id?: string
          jurisdiction?: string | null
          matter_id?: string | null
          metadata?: Json | null
          nice_classes?: number[] | null
          organization_id?: string | null
          resolved_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string | null
          similarity_score?: number | null
          source?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          action_notes?: string | null
          action_taken?: string | null
          ai_analysis?: string | null
          alert_type?: string | null
          applicant_name?: string | null
          confidence?: number | null
          config_id?: string | null
          created_at?: string | null
          description?: string | null
          detected_trademark?: string | null
          filing_date?: string | null
          filing_number?: string | null
          id?: string
          jurisdiction?: string | null
          matter_id?: string | null
          metadata?: Json | null
          nice_classes?: number[] | null
          organization_id?: string | null
          resolved_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string | null
          similarity_score?: number | null
          source?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveillance_alerts_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "surveillance_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      surveillance_configs: {
        Row: {
          countries: string[]
          created_at: string | null
          id: string
          is_active: boolean | null
          last_scan_at: string | null
          matter_id: string | null
          next_scan_at: string | null
          nice_classes: number[]
          organization_id: string
          plan_type: string
          search_name: string
          search_phonetic: boolean | null
          search_variants: string[] | null
          updated_at: string | null
          watch_all_classes: boolean | null
        }
        Insert: {
          countries?: string[]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scan_at?: string | null
          matter_id?: string | null
          next_scan_at?: string | null
          nice_classes?: number[]
          organization_id: string
          plan_type?: string
          search_name: string
          search_phonetic?: boolean | null
          search_variants?: string[] | null
          updated_at?: string | null
          watch_all_classes?: boolean | null
        }
        Update: {
          countries?: string[]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scan_at?: string | null
          matter_id?: string | null
          next_scan_at?: string | null
          nice_classes?: number[]
          organization_id?: string
          plan_type?: string
          search_name?: string
          search_phonetic?: boolean | null
          search_variants?: string[] | null
          updated_at?: string | null
          watch_all_classes?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "surveillance_configs_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveillance_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      surveillance_notification_settings: {
        Row: {
          created_at: string | null
          digest_medium_low: string | null
          email_address: string | null
          email_enabled: boolean | null
          id: string
          notify_immediately_critical: boolean | null
          notify_immediately_high: boolean | null
          organization_id: string
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          whatsapp_enabled: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string | null
          digest_medium_low?: string | null
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_immediately_critical?: boolean | null
          notify_immediately_high?: boolean | null
          organization_id: string
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string | null
          digest_medium_low?: string | null
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_immediately_critical?: boolean | null
          notify_immediately_high?: boolean | null
          organization_id?: string
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveillance_notification_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      surveillance_scans: {
        Row: {
          config_id: string
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          id: string
          new_alerts_created: number | null
          scan_completed_at: string | null
          scan_started_at: string
          scan_status: string | null
          sources_checked: string[] | null
          total_results_found: number | null
        }
        Insert: {
          config_id: string
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          new_alerts_created?: number | null
          scan_completed_at?: string | null
          scan_started_at?: string
          scan_status?: string | null
          sources_checked?: string[] | null
          total_results_found?: number | null
        }
        Update: {
          config_id?: string
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          new_alerts_created?: number | null
          scan_completed_at?: string | null
          scan_started_at?: string
          scan_status?: string | null
          sources_checked?: string[] | null
          total_results_found?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "surveillance_scans_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "surveillance_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      surveillance_subscriptions: {
        Row: {
          alert_threshold: number | null
          created_at: string | null
          end_date: string | null
          frequency: string | null
          id: string
          jurisdictions: string[] | null
          last_scan_at: string | null
          matter_id: string | null
          monthly_price: number | null
          next_scan_at: string | null
          nice_classes: number[] | null
          organization_id: string
          search_term: string
          search_type: string | null
          start_date: string | null
          status: string | null
          subscription_number: string | null
          updated_at: string | null
        }
        Insert: {
          alert_threshold?: number | null
          created_at?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          jurisdictions?: string[] | null
          last_scan_at?: string | null
          matter_id?: string | null
          monthly_price?: number | null
          next_scan_at?: string | null
          nice_classes?: number[] | null
          organization_id: string
          search_term: string
          search_type?: string | null
          start_date?: string | null
          status?: string | null
          subscription_number?: string | null
          updated_at?: string | null
        }
        Update: {
          alert_threshold?: number | null
          created_at?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          jurisdictions?: string[] | null
          last_scan_at?: string | null
          matter_id?: string | null
          monthly_price?: number | null
          next_scan_at?: string | null
          nice_classes?: number[] | null
          organization_id?: string
          search_term?: string
          search_type?: string | null
          start_date?: string | null
          status?: string | null
          subscription_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveillance_subscriptions_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveillance_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string | null
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      telephony_cdrs: {
        Row: {
          answered_at: string | null
          billable_minutes: number | null
          billed_amount: number | null
          created_at: string | null
          crm_account_id: string | null
          crm_activity_id: string | null
          crm_contact_id: string | null
          crm_deal_id: string | null
          direction: string
          duration_seconds: number | null
          ended_at: string | null
          from_number: string
          id: string
          matter_id: string | null
          organization_id: string
          provider_call_sid: string
          provider_code: string
          provider_cost: number | null
          provider_metadata: Json | null
          recording_duration_seconds: number | null
          recording_stored_path: string | null
          recording_url: string | null
          status: string | null
          to_number: string
          transcription_status: string | null
          transcription_text: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          answered_at?: string | null
          billable_minutes?: number | null
          billed_amount?: number | null
          created_at?: string | null
          crm_account_id?: string | null
          crm_activity_id?: string | null
          crm_contact_id?: string | null
          crm_deal_id?: string | null
          direction: string
          duration_seconds?: number | null
          ended_at?: string | null
          from_number: string
          id?: string
          matter_id?: string | null
          organization_id: string
          provider_call_sid: string
          provider_code: string
          provider_cost?: number | null
          provider_metadata?: Json | null
          recording_duration_seconds?: number | null
          recording_stored_path?: string | null
          recording_url?: string | null
          status?: string | null
          to_number: string
          transcription_status?: string | null
          transcription_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          answered_at?: string | null
          billable_minutes?: number | null
          billed_amount?: number | null
          created_at?: string | null
          crm_account_id?: string | null
          crm_activity_id?: string | null
          crm_contact_id?: string | null
          crm_deal_id?: string | null
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          from_number?: string
          id?: string
          matter_id?: string | null
          organization_id?: string
          provider_call_sid?: string
          provider_code?: string
          provider_cost?: number | null
          provider_metadata?: Json | null
          recording_duration_seconds?: number | null
          recording_stored_path?: string | null
          recording_url?: string | null
          status?: string | null
          to_number?: string
          transcription_status?: string | null
          transcription_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telephony_cdrs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      telephony_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          currency: string
          description: string
          id: string
          margin: number | null
          metadata: Json | null
          organization_id: string
          provider_cost: number | null
          reference_id: string | null
          reference_type: string | null
          retail_price: number | null
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          currency?: string
          description: string
          id?: string
          margin?: number | null
          metadata?: Json | null
          organization_id: string
          provider_cost?: number | null
          reference_id?: string | null
          reference_type?: string | null
          retail_price?: number | null
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          currency?: string
          description?: string
          id?: string
          margin?: number | null
          metadata?: Json | null
          organization_id?: string
          provider_cost?: number | null
          reference_id?: string | null
          reference_type?: string | null
          retail_price?: number | null
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telephony_ledger_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "telephony_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      telephony_numbers: {
        Row: {
          country_code: string
          created_at: string | null
          friendly_name: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          monthly_cost: number
          number_type: string | null
          organization_id: string
          phone_number: string
          phone_number_sid: string | null
          provider_code: string
          provider_cost: number
          purchased_at: string | null
          released_at: string | null
          sms_url: string | null
          voice_url: string | null
        }
        Insert: {
          country_code: string
          created_at?: string | null
          friendly_name?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          monthly_cost: number
          number_type?: string | null
          organization_id: string
          phone_number: string
          phone_number_sid?: string | null
          provider_code: string
          provider_cost: number
          purchased_at?: string | null
          released_at?: string | null
          sms_url?: string | null
          voice_url?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          friendly_name?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          monthly_cost?: number
          number_type?: string | null
          organization_id?: string
          phone_number?: string
          phone_number_sid?: string | null
          provider_code?: string
          provider_cost?: number
          purchased_at?: string | null
          released_at?: string | null
          sms_url?: string | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telephony_numbers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      telephony_pricing_rates: {
        Row: {
          billing_increment_seconds: number | null
          created_at: string | null
          destination_country: string
          destination_country_code: string
          destination_prefix: string
          id: string
          is_active: boolean | null
          margin_pct: number | null
          minimum_duration_seconds: number | null
          number_type: string | null
          provider_cost_per_min: number
          retail_price_per_min: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          billing_increment_seconds?: number | null
          created_at?: string | null
          destination_country: string
          destination_country_code: string
          destination_prefix: string
          id?: string
          is_active?: boolean | null
          margin_pct?: number | null
          minimum_duration_seconds?: number | null
          number_type?: string | null
          provider_cost_per_min: number
          retail_price_per_min: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          billing_increment_seconds?: number | null
          created_at?: string | null
          destination_country?: string
          destination_country_code?: string
          destination_prefix?: string
          id?: string
          is_active?: boolean | null
          margin_pct?: number | null
          minimum_duration_seconds?: number | null
          number_type?: string | null
          provider_cost_per_min?: number
          retail_price_per_min?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      telephony_providers: {
        Row: {
          account_sid_secret_name: string | null
          api_key_secret_name: string | null
          api_secret_name: string | null
          code: string
          cost_per_min_eu_landline: number | null
          cost_per_min_eu_mobile: number | null
          cost_per_min_latam: number | null
          cost_per_min_us: number | null
          cost_per_number_month: number | null
          cost_per_sms: number | null
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          master_account_id: string | null
          name: string
          priority: number | null
          supports_recording: boolean | null
          supports_subaccounts: boolean | null
          supports_transcription: boolean | null
          supports_webrtc: boolean | null
          updated_at: string | null
          webhook_base_url: string | null
        }
        Insert: {
          account_sid_secret_name?: string | null
          api_key_secret_name?: string | null
          api_secret_name?: string | null
          code: string
          cost_per_min_eu_landline?: number | null
          cost_per_min_eu_mobile?: number | null
          cost_per_min_latam?: number | null
          cost_per_min_us?: number | null
          cost_per_number_month?: number | null
          cost_per_sms?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          master_account_id?: string | null
          name: string
          priority?: number | null
          supports_recording?: boolean | null
          supports_subaccounts?: boolean | null
          supports_transcription?: boolean | null
          supports_webrtc?: boolean | null
          updated_at?: string | null
          webhook_base_url?: string | null
        }
        Update: {
          account_sid_secret_name?: string | null
          api_key_secret_name?: string | null
          api_secret_name?: string | null
          code?: string
          cost_per_min_eu_landline?: number | null
          cost_per_min_eu_mobile?: number | null
          cost_per_min_latam?: number | null
          cost_per_min_us?: number | null
          cost_per_number_month?: number | null
          cost_per_sms?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          master_account_id?: string | null
          name?: string
          priority?: number | null
          supports_recording?: boolean | null
          supports_subaccounts?: boolean | null
          supports_transcription?: boolean | null
          supports_webrtc?: boolean | null
          updated_at?: string | null
          webhook_base_url?: string | null
        }
        Relationships: []
      }
      telephony_tenants: {
        Row: {
          activated_at: string | null
          addon_code: string | null
          created_at: string | null
          default_caller_id: string | null
          id: string
          included_minutes_monthly: number | null
          is_active: boolean | null
          is_trial: boolean | null
          max_call_duration_minutes: number | null
          max_concurrent_calls: number | null
          minutes_reset_at: string | null
          minutes_used_this_month: number | null
          organization_id: string
          provider_code: string | null
          record_calls: boolean | null
          subaccount_auth_token: string | null
          subaccount_id: string | null
          timezone: string | null
          transcribe_calls: boolean | null
          trial_minutes_remaining: number | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          addon_code?: string | null
          created_at?: string | null
          default_caller_id?: string | null
          id?: string
          included_minutes_monthly?: number | null
          is_active?: boolean | null
          is_trial?: boolean | null
          max_call_duration_minutes?: number | null
          max_concurrent_calls?: number | null
          minutes_reset_at?: string | null
          minutes_used_this_month?: number | null
          organization_id: string
          provider_code?: string | null
          record_calls?: boolean | null
          subaccount_auth_token?: string | null
          subaccount_id?: string | null
          timezone?: string | null
          transcribe_calls?: boolean | null
          trial_minutes_remaining?: number | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          addon_code?: string | null
          created_at?: string | null
          default_caller_id?: string | null
          id?: string
          included_minutes_monthly?: number | null
          is_active?: boolean | null
          is_trial?: boolean | null
          max_call_duration_minutes?: number | null
          max_concurrent_calls?: number | null
          minutes_reset_at?: string | null
          minutes_used_this_month?: number | null
          organization_id?: string
          provider_code?: string | null
          record_calls?: boolean | null
          subaccount_auth_token?: string | null
          subaccount_id?: string | null
          timezone?: string | null
          transcribe_calls?: boolean | null
          trial_minutes_remaining?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telephony_tenants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telephony_tenants_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "telephony_providers"
            referencedColumns: ["code"]
          },
        ]
      }
      telephony_wallets: {
        Row: {
          alert_sent_at: string | null
          auto_recharge_amount: number | null
          auto_recharge_enabled: boolean | null
          auto_recharge_threshold: number | null
          created_at: string | null
          currency: string
          current_balance: number
          id: string
          low_balance_threshold: number | null
          organization_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          alert_sent_at?: string | null
          auto_recharge_amount?: number | null
          auto_recharge_enabled?: boolean | null
          auto_recharge_threshold?: number | null
          created_at?: string | null
          currency?: string
          current_balance?: number
          id?: string
          low_balance_threshold?: number | null
          organization_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          alert_sent_at?: string | null
          auto_recharge_amount?: number | null
          auto_recharge_enabled?: boolean | null
          auto_recharge_threshold?: number | null
          created_at?: string | null
          currency?: string
          current_balance?: number
          id?: string
          low_balance_threshold?: number | null
          organization_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telephony_wallets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      telephony_webrtc_sessions: {
        Row: {
          access_token: string
          created_at: string | null
          device_id: string | null
          id: string
          organization_id: string
          provider_code: string
          status: string | null
          token_expires_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          device_id?: string | null
          id?: string
          organization_id: string
          provider_code: string
          status?: string | null
          token_expires_at: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          device_id?: string | null
          id?: string
          organization_id?: string
          provider_code?: string
          status?: string | null
          token_expires_at?: string
          user_id?: string
        }
        Relationships: []
      }
      template_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      template_field_validations: {
        Row: {
          created_at: string | null
          error_message: string | null
          field_name: string | null
          id: string
          template_id: string | null
          updated_at: string | null
          validation_params: Json | null
          validation_type: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          field_name?: string | null
          id?: string
          template_id?: string | null
          updated_at?: string | null
          validation_params?: Json | null
          validation_type?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          field_name?: string | null
          id?: string
          template_id?: string | null
          updated_at?: string | null
          validation_params?: Json | null
          validation_type?: string | null
        }
        Relationships: []
      }
      tenant_feature_flags: {
        Row: {
          active_jurisdiction_codes: string[] | null
          current_addons: Json | null
          current_billing_cycle: string | null
          current_plan_code: string | null
          effective_limit_contacts: number
          effective_limit_genius_queries_monthly: number
          effective_limit_jurisdictions_docket: number
          effective_limit_matters: number
          effective_limit_spider_alerts_monthly: number
          effective_limit_storage_gb: number
          effective_limit_users: number
          has_accounting_advanced: boolean | null
          has_accounting_basic: boolean | null
          has_analytics: boolean | null
          has_api_access: boolean | null
          has_automations: boolean | null
          has_communications: boolean | null
          has_crm: boolean | null
          has_docket: boolean | null
          has_filing: boolean | null
          has_finance_basic: boolean | null
          has_finance_full: boolean | null
          has_genius: boolean | null
          has_market: boolean | null
          has_spider: boolean | null
          has_sso: boolean | null
          id: string
          is_active: boolean | null
          is_in_trial: boolean | null
          manual_override: Json | null
          organization_id: string
          suspension_reason: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          active_jurisdiction_codes?: string[] | null
          current_addons?: Json | null
          current_billing_cycle?: string | null
          current_plan_code?: string | null
          effective_limit_contacts?: number
          effective_limit_genius_queries_monthly?: number
          effective_limit_jurisdictions_docket?: number
          effective_limit_matters?: number
          effective_limit_spider_alerts_monthly?: number
          effective_limit_storage_gb?: number
          effective_limit_users?: number
          has_accounting_advanced?: boolean | null
          has_accounting_basic?: boolean | null
          has_analytics?: boolean | null
          has_api_access?: boolean | null
          has_automations?: boolean | null
          has_communications?: boolean | null
          has_crm?: boolean | null
          has_docket?: boolean | null
          has_filing?: boolean | null
          has_finance_basic?: boolean | null
          has_finance_full?: boolean | null
          has_genius?: boolean | null
          has_market?: boolean | null
          has_spider?: boolean | null
          has_sso?: boolean | null
          id?: string
          is_active?: boolean | null
          is_in_trial?: boolean | null
          manual_override?: Json | null
          organization_id: string
          suspension_reason?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          active_jurisdiction_codes?: string[] | null
          current_addons?: Json | null
          current_billing_cycle?: string | null
          current_plan_code?: string | null
          effective_limit_contacts?: number
          effective_limit_genius_queries_monthly?: number
          effective_limit_jurisdictions_docket?: number
          effective_limit_matters?: number
          effective_limit_spider_alerts_monthly?: number
          effective_limit_storage_gb?: number
          effective_limit_users?: number
          has_accounting_advanced?: boolean | null
          has_accounting_basic?: boolean | null
          has_analytics?: boolean | null
          has_api_access?: boolean | null
          has_automations?: boolean | null
          has_communications?: boolean | null
          has_crm?: boolean | null
          has_docket?: boolean | null
          has_filing?: boolean | null
          has_finance_basic?: boolean | null
          has_finance_full?: boolean | null
          has_genius?: boolean | null
          has_market?: boolean | null
          has_spider?: boolean | null
          has_sso?: boolean | null
          id?: string
          is_active?: boolean | null
          is_in_trial?: boolean | null
          manual_override?: Json | null
          organization_id?: string
          suspension_reason?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_feature_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          sender_id: string | null
          sender_type: string | null
          ticket_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          sender_id?: string | null
          sender_type?: string | null
          ticket_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          sender_id?: string | null
          sender_type?: string | null
          ticket_id?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          activity_type: string | null
          contact_id: string | null
          created_at: string | null
          crm_account_id: string | null
          crm_deal_id: string | null
          currency: string | null
          date: string
          description: string | null
          duration_minutes: number
          end_time: string | null
          hourly_rate: number | null
          id: string
          invoice_id: string | null
          is_billable: boolean | null
          is_billed: boolean | null
          matter_id: string | null
          organization_id: string
          start_time: string | null
          tags: string[] | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          contact_id?: string | null
          created_at?: string | null
          crm_account_id?: string | null
          crm_deal_id?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          duration_minutes?: number
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          is_billed?: boolean | null
          matter_id?: string | null
          organization_id: string
          start_time?: string | null
          tags?: string[] | null
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string | null
          contact_id?: string | null
          created_at?: string | null
          crm_account_id?: string | null
          crm_deal_id?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          duration_minutes?: number
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          is_billed?: boolean | null
          matter_id?: string | null
          organization_id?: string
          start_time?: string | null
          tags?: string[] | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_crm_account_id_fkey"
            columns: ["crm_account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_crm_deal_id_fkey"
            columns: ["crm_deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trademark_searches: {
        Row: {
          classes: number[] | null
          created_at: string | null
          created_by: string | null
          id: string
          jurisdictions: string[] | null
          matter_id: string | null
          organization_id: string | null
          results: Json | null
          search_term: string | null
          search_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          classes?: number[] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jurisdictions?: string[] | null
          matter_id?: string | null
          organization_id?: string | null
          results?: Json | null
          search_term?: string | null
          search_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          classes?: number[] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jurisdictions?: string[] | null
          matter_id?: string | null
          organization_id?: string | null
          results?: Json | null
          search_term?: string | null
          search_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trademark_visuals: {
        Row: {
          ai_analysis: Json | null
          color_palette: string[] | null
          created_at: string | null
          description: string | null
          file_path: string | null
          file_size: number | null
          id: string
          is_primary: boolean | null
          matter_id: string | null
          mime_type: string | null
          organization_id: string | null
          updated_at: string | null
          vienna_codes: string[] | null
        }
        Insert: {
          ai_analysis?: Json | null
          color_palette?: string[] | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          matter_id?: string | null
          mime_type?: string | null
          organization_id?: string | null
          updated_at?: string | null
          vienna_codes?: string[] | null
        }
        Update: {
          ai_analysis?: Json | null
          color_palette?: string[] | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          matter_id?: string | null
          mime_type?: string | null
          organization_id?: string | null
          updated_at?: string | null
          vienna_codes?: string[] | null
        }
        Relationships: []
      }
      user_jurisdiction_preferences: {
        Row: {
          created_at: string | null
          id: string
          is_favorite: boolean | null
          jurisdiction_code: string | null
          sort_order: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          jurisdiction_code?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          jurisdiction_code?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string
          current_matter_id: string | null
          id: string
          last_seen_at: string | null
          organization_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_matter_id?: string | null
          id?: string
          last_seen_at?: string | null
          organization_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_matter_id?: string | null
          id?: string
          last_seen_at?: string | null
          organization_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_current_matter_id_fkey"
            columns: ["current_matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_presence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_template_preferences: {
        Row: {
          created_at: string | null
          id: string
          is_favorite: boolean | null
          last_used_at: string | null
          template_id: string | null
          use_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          template_id?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          template_id?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      vienna_categories: {
        Row: {
          category_number: number | null
          created_at: string | null
          description_en: string | null
          description_es: string | null
          division_id: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          category_number?: number | null
          created_at?: string | null
          description_en?: string | null
          description_es?: string | null
          division_id?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          category_number?: number | null
          created_at?: string | null
          description_en?: string | null
          description_es?: string | null
          division_id?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      vienna_divisions: {
        Row: {
          created_at: string | null
          description_en: string | null
          description_es: string | null
          division_number: number | null
          id: string
          is_active: boolean | null
          section_id: string | null
        }
        Insert: {
          created_at?: string | null
          description_en?: string | null
          description_es?: string | null
          division_number?: number | null
          id?: string
          is_active?: boolean | null
          section_id?: string | null
        }
        Update: {
          created_at?: string | null
          description_en?: string | null
          description_es?: string | null
          division_number?: number | null
          id?: string
          is_active?: boolean | null
          section_id?: string | null
        }
        Relationships: []
      }
      vienna_sections: {
        Row: {
          created_at: string | null
          description_en: string | null
          description_es: string | null
          id: string
          is_active: boolean | null
          section_number: number | null
        }
        Insert: {
          created_at?: string | null
          description_en?: string | null
          description_es?: string | null
          id?: string
          is_active?: boolean | null
          section_number?: number | null
        }
        Update: {
          created_at?: string | null
          description_en?: string | null
          description_es?: string | null
          id?: string
          is_active?: boolean | null
          section_number?: number | null
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          color_palette: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          filter_config: Json | null
          id: string
          image_embedding: number[] | null
          image_url: string | null
          is_active: boolean | null
          last_run_at: string | null
          matter_id: string | null
          name: string
          next_run_at: string | null
          notify_email: boolean | null
          notify_frequency: string | null
          notify_in_app: boolean | null
          notify_users: string[] | null
          organization_id: string
          owner_type: string
          run_frequency: string | null
          similarity_threshold: number | null
          type: string
          updated_at: string
          visual_threshold: number | null
          watch_classes: number[] | null
          watch_jurisdictions: string[] | null
          watch_terms: string[] | null
          watch_type: string | null
        }
        Insert: {
          color_palette?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_config?: Json | null
          id?: string
          image_embedding?: number[] | null
          image_url?: string | null
          is_active?: boolean | null
          last_run_at?: string | null
          matter_id?: string | null
          name: string
          next_run_at?: string | null
          notify_email?: boolean | null
          notify_frequency?: string | null
          notify_in_app?: boolean | null
          notify_users?: string[] | null
          organization_id: string
          owner_type?: string
          run_frequency?: string | null
          similarity_threshold?: number | null
          type?: string
          updated_at?: string
          visual_threshold?: number | null
          watch_classes?: number[] | null
          watch_jurisdictions?: string[] | null
          watch_terms?: string[] | null
          watch_type?: string | null
        }
        Update: {
          color_palette?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_config?: Json | null
          id?: string
          image_embedding?: number[] | null
          image_url?: string | null
          is_active?: boolean | null
          last_run_at?: string | null
          matter_id?: string | null
          name?: string
          next_run_at?: string | null
          notify_email?: boolean | null
          notify_frequency?: string | null
          notify_in_app?: boolean | null
          notify_users?: string[] | null
          organization_id?: string
          owner_type?: string
          run_frequency?: string | null
          similarity_threshold?: number | null
          type?: string
          updated_at?: string
          visual_threshold?: number | null
          watch_classes?: number[] | null
          watch_jurisdictions?: string[] | null
          watch_terms?: string[] | null
          watch_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_definitions: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          job_types: string[] | null
          name: string
          organization_id: string | null
          retry_on_failure: boolean | null
          timeout_seconds: number | null
          trigger_type: string | null
          updated_at: string | null
          webhook_path: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          job_types?: string[] | null
          name: string
          organization_id?: string | null
          retry_on_failure?: boolean | null
          timeout_seconds?: number | null
          trigger_type?: string | null
          updated_at?: string | null
          webhook_path?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          job_types?: string[] | null
          name?: string
          organization_id?: string | null
          retry_on_failure?: boolean | null
          timeout_seconds?: number | null
          trigger_type?: string | null
          updated_at?: string | null
          webhook_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_definitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          organization_id: string
          output_data: Json | null
          started_at: string | null
          status: string | null
          steps_completed: number | null
          steps_total: number | null
          trigger_type: string | null
          triggered_by: string | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          organization_id: string
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          steps_completed?: number | null
          steps_total?: number | null
          trigger_type?: string | null
          triggered_by?: string | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          organization_id?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          steps_completed?: number | null
          steps_total?: number | null
          trigger_type?: string | null
          triggered_by?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_spider_for_tenant: {
        Args: { p_activated_by?: string; p_org_id: string; p_plan?: string }
        Returns: string
      }
      apply_research_data: { Args: { p_queue_id: string }; Returns: Json }
      charge_call: {
        Args: {
          p_call_sid: string
          p_destination_prefix: string
          p_duration_seconds: number
          p_number_type?: string
          p_org_id: string
        }
        Returns: Json
      }
      genius_semantic_search: {
        Args: {
          p_doc_category?: string
          p_jurisdiction?: string
          p_limit?: number
          p_org_id: string
          p_query_embedding: string
        }
        Returns: {
          article_reference: string
          content: string
          id: string
          jurisdiction_code: string
          similarity: number
          source: string
          title: string
        }[]
      }
      get_max_call_duration: {
        Args: {
          p_destination_prefix: string
          p_number_type?: string
          p_org_id: string
        }
        Returns: number
      }
      get_next_invoice_number: {
        Args: { p_org_id: string; p_series?: string }
        Returns: string
      }
      get_or_create_comm_thread: {
        Args: {
          p_account_id?: string
          p_channel: string
          p_contact_id?: string
          p_created_by?: string
          p_email_thread_id?: string
          p_matter_id?: string
          p_org_id: string
          p_subject?: string
        }
        Returns: string
      }
      get_user_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_comm_counter: {
        Args: { p_channel: string; p_org_id: string }
        Returns: undefined
      }
      increment_genius_counter: {
        Args: { p_org_id: string; p_type: string }
        Returns: undefined
      }
      is_backoffice_staff: { Args: never; Returns: boolean }
      recalculate_tenant_flags: {
        Args: {
          p_addons?: Json
          p_billing_cycle?: string
          p_org_id: string
          p_plan_code: string
        }
        Returns: undefined
      }
      verify_spider_access: { Args: { p_org_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "manager" | "member" | "viewer"
      document_type_enum:
        | "application"
        | "registration"
        | "renewal"
        | "opposition"
        | "response"
        | "correspondence"
        | "invoice"
        | "contract"
        | "power_of_attorney"
        | "trademark_certificate"
        | "patent_certificate"
        | "design_certificate"
        | "other"
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
      app_role: ["super_admin", "admin", "manager", "member", "viewer"],
      document_type_enum: [
        "application",
        "registration",
        "renewal",
        "opposition",
        "response",
        "correspondence",
        "invoice",
        "contract",
        "power_of_attorney",
        "trademark_certificate",
        "patent_certificate",
        "design_certificate",
        "other",
      ],
    },
  },
} as const
