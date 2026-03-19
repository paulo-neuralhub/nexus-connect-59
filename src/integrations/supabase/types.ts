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
      ai_providers: {
        Row: {
          api_key_encrypted: string | null
          base_url: string | null
          circuit_open: boolean | null
          code: string
          config: Json | null
          consecutive_failures: number | null
          created_at: string
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
        }
        Insert: {
          api_key_encrypted?: string | null
          base_url?: string | null
          circuit_open?: boolean | null
          code: string
          config?: Json | null
          consecutive_failures?: number | null
          created_at?: string
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
        }
        Update: {
          api_key_encrypted?: string | null
          base_url?: string | null
          circuit_open?: boolean | null
          code?: string
          config?: Json | null
          consecutive_failures?: number | null
          created_at?: string
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
      crm_deals: {
        Row: {
          account_id: string | null
          actual_close_date: string | null
          amount: number | null
          close_reason: string | null
          contact_id: string | null
          created_at: string
          expected_close_date: string | null
          id: string
          lost_to_competitor: string | null
          name: string
          opportunity_type: string | null
          organization_id: string
          owner_id: string | null
          stage: string
          stage_entered_at: string | null
          stage_history: Json | null
          updated_at: string
          weighted_amount: number | null
        }
        Insert: {
          account_id?: string | null
          actual_close_date?: string | null
          amount?: number | null
          close_reason?: string | null
          contact_id?: string | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          lost_to_competitor?: string | null
          name: string
          opportunity_type?: string | null
          organization_id: string
          owner_id?: string | null
          stage?: string
          stage_entered_at?: string | null
          stage_history?: Json | null
          updated_at?: string
          weighted_amount?: number | null
        }
        Update: {
          account_id?: string | null
          actual_close_date?: string | null
          amount?: number | null
          close_reason?: string | null
          contact_id?: string | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          lost_to_competitor?: string | null
          name?: string
          opportunity_type?: string | null
          organization_id?: string
          owner_id?: string | null
          stage?: string
          stage_entered_at?: string | null
          stage_history?: Json | null
          updated_at?: string
          weighted_amount?: number | null
        }
        Relationships: [
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
        ]
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
          currency: string | null
          discount_amount: number | null
          due_date: string | null
          facturae_certificate_id: string | null
          facturae_signed: boolean | null
          facturae_xml: string | null
          footer_text: string | null
          id: string
          internal_notes: string | null
          invoice_date: string
          invoice_number: string
          invoice_series: string | null
          invoice_type: string | null
          notes: string | null
          organization_id: string
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          payment_method_code: string | null
          payment_reference: string | null
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          sent_at: string | null
          sent_to_email: string | null
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
          currency?: string | null
          discount_amount?: number | null
          due_date?: string | null
          facturae_certificate_id?: string | null
          facturae_signed?: boolean | null
          facturae_xml?: string | null
          footer_text?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number: string
          invoice_series?: string | null
          invoice_type?: string | null
          notes?: string | null
          organization_id: string
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_method_code?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          sent_at?: string | null
          sent_to_email?: string | null
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
          currency?: string | null
          discount_amount?: number | null
          due_date?: string | null
          facturae_certificate_id?: string | null
          facturae_signed?: boolean | null
          facturae_xml?: string | null
          footer_text?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number?: string
          invoice_series?: string | null
          invoice_type?: string | null
          notes?: string | null
          organization_id?: string
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_method_code?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          sent_at?: string | null
          sent_to_email?: string | null
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
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ipo_offices: {
        Row: {
          api_config: Json | null
          api_url: string | null
          avg_response_time_ms: number | null
          code: string
          country_code: string | null
          country_name: string | null
          created_at: string
          credentials_encrypted: string | null
          data_source_type: string | null
          flag_emoji: string | null
          id: string
          is_active: boolean | null
          last_health_check: string | null
          name_official: string
          name_short: string | null
          notes: string | null
          office_type: string | null
          operational_status: string | null
          region: string | null
          supported_ip_types: string[] | null
          tier: string | null
          updated_at: string
        }
        Insert: {
          api_config?: Json | null
          api_url?: string | null
          avg_response_time_ms?: number | null
          code: string
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          credentials_encrypted?: string | null
          data_source_type?: string | null
          flag_emoji?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          name_official: string
          name_short?: string | null
          notes?: string | null
          office_type?: string | null
          operational_status?: string | null
          region?: string | null
          supported_ip_types?: string[] | null
          tier?: string | null
          updated_at?: string
        }
        Update: {
          api_config?: Json | null
          api_url?: string | null
          avg_response_time_ms?: number | null
          code?: string
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          credentials_encrypted?: string | null
          data_source_type?: string | null
          flag_emoji?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          name_official?: string
          name_short?: string | null
          notes?: string | null
          office_type?: string | null
          operational_status?: string | null
          region?: string | null
          supported_ip_types?: string[] | null
          tier?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "manager" | "member" | "viewer"
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
    },
  },
} as const
