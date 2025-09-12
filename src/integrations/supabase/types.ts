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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_archived: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_colors: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_archived: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_conditions: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_storages: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_archived: boolean
          size_gb: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          size_gb: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          size_gb?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          is_registered: boolean
          loan_limit: number | null
          name: string
          notes: string | null
          pending_data: Json | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_registered?: boolean
          loan_limit?: number | null
          name: string
          notes?: string | null
          pending_data?: Json | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_registered?: boolean
          loan_limit?: number | null
          name?: string
          notes?: string | null
          pending_data?: Json | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      device_models: {
        Row: {
          available_colors: string[] | null
          brand: string
          created_at: string
          id: string
          is_active: boolean
          model: string
          notes: string | null
          seed_source: string | null
          seed_version: string | null
          slug: string
          supported_storage: number[] | null
          updated_at: string
          variant: string | null
        }
        Insert: {
          available_colors?: string[] | null
          brand: string
          created_at?: string
          id?: string
          is_active?: boolean
          model: string
          notes?: string | null
          seed_source?: string | null
          seed_version?: string | null
          slug: string
          supported_storage?: number[] | null
          updated_at?: string
          variant?: string | null
        }
        Update: {
          available_colors?: string[] | null
          brand?: string
          created_at?: string
          id?: string
          is_active?: boolean
          model?: string
          notes?: string | null
          seed_source?: string | null
          seed_version?: string | null
          slug?: string
          supported_storage?: number[] | null
          updated_at?: string
          variant?: string | null
        }
        Relationships: []
      }
      devices_left_at_store: {
        Row: {
          created_at: string
          created_by: string
          id: string
          imei: string | null
          loan_id: string
          model: string | null
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          imei?: string | null
          loan_id: string
          model?: string | null
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          imei?: string | null
          loan_id?: string
          model?: string | null
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_left_at_store_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          battery_pct: number | null
          brand: string
          brand_id: string | null
          color: string | null
          color_id: string | null
          condition: string | null
          condition_id: string | null
          created_at: string
          id: string
          imei: string
          import_batch_id: string | null
          import_confidence: number | null
          is_archived: boolean
          model: string
          notes: string | null
          status: Database["public"]["Enums"]["inventory_status"]
          storage: string | null
          storage_id: string | null
          suffix: string | null
          title_original: string | null
          updated_at: string
        }
        Insert: {
          battery_pct?: number | null
          brand: string
          brand_id?: string | null
          color?: string | null
          color_id?: string | null
          condition?: string | null
          condition_id?: string | null
          created_at?: string
          id?: string
          imei: string
          import_batch_id?: string | null
          import_confidence?: number | null
          is_archived?: boolean
          model: string
          notes?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          storage?: string | null
          storage_id?: string | null
          suffix?: string | null
          title_original?: string | null
          updated_at?: string
        }
        Update: {
          battery_pct?: number | null
          brand?: string
          brand_id?: string | null
          color?: string | null
          color_id?: string | null
          condition?: string | null
          condition_id?: string | null
          created_at?: string
          id?: string
          imei?: string
          import_batch_id?: string | null
          import_confidence?: number | null
          is_archived?: boolean
          model?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          storage?: string | null
          storage_id?: string | null
          suffix?: string | null
          title_original?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "catalog_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "catalog_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_storage_id_fkey"
            columns: ["storage_id"]
            isOneToOne: false
            referencedRelation: "catalog_storages"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_audit_missing: {
        Row: {
          audit_id: string
          created_at: string
          id: string
          item_id: string
          reason: string | null
        }
        Insert: {
          audit_id: string
          created_at?: string
          id?: string
          item_id: string
          reason?: string | null
        }
        Update: {
          audit_id?: string
          created_at?: string
          id?: string
          item_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_audit_missing_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "inventory_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_audit_missing_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_audit_scans: {
        Row: {
          audit_id: string
          created_at: string
          id: string
          imei: string | null
          item_id: string | null
          raw_code: string
          scan_result: string
          serial: string | null
          timestamp: string
        }
        Insert: {
          audit_id: string
          created_at?: string
          id?: string
          imei?: string | null
          item_id?: string | null
          raw_code: string
          scan_result: string
          serial?: string | null
          timestamp?: string
        }
        Update: {
          audit_id?: string
          created_at?: string
          id?: string
          imei?: string | null
          item_id?: string | null
          raw_code?: string
          scan_result?: string
          serial?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_audit_scans_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "inventory_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_audit_scans_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_audit_tasks: {
        Row: {
          assigned_to: string | null
          audit_id: string
          created_at: string
          description: string | null
          id: string
          imei: string | null
          item_id: string | null
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          task_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          audit_id: string
          created_at?: string
          description?: string | null
          id?: string
          imei?: string | null
          item_id?: string | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          task_type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          audit_id?: string
          created_at?: string
          description?: string | null
          id?: string
          imei?: string | null
          item_id?: string | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_audit_tasks_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "inventory_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_audit_tasks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_audits: {
        Row: {
          created_at: string
          duplicate_count: number
          filters: Json | null
          finished_at: string | null
          found_count: number
          id: string
          incongruent_count: number
          location: string
          missing_count: number
          notes: string | null
          snapshot_count: number
          started_at: string
          status: string
          unexpected_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duplicate_count?: number
          filters?: Json | null
          finished_at?: string | null
          found_count?: number
          id?: string
          incongruent_count?: number
          location: string
          missing_count?: number
          notes?: string | null
          snapshot_count?: number
          started_at?: string
          status?: string
          unexpected_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duplicate_count?: number
          filters?: Json | null
          finished_at?: string | null
          found_count?: number
          id?: string
          incongruent_count?: number
          location?: string
          missing_count?: number
          notes?: string | null
          snapshot_count?: number
          started_at?: string
          status?: string
          unexpected_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      item_notes: {
        Row: {
          created_at: string
          id: string
          item_id: string
          note: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          note: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_notes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          is_archived: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          created_at: string
          customer_id: string | null
          due_at: string | null
          id: string
          issued_at: string
          item_id: string
          notes: string | null
          reason_id: string
          returned_at: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["loan_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          due_at?: string | null
          id?: string
          issued_at?: string
          item_id: string
          notes?: string | null
          reason_id: string
          returned_at?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          due_at?: string | null
          id?: string
          issued_at?: string
          item_id?: string
          notes?: string | null
          reason_id?: string
          returned_at?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_loans: {
        Row: {
          created_at: string
          created_by: string
          customer_cpf: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          item_id: string
          loan_id: string
          notes: string | null
          pending_type: Database["public"]["Enums"]["pending_loan_type"]
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_cpf?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          item_id: string
          loan_id: string
          notes?: string | null
          pending_type?: Database["public"]["Enums"]["pending_loan_type"]
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_cpf?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          item_id?: string
          loan_id?: string
          notes?: string | null
          pending_type?: Database["public"]["Enums"]["pending_loan_type"]
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_loans_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_loans_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_sales: {
        Row: {
          created_at: string
          created_by: string
          id: string
          item_id: string
          loan_id: string
          notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          sale_number: string | null
          status: Database["public"]["Enums"]["pending_sale_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          item_id: string
          loan_id: string
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sale_number?: string | null
          status?: Database["public"]["Enums"]["pending_sale_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          item_id?: string
          loan_id?: string
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sale_number?: string | null
          status?: Database["public"]["Enums"]["pending_sale_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anonymized_at: string | null
          anonymized_by: string | null
          anonymized_reason: string | null
          avatar_url: string | null
          bloqueado_ate: string | null
          can_withdraw: boolean | null
          codigo_backup: string[] | null
          created_at: string
          email: string
          full_name: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          is_active: boolean
          is_anonymized: boolean | null
          mfa_habilitado: boolean | null
          mfa_secret: string | null
          must_change_password: boolean
          observacoes: string | null
          role: Database["public"]["Enums"]["app_role"]
          senha_alterada_em: string | null
          sessao_unica_token: string | null
          telefone: string | null
          tentativas_login: number | null
          turno: string | null
          ultimo_login: string | null
          updated_at: string
        }
        Insert: {
          anonymized_at?: string | null
          anonymized_by?: string | null
          anonymized_reason?: string | null
          avatar_url?: string | null
          bloqueado_ate?: string | null
          can_withdraw?: boolean | null
          codigo_backup?: string[] | null
          created_at?: string
          email: string
          full_name?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id: string
          is_active?: boolean
          is_anonymized?: boolean | null
          mfa_habilitado?: boolean | null
          mfa_secret?: string | null
          must_change_password?: boolean
          observacoes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          senha_alterada_em?: string | null
          sessao_unica_token?: string | null
          telefone?: string | null
          tentativas_login?: number | null
          turno?: string | null
          ultimo_login?: string | null
          updated_at?: string
        }
        Update: {
          anonymized_at?: string | null
          anonymized_by?: string | null
          anonymized_reason?: string | null
          avatar_url?: string | null
          bloqueado_ate?: string | null
          can_withdraw?: boolean | null
          codigo_backup?: string[] | null
          created_at?: string
          email?: string
          full_name?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          is_active?: boolean
          is_anonymized?: boolean | null
          mfa_habilitado?: boolean | null
          mfa_secret?: string | null
          must_change_password?: boolean
          observacoes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          senha_alterada_em?: string | null
          sessao_unica_token?: string | null
          telefone?: string | null
          tentativas_login?: number | null
          turno?: string | null
          ultimo_login?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reasons: {
        Row: {
          auto_approve: boolean | null
          category: Database["public"]["Enums"]["reason_category"] | null
          created_at: string
          description: string | null
          estimated_duration_hours: number | null
          id: string
          is_active: boolean
          name: string
          priority: Database["public"]["Enums"]["reason_priority"] | null
          requires_customer: boolean
          requires_seller: boolean
        }
        Insert: {
          auto_approve?: boolean | null
          category?: Database["public"]["Enums"]["reason_category"] | null
          created_at?: string
          description?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean
          name: string
          priority?: Database["public"]["Enums"]["reason_priority"] | null
          requires_customer?: boolean
          requires_seller?: boolean
        }
        Update: {
          auto_approve?: boolean | null
          category?: Database["public"]["Enums"]["reason_category"] | null
          created_at?: string
          description?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: Database["public"]["Enums"]["reason_priority"] | null
          requires_customer?: boolean
          requires_seller?: boolean
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["permission"]
          role: Database["public"]["Enums"]["granular_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["permission"]
          role: Database["public"]["Enums"]["granular_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["permission"]
          role?: Database["public"]["Enums"]["granular_role"]
        }
        Relationships: []
      }
      sellers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          notes: string | null
          role: Database["public"]["Enums"]["granular_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          role: Database["public"]["Enums"]["granular_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          role?: Database["public"]["Enums"]["granular_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_user: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      bootstrap_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_account_security_status: {
        Args: { user_email: string }
        Returns: Json
      }
      check_device_links: {
        Args: { device_id: string }
        Returns: boolean
      }
      check_password_leaked_status: {
        Args: { password_hash: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          identifier: string
          max_requests?: number
          window_minutes?: number
        }
        Returns: Json
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_audit_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      current_user_has_permission: {
        Args: { required_permission: Database["public"]["Enums"]["permission"] }
        Returns: boolean
      }
      ensure_profile_exists: {
        Args: { user_id: string }
        Returns: undefined
      }
      get_audit_performance_metrics: {
        Args: { audit_id: string }
        Returns: Json
      }
      get_customer_data_safe: {
        Args: { customer_id: string }
        Returns: Json
      }
      get_customer_safe: {
        Args: { customer_id: string }
        Returns: Json
      }
      get_security_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_seller_safe: {
        Args: { seller_id: string }
        Returns: Json
      }
      get_system_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_permissions: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["permission"][]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_working_hours: {
        Args: { user_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: undefined
      }
      log_password_security_event: {
        Args: { p_details?: Json; p_event_type: string; p_user_id: string }
        Returns: undefined
      }
      log_sensitive_access: {
        Args: {
          accessed_fields: string[]
          record_id: string
          table_name: string
        }
        Returns: undefined
      }
      migrate_existing_roles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      secure_get_system_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      user_has_permission: {
        Args: {
          required_permission: Database["public"]["Enums"]["permission"]
          user_id: string
        }
        Returns: boolean
      }
      validate_imei: {
        Args: { imei_code: string }
        Returns: boolean
      }
      validate_password_security: {
        Args: { password_text: string }
        Returns: Json
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user" | "auditor"
      granular_role:
        | "admin"
        | "manager"
        | "supervisor"
        | "operator"
        | "auditor"
        | "viewer"
      inventory_status: "available" | "loaned" | "sold" | "maintenance"
      loan_status: "active" | "returned" | "overdue"
      pending_loan_type:
        | "incomplete_customer_data"
        | "missing_cpf"
        | "missing_contact"
        | "missing_device_left_info"
        | "incomplete_customer_contact"
      pending_sale_status: "pending" | "resolved"
      permission:
        | "inventory.view"
        | "inventory.create"
        | "inventory.update"
        | "inventory.delete"
        | "inventory.bulk_operations"
        | "movements.view"
        | "movements.create"
        | "movements.approve"
        | "movements.cancel"
        | "users.view"
        | "users.create"
        | "users.update"
        | "users.delete"
        | "users.manage_roles"
        | "audit.view"
        | "audit.export"
        | "system.config"
        | "system.backup"
        | "system.features"
      reason_category:
        | "maintenance"
        | "loan"
        | "sale"
        | "warranty"
        | "demonstration"
        | "internal_use"
        | "transfer"
        | "return"
        | "disposal"
      reason_priority: "low" | "medium" | "high" | "urgent"
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
      app_role: ["admin", "manager", "user", "auditor"],
      granular_role: [
        "admin",
        "manager",
        "supervisor",
        "operator",
        "auditor",
        "viewer",
      ],
      inventory_status: ["available", "loaned", "sold", "maintenance"],
      loan_status: ["active", "returned", "overdue"],
      pending_loan_type: [
        "incomplete_customer_data",
        "missing_cpf",
        "missing_contact",
        "missing_device_left_info",
        "incomplete_customer_contact",
      ],
      pending_sale_status: ["pending", "resolved"],
      permission: [
        "inventory.view",
        "inventory.create",
        "inventory.update",
        "inventory.delete",
        "inventory.bulk_operations",
        "movements.view",
        "movements.create",
        "movements.approve",
        "movements.cancel",
        "users.view",
        "users.create",
        "users.update",
        "users.delete",
        "users.manage_roles",
        "audit.view",
        "audit.export",
        "system.config",
        "system.backup",
        "system.features",
      ],
      reason_category: [
        "maintenance",
        "loan",
        "sale",
        "warranty",
        "demonstration",
        "internal_use",
        "transfer",
        "return",
        "disposal",
      ],
      reason_priority: ["low", "medium", "high", "urgent"],
    },
  },
} as const
