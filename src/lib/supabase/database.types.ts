export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          actor_id: string | null;
          business_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: number;
          metadata: NonNullable<Json>;
          summary: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          business_id: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: never;
          metadata?: NonNullable<Json>;
          summary?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          business_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: never;
          metadata?: NonNullable<Json>;
          summary?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_log_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      attachments: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          expense_id: string | null;
          file_name: string | null;
          id: string;
          inspection_id: string | null;
          kind: string;
          maintenance_issue_id: string | null;
          mime_type: string;
          property_id: string | null;
          size_bytes: number;
          storage_path: string;
          task_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          expense_id?: string | null;
          file_name?: string | null;
          id?: string;
          inspection_id?: string | null;
          kind?: string;
          maintenance_issue_id?: string | null;
          mime_type: string;
          property_id?: string | null;
          size_bytes: number;
          storage_path: string;
          task_id?: string | null;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          expense_id?: string | null;
          file_name?: string | null;
          id?: string;
          inspection_id?: string | null;
          kind?: string;
          maintenance_issue_id?: string | null;
          mime_type?: string;
          property_id?: string | null;
          size_bytes?: number;
          storage_path?: string;
          task_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_business_id_expense_id_fkey";
            columns: ["business_id", "expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "attachments_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_business_id_inspection_id_fkey";
            columns: ["business_id", "inspection_id"];
            isOneToOne: false;
            referencedRelation: "inspections";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "attachments_business_id_maintenance_issue_id_fkey";
            columns: ["business_id", "maintenance_issue_id"];
            isOneToOne: false;
            referencedRelation: "maintenance_issues";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "attachments_business_id_property_id_fkey";
            columns: ["business_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "attachments_business_id_task_id_fkey";
            columns: ["business_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "attachments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          address_line: string | null;
          city: string | null;
          country_code: string;
          created_at: string;
          created_by: string | null;
          currency: string;
          email: string | null;
          id: string;
          locale: string;
          logo_path: string | null;
          name: string;
          payment_instructions: string | null;
          phone: string | null;
          postal_code: string | null;
          tax_id: string | null;
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address_line?: string | null;
          city?: string | null;
          country_code?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          email?: string | null;
          id?: string;
          locale?: string;
          logo_path?: string | null;
          name: string;
          payment_instructions?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          tax_id?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          address_line?: string | null;
          city?: string | null;
          country_code?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          email?: string | null;
          id?: string;
          locale?: string;
          logo_path?: string | null;
          name?: string;
          payment_instructions?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          tax_id?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      checklist_template_items: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          is_required: boolean;
          label: string;
          position: number;
          template_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          is_required?: boolean;
          label: string;
          position?: number;
          template_id: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          is_required?: boolean;
          label?: string;
          position?: number;
          template_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklist_template_items_business_id_template_id_fkey";
            columns: ["business_id", "template_id"];
            isOneToOne: false;
            referencedRelation: "checklist_templates";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      checklist_templates: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          kind: string;
          name: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          kind: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          kind?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_templates_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklist_templates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          amount_cents: number;
          business_id: string;
          category: string;
          created_at: string;
          created_by: string | null;
          description: string;
          id: string;
          incurred_on: string;
          maintenance_issue_id: string | null;
          notes: string | null;
          property_id: string | null;
          supplier: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          business_id: string;
          category: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          id?: string;
          incurred_on: string;
          maintenance_issue_id?: string | null;
          notes?: string | null;
          property_id?: string | null;
          supplier?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          business_id?: string;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          incurred_on?: string;
          maintenance_issue_id?: string | null;
          notes?: string | null;
          property_id?: string | null;
          supplier?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_business_id_maintenance_issue_id_fkey";
            columns: ["business_id", "maintenance_issue_id"];
            isOneToOne: false;
            referencedRelation: "maintenance_issues";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "expenses_business_id_property_id_fkey";
            columns: ["business_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      inspections: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          observations: string | null;
          result: string | null;
          task_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          observations?: string | null;
          result?: string | null;
          task_id: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          observations?: string | null;
          result?: string | null;
          task_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inspections_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inspections_business_id_task_id_fkey";
            columns: ["business_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "inspections_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          business_id: string;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          revoked_at: string | null;
          role: string;
          token: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          business_id: string;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          revoked_at?: string | null;
          role: string;
          token?: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          business_id?: string;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          revoked_at?: string | null;
          role?: string;
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey";
            columns: ["accepted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      maintenance_issues: {
        Row: {
          assignee_id: string | null;
          business_id: string;
          category: string;
          created_at: string;
          description: string | null;
          estimated_cost_cents: number | null;
          final_cost_cents: number | null;
          id: string;
          priority: string;
          property_id: string;
          reported_at: string;
          reported_by: string | null;
          resolved_at: string | null;
          source_inspection_id: string | null;
          status: string;
          stay_id: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          assignee_id?: string | null;
          business_id: string;
          category?: string;
          created_at?: string;
          description?: string | null;
          estimated_cost_cents?: number | null;
          final_cost_cents?: number | null;
          id?: string;
          priority?: string;
          property_id: string;
          reported_at?: string;
          reported_by?: string | null;
          resolved_at?: string | null;
          source_inspection_id?: string | null;
          status?: string;
          stay_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          assignee_id?: string | null;
          business_id?: string;
          category?: string;
          created_at?: string;
          description?: string | null;
          estimated_cost_cents?: number | null;
          final_cost_cents?: number | null;
          id?: string;
          priority?: string;
          property_id?: string;
          reported_at?: string;
          reported_by?: string | null;
          resolved_at?: string | null;
          source_inspection_id?: string | null;
          status?: string;
          stay_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_issues_business_id_assignee_id_fkey";
            columns: ["business_id", "assignee_id"];
            isOneToOne: false;
            referencedRelation: "memberships";
            referencedColumns: ["business_id", "user_id"];
          },
          {
            foreignKeyName: "maintenance_issues_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_issues_business_id_property_id_fkey";
            columns: ["business_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "maintenance_issues_business_id_source_inspection_id_fkey";
            columns: ["business_id", "source_inspection_id"];
            isOneToOne: false;
            referencedRelation: "inspections";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "maintenance_issues_reported_by_fkey";
            columns: ["reported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_issues_stay_fkey";
            columns: ["business_id", "stay_id"];
            isOneToOne: false;
            referencedRelation: "stays";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      memberships: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          role: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          role: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          role?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_cents: number;
          business_id: string;
          created_at: string;
          created_by: string | null;
          description: string;
          due_on: string;
          id: string;
          method: string | null;
          notes: string | null;
          paid_on: string | null;
          property_id: string;
          status: string;
          stay_id: string | null;
          stripe_payment_intent_id: string | null;
          tenant_reference: string | null;
          tenant_reported_at: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          due_on: string;
          id?: string;
          method?: string | null;
          notes?: string | null;
          paid_on?: string | null;
          property_id: string;
          status?: string;
          stay_id?: string | null;
          stripe_payment_intent_id?: string | null;
          tenant_reference?: string | null;
          tenant_reported_at?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          due_on?: string;
          id?: string;
          method?: string | null;
          notes?: string | null;
          paid_on?: string | null;
          property_id?: string;
          status?: string;
          stay_id?: string | null;
          stripe_payment_intent_id?: string | null;
          tenant_reference?: string | null;
          tenant_reported_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_business_id_property_id_fkey";
            columns: ["business_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "payments_business_id_stay_id_fkey";
            columns: ["business_id", "stay_id"];
            isOneToOne: false;
            referencedRelation: "stays";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          last_business_id: string | null;
          phone: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id: string;
          last_business_id?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          last_business_id?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_last_business_id_fkey";
            columns: ["last_business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      properties: {
        Row: {
          access_instructions: string | null;
          address_line: string;
          archived_at: string | null;
          bathrooms: number;
          bedrooms: number;
          business_id: string;
          city: string;
          created_at: string;
          created_by: string | null;
          id: string;
          internal_notes: string | null;
          max_guests: number;
          name: string;
          postal_code: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          access_instructions?: string | null;
          address_line: string;
          archived_at?: string | null;
          bathrooms?: number;
          bedrooms?: number;
          business_id: string;
          city: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          internal_notes?: string | null;
          max_guests?: number;
          name: string;
          postal_code: string;
          updated_at?: string;
        };
        Update: {
          access_instructions?: string | null;
          address_line?: string;
          archived_at?: string | null;
          bathrooms?: number;
          bedrooms?: number;
          business_id?: string;
          city?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          internal_notes?: string | null;
          max_guests?: number;
          name?: string;
          postal_code?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "properties_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      stay_bank_accounts: {
        Row: {
          account_holder_name: string | null;
          bank_name: string | null;
          bic: string | null;
          business_id: string;
          country: string | null;
          created_at: string;
          customer_id: string;
          iban: string | null;
          stay_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          account_holder_name?: string | null;
          bank_name?: string | null;
          bic?: string | null;
          business_id: string;
          country?: string | null;
          created_at?: string;
          customer_id: string;
          iban?: string | null;
          stay_id: string;
          updated_at?: string;
        };
        Update: {
          account_holder_name?: string | null;
          bank_name?: string | null;
          bic?: string | null;
          business_id?: string;
          country?: string | null;
          created_at?: string;
          customer_id?: string;
          iban?: string | null;
          stay_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stay_bank_accounts_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stay_bank_accounts_business_id_stay_id_fkey";
            columns: ["business_id", "stay_id"];
            isOneToOne: false;
            referencedRelation: "stays";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      stays: {
        Row: {
          business_id: string;
          cancelled_at: string | null;
          created_at: string;
          created_by: string | null;
          ends_on: string | null;
          guest_email: string;
          guest_name: string;
          guest_phone: string | null;
          id: string;
          invite_accepted_at: string | null;
          invite_token: string;
          notes: string | null;
          property_id: string;
          starts_on: string;
          tenant_user_id: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          cancelled_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          ends_on?: string | null;
          guest_email: string;
          guest_name: string;
          guest_phone?: string | null;
          id?: string;
          invite_accepted_at?: string | null;
          invite_token?: string;
          notes?: string | null;
          property_id: string;
          starts_on: string;
          tenant_user_id?: string | null;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          cancelled_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          ends_on?: string | null;
          guest_email?: string;
          guest_name?: string;
          guest_phone?: string | null;
          id?: string;
          invite_accepted_at?: string | null;
          invite_token?: string;
          notes?: string | null;
          property_id?: string;
          starts_on?: string;
          tenant_user_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stays_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stays_business_id_property_id_fkey";
            columns: ["business_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "stays_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stays_tenant_user_id_fkey";
            columns: ["tenant_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      stripe_accounts: {
        Row: {
          account_id: string;
          business_id: string;
          charges_enabled: boolean;
          created_at: string;
          details_submitted: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          account_id: string;
          business_id: string;
          charges_enabled?: boolean;
          created_at?: string;
          details_submitted?: boolean;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          business_id?: string;
          charges_enabled?: boolean;
          created_at?: string;
          details_submitted?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stripe_accounts_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      task_checklist_items: {
        Row: {
          business_id: string;
          checked_at: string | null;
          checked_by: string | null;
          created_at: string;
          id: string;
          is_checked: boolean;
          is_required: boolean;
          label: string;
          position: number;
          task_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          checked_at?: string | null;
          checked_by?: string | null;
          created_at?: string;
          id?: string;
          is_checked?: boolean;
          is_required?: boolean;
          label: string;
          position?: number;
          task_id: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          checked_at?: string | null;
          checked_by?: string | null;
          created_at?: string;
          id?: string;
          is_checked?: boolean;
          is_required?: boolean;
          label?: string;
          position?: number;
          task_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_checklist_items_business_id_task_id_fkey";
            columns: ["business_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "task_checklist_items_checked_by_fkey";
            columns: ["checked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          assignee_id: string | null;
          business_id: string;
          checklist_template_id: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          estimated_minutes: number | null;
          id: string;
          maintenance_issue_id: string | null;
          notes: string | null;
          priority: string;
          property_id: string;
          scheduled_at: string;
          started_at: string | null;
          status: string;
          title: string;
          type: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          assignee_id?: string | null;
          business_id: string;
          checklist_template_id?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          estimated_minutes?: number | null;
          id?: string;
          maintenance_issue_id?: string | null;
          notes?: string | null;
          priority?: string;
          property_id: string;
          scheduled_at: string;
          started_at?: string | null;
          status?: string;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          assignee_id?: string | null;
          business_id?: string;
          checklist_template_id?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          estimated_minutes?: number | null;
          id?: string;
          maintenance_issue_id?: string | null;
          notes?: string | null;
          priority?: string;
          property_id?: string;
          scheduled_at?: string;
          started_at?: string | null;
          status?: string;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_business_id_assignee_id_fkey";
            columns: ["business_id", "assignee_id"];
            isOneToOne: false;
            referencedRelation: "memberships";
            referencedColumns: ["business_id", "user_id"];
          },
          {
            foreignKeyName: "tasks_business_id_checklist_template_id_fkey";
            columns: ["business_id", "checklist_template_id"];
            isOneToOne: false;
            referencedRelation: "checklist_templates";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "tasks_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_business_id_property_id_fkey";
            columns: ["business_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "tasks_completed_by_fkey";
            columns: ["completed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_maintenance_issue_fkey";
            columns: ["business_id", "maintenance_issue_id"];
            isOneToOne: false;
            referencedRelation: "maintenance_issues";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string };
      accept_stay_invitation: { Args: { p_token: string }; Returns: string };
      create_business: { Args: { p_name: string }; Returns: string };
      dashboard_expense_series: {
        Args: { p_business_id: string; p_from: string; p_to: string };
        Returns: {
          amount_cents: number;
          day: string;
        }[];
      };
      dashboard_task_series: {
        Args: { p_business_id: string; p_from: string; p_timezone?: string; p_to: string };
        Returns: {
          completed: number;
          day: string;
          scheduled: number;
        }[];
      };
      expense_report: {
        Args: { p_business_id: string; p_from: string; p_to: string };
        Returns: {
          category: string;
          expense_count: number;
          month: string;
          property_id: string;
          total_cents: number;
        }[];
      };
      get_invitation: {
        Args: { p_token: string };
        Returns: {
          business_name: string;
          email: string;
          role: string;
          status: string;
        }[];
      };
      get_stay_invitation: {
        Args: { p_token: string };
        Returns: {
          business_name: string;
          ends_on: string;
          guest_email: string;
          property_name: string;
          starts_on: string;
          status: string;
        }[];
      };
      my_pending_invitations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          business_name: string;
          expires_at: string;
          role: string;
          token: string;
        }[];
      };
      my_pending_stay_invitations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          business_name: string;
          property_name: string;
          starts_on: string;
          token: string;
        }[];
      };
      my_stay_issues: {
        Args: Record<PropertyKey, never>;
        Returns: {
          category: string;
          issue_id: string;
          reported_at: string;
          resolved_at: string;
          status: string;
          stay_id: string;
          title: string;
        }[];
      };
      my_stay_payment_options: {
        Args: Record<PropertyKey, never>;
        Returns: {
          account_holder_name: string;
          bank_name: string;
          bic: string;
          iban: string;
          online_payments: boolean;
          stay_id: string;
        }[];
      };
      my_stay_payments: {
        Args: Record<PropertyKey, never>;
        Returns: {
          amount_cents: number;
          description: string;
          due_on: string;
          paid_on: string;
          payment_id: string;
          status: string;
          stay_id: string;
          tenant_reference: string;
          tenant_reported_at: string;
        }[];
      };
      my_stays: {
        Args: Record<PropertyKey, never>;
        Returns: {
          access_instructions: string;
          address_line: string;
          business_email: string;
          business_name: string;
          business_phone: string;
          business_timezone: string;
          city: string;
          ends_on: string;
          guest_name: string;
          payment_instructions: string;
          postal_code: string;
          property_name: string;
          starts_on: string;
          stay_id: string;
        }[];
      };
      report_stay_issue: {
        Args: { p_category: string; p_description: string; p_stay_id: string; p_title: string };
        Returns: string;
      };
      report_stay_payment: { Args: { p_payment_id: string; p_reference: string }; Returns: undefined };
      revenue_report: {
        Args: { p_business_id: string; p_from: string; p_to: string };
        Returns: {
          expense_cents: number;
          month: string;
          property_id: string;
          revenue_cents: number;
        }[];
      };
      save_checklist_template: {
        Args: { p_business_id: string; p_items: Json; p_kind: string; p_name: string; p_template_id: string };
        Returns: string;
      };
      stripe_attach_payment_intent: {
        Args: { p_payment_id: string; p_payment_intent_id: string; p_secret: string };
        Returns: undefined;
      };
      stripe_event_processed: { Args: { p_event_id: string; p_secret: string }; Returns: boolean };
      stripe_mark_payment_paid: {
        Args: {
          p_account_id: string;
          p_amount_cents: number;
          p_method: string;
          p_payment_id: string;
          p_payment_intent_id: string;
          p_secret: string;
        };
        Returns: string;
      };
      stripe_payment_context: {
        Args: { p_payment_id: string; p_secret: string };
        Returns: {
          amount_cents: number;
          business_id: string;
          description: string;
          payment_id: string;
          payment_intent_id: string;
          status: string;
          stay_id: string;
        }[];
      };
      stripe_pending_payments_for_customer: {
        Args: { p_account_id: string; p_customer_id: string; p_secret: string };
        Returns: {
          amount_cents: number;
          business_id: string;
          description: string;
          payment_id: string;
          payment_intent_id: string;
          stay_id: string;
        }[];
      };
      stripe_record_event: { Args: { p_event_id: string; p_secret: string; p_type: string }; Returns: undefined };
      stripe_save_account: { Args: { p_account_id: string; p_business_id: string; p_secret: string }; Returns: string };
      stripe_save_stay_customer: {
        Args: { p_customer_id: string; p_secret: string; p_stay_id: string };
        Returns: string;
      };
      stripe_save_stay_iban: {
        Args: {
          p_account_holder_name: string;
          p_bank_name: string;
          p_bic: string;
          p_country: string;
          p_iban: string;
          p_secret: string;
          p_stay_id: string;
        };
        Returns: undefined;
      };
      stripe_stay_context: {
        Args: { p_secret: string; p_stay_id: string };
        Returns: {
          account_id: string;
          business_id: string;
          charges_enabled: boolean;
          customer_id: string;
          guest_email: string;
          guest_name: string;
          iban: string;
          stay_id: string;
        }[];
      };
      stripe_update_account: {
        Args: { p_account_id: string; p_charges_enabled: boolean; p_details_submitted: boolean; p_secret: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
