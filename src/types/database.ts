export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type TimestampColumns = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      companies: TableDefinition<
        TimestampColumns & {
          id: string;
          legal_name: string;
          trade_name: string;
          tax_id: string;
        },
        {
          id?: string;
          legal_name: string;
          trade_name: string;
          tax_id: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      branches: TableDefinition<
        TimestampColumns & {
          id: string;
          company_id: string;
          name: string;
          code: string;
        },
        {
          id?: string;
          company_id: string;
          name: string;
          code: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      warehouses: TableDefinition<
        TimestampColumns & {
          id: string;
          branch_id: string;
          name: string;
          code: string;
        },
        {
          id?: string;
          branch_id: string;
          name: string;
          code: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      cash_registers: TableDefinition<
        TimestampColumns & {
          id: string;
          branch_id: string;
          name: string;
          code: string;
          is_active: boolean;
        }
      >;
      user_profiles: TableDefinition<
        TimestampColumns & {
          id: string;
          email: string;
          full_name: string | null;
          status: Database["public"]["Enums"]["user_status"];
        },
        {
          id: string;
          email: string;
          full_name?: string | null;
          status?: Database["public"]["Enums"]["user_status"];
          created_at?: string;
          updated_at?: string;
        }
      >;
      permissions: TableDefinition<
        {
          id: string;
          code: string;
          description: string | null;
          created_at: string;
        },
        {
          id?: string;
          code: string;
          description?: string | null;
          created_at?: string;
        }
      >;
      roles: TableDefinition<
        TimestampColumns & {
          id: string;
          code: string;
          name: string;
          description: string | null;
          is_system: boolean;
        },
        {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      role_permissions: TableDefinition<
        {
          role_id: string;
          permission_id: string;
          created_at: string;
        },
        {
          role_id: string;
          permission_id: string;
          created_at?: string;
        },
        never
      >;
      user_roles: TableDefinition<
        {
          id: string;
          user_id: string;
          role_id: string;
          company_id: string | null;
          branch_id: string | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          role_id: string;
          company_id?: string | null;
          branch_id?: string | null;
          created_at?: string;
        }
      >;
      categories: TableDefinition<
        TimestampColumns & {
          id: string;
          company_id: string;
          parent_id: string | null;
          name: string;
          slug: string;
        },
        {
          id?: string;
          company_id: string;
          parent_id?: string | null;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      brands: TableDefinition<
        TimestampColumns & {
          id: string;
          company_id: string;
          name: string;
          slug: string;
        },
        {
          id?: string;
          company_id: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      suppliers: TableDefinition<
        TimestampColumns & {
          id: string;
          company_id: string;
          name: string;
          tax_id: string | null;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          is_active: boolean;
        },
        {
          id?: string;
          company_id: string;
          name: string;
          tax_id?: string | null;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      products: TableDefinition<
        TimestampColumns & {
          id: string;
          company_id: string;
          category_id: string | null;
          brand_id: string | null;
          supplier_id: string | null;
          sku: string;
          name: string;
          description: string | null;
          unit_of_measure: string;
          cost_price: number;
          sale_price: number;
          track_inventory: boolean;
          is_active: boolean;
        },
        {
          id?: string;
          company_id: string;
          category_id?: string | null;
          brand_id?: string | null;
          supplier_id?: string | null;
          sku: string;
          name: string;
          description?: string | null;
          unit_of_measure?: string;
          cost_price?: number;
          sale_price?: number;
          track_inventory?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      product_barcodes: TableDefinition<
        {
          id: string;
          company_id: string;
          product_id: string;
          barcode: string;
          created_at: string;
        },
        {
          id?: string;
          company_id: string;
          product_id: string;
          barcode: string;
          created_at?: string;
        }
      >;
      product_images: TableDefinition<
        {
          id: string;
          product_id: string;
          image_url: string;
          alt_text: string;
          sort_order: number;
          created_at: string;
        },
        {
          id?: string;
          product_id: string;
          image_url: string;
          alt_text: string;
          sort_order?: number;
          created_at?: string;
        }
      >;
      inventory_balances: TableDefinition<
        {
          id: string;
          warehouse_id: string;
          product_id: string;
          quantity: number;
          reserved_quantity: number;
          min_stock: number;
          max_stock: number;
          updated_at: string;
        },
        {
          id?: string;
          warehouse_id: string;
          product_id: string;
          quantity?: number;
          reserved_quantity?: number;
          min_stock?: number;
          max_stock?: number;
          updated_at?: string;
        }
      >;
      inventory_movements: TableDefinition<
        {
          id: string;
          company_id: string;
          branch_id: string;
          warehouse_id: string;
          destination_warehouse_id: string | null;
          product_id: string;
          movement_type: Database["public"]["Enums"]["inventory_movement_type"];
          quantity_delta: number;
          previous_quantity: number;
          new_quantity: number;
          reason: string;
          reference_document: string | null;
          related_movement_id: string | null;
          created_by_user_id: string | null;
          occurred_at: string;
        },
        never,
        never
      >;

      cash_shifts: TableDefinition<
        TimestampColumns & {
          id: string;
          company_id: string;
          branch_id: string;
          cash_register_id: string;
          opened_by_user_id: string;
          closed_by_user_id: string | null;
          status: Database["public"]["Enums"]["cash_shift_status"];
          opening_float: number;
          expected_cash: number;
          counted_cash: number | null;
          cash_difference: number | null;
          opened_at: string;
          closed_at: string | null;
          closing_notes: string | null;
        }
      >;
      sales: TableDefinition<
        TimestampColumns & {
          id: string;
          company_id: string;
          branch_id: string;
          warehouse_id: string;
          cash_shift_id: string;
          cashier_user_id: string;
          ticket_number: number;
          status: Database["public"]["Enums"]["sale_status"];
          subtotal: number;
          discount_total: number;
          tax_total: number;
          total: number;
          void_reason: string | null;
          voided_by_user_id: string | null;
          voided_at: string | null;
        }
      >;
      sale_lines: TableDefinition<{
        id: string;
        sale_id: string;
        product_id: string;
        sku: string;
        product_name: string;
        quantity: number;
        unit_price: number;
        discount_amount: number;
        line_total: number;
        created_at: string;
      }>;
      sale_payments: TableDefinition<{
        id: string;
        sale_id: string;
        payment_method: Database["public"]["Enums"]["payment_method_type"];
        amount: number;
        reference: string | null;
        created_at: string;
      }>;
      sale_returns: TableDefinition<{
        id: string;
        original_sale_id: string;
        company_id: string;
        branch_id: string;
        warehouse_id: string;
        cash_shift_id: string;
        returned_by_user_id: string;
        reason: string;
        total_refund: number;
        created_at: string;
      }>;
      sale_return_lines: TableDefinition<{
        id: string;
        sale_return_id: string;
        sale_line_id: string;
        product_id: string;
        quantity: number;
        refund_amount: number;
        created_at: string;
      }>;
      cash_shift_movements: TableDefinition<{
        id: string;
        cash_shift_id: string;
        movement_type: Database["public"]["Enums"]["cash_movement_type"];
        amount: number;
        reason: string;
        created_by_user_id: string;
        created_at: string;
      }>;

      customer_profiles: TableDefinition<
        TimestampColumns & { id: string; user_id: string; full_name: string; phone: string | null },
        {
          id?: string;
          user_id: string;
          full_name: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      customer_addresses: TableDefinition<
        TimestampColumns & {
          id: string;
          customer_profile_id: string;
          label: string;
          street: string;
          exterior_number: string;
          interior_number: string | null;
          neighborhood: string;
          city: string;
          state: string;
          postal_code: string;
          is_default: boolean;
        }
      >;
      customer_favorites: TableDefinition<
        { customer_profile_id: string; product_id: string; created_at: string },
        { customer_profile_id: string; product_id: string; created_at?: string }
      >;
      ecommerce_orders: TableDefinition<
        TimestampColumns & {
          id: string;
          company_id: string;
          customer_profile_id: string;
          status: Database["public"]["Enums"]["ecommerce_order_status"];
          subtotal: number;
          tax_total: number;
          total: number;
          delivery_method: string;
          mercado_pago_preference_id: string | null;
          mercado_pago_init_point: string | null;
        }
      >;
      ecommerce_order_lines: TableDefinition<{
        id: string;
        order_id: string;
        product_id: string;
        sku: string;
        product_name: string;
        quantity: number;
        unit_price: number;
        tax_amount: number;
        line_total: number;
        created_at: string;
      }>;
      ecommerce_stock_reservations: TableDefinition<{
        id: string;
        order_id: string;
        product_id: string;
        warehouse_id: string;
        quantity: number;
        expires_at: string;
        released_at: string | null;
        created_at: string;
      }>;
      ecommerce_payment_preferences: TableDefinition<
        TimestampColumns & {
          id: string;
          order_id: string;
          provider: string;
          provider_preference_id: string | null;
          init_point: string | null;
          status: Database["public"]["Enums"]["payment_preference_status"];
          error_message: string | null;
        }
      >;
      auth_rate_limits: TableDefinition<
        {
          identifier_hash: string;
          action: string;
          window_start: string;
          attempt_count: number;
          blocked_until: string | null;
          updated_at: string;
        },
        {
          identifier_hash: string;
          action: string;
          window_start?: string;
          attempt_count?: number;
          blocked_until?: string | null;
          updated_at?: string;
        }
      >;
      audit_log: TableDefinition<
        {
          id: string;
          actor_user_id: string | null;
          action: string;
          entity_table: string;
          entity_id: string | null;
          metadata: Json;
          occurred_at: string;
        },
        {
          id?: string;
          actor_user_id?: string | null;
          action: string;
          entity_table: string;
          entity_id?: string | null;
          metadata?: Json;
          occurred_at?: string;
        },
        never
      >;
    };
    Views: {
      user_role_assignments: {
        Row: {
          user_id: string | null;
          email: string | null;
          role_code: string | null;
          role_name: string | null;
          company_id: string | null;
          branch_id: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      low_inventory_alerts: {
        Row: {
          id: string | null;
          company_id: string | null;
          branch_id: string | null;
          branch_name: string | null;
          warehouse_id: string | null;
          warehouse_name: string | null;
          product_id: string | null;
          sku: string | null;
          product_name: string | null;
          quantity: number | null;
          min_stock: number | null;
          max_stock: number | null;
          shortage_quantity: number | null;
          updated_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      create_ecommerce_order: {
        Args: { p_full_name: string; p_phone: string | null; p_items: Json };
        Returns: string;
      };
      get_active_cash_shift: { Args: Record<string, never>; Returns: string | null };
      open_cash_shift: {
        Args: { p_cash_register_id: string; p_opening_float: number };
        Returns: string;
      };
      record_cash_shift_movement: {
        Args: {
          p_cash_shift_id: string;
          p_movement_type: Database["public"]["Enums"]["cash_movement_type"];
          p_amount: number;
          p_reason: string;
        };
        Returns: string;
      };
      create_pos_sale: {
        Args: {
          p_warehouse_id: string;
          p_items: Json;
          p_payments: Json;
          p_discount_total?: number;
        };
        Returns: string;
      };
      void_pos_sale: { Args: { p_sale_id: string; p_reason: string }; Returns: string };
      return_pos_sale: { Args: { p_sale_id: string; p_reason: string }; Returns: string };
      close_cash_shift: {
        Args: { p_cash_shift_id: string; p_counted_cash: number; p_closing_notes?: string | null };
        Returns: string;
      };
      consume_auth_rate_limit: {
        Args: {
          p_identifier_hash: string;
          p_rate_limit_action: "auth.sign_in" | "auth.password_reset" | "auth.password_update";
          p_max_attempts: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      current_user_has_role: {
        Args: { role_code: string };
        Returns: boolean;
      };
      current_user_has_permission: {
        Args: { permission_code: string };
        Returns: boolean;
      };
      register_inventory_movement: {
        Args: {
          p_product_id: string;
          p_warehouse_id: string;
          p_movement_type: Database["public"]["Enums"]["inventory_movement_type"];
          p_quantity_delta: number;
          p_reason: string;
          p_reference_document?: string | null;
          p_destination_warehouse_id?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      user_status: "active" | "disabled";
      inventory_movement_type:
        | "entrada"
        | "salida"
        | "ajuste"
        | "merma"
        | "devolucion"
        | "traspaso";
      cash_shift_status: "open" | "closed" | "cancelled";
      sale_status: "completed" | "voided" | "refunded";
      payment_method_type: "efectivo" | "tarjeta" | "transferencia";
      cash_movement_type: "entrada" | "salida";
      ecommerce_order_status:
        | "pending_payment"
        | "paid"
        | "preparing"
        | "ready_for_pickup"
        | "shipped"
        | "delivered"
        | "cancelled";
      payment_preference_status: "created" | "failed" | "paid" | "expired";
    };
    CompositeTypes: Record<string, never>;
  };
};
