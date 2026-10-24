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
      get_invitation: {
        Args: { p_token: string };
        Returns: {
          business_name: string;
          email: string;
          role: string;
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
