export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type StoreRole = 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';

type Relationship<Name extends string, Columns extends string[], Ref extends string, RefCols extends string[]> = {
  foreignKeyName: Name;
  columns: Columns;
  referencedRelation: Ref;
  referencedColumns: RefCols;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; avatar_url: string | null; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string };
        Update: { full_name?: string | null; avatar_url?: string | null; updated_at?: string };
        Relationships: [];
      };
      stores: {
        Row: { id: string; name: string; slug: string; timezone: string; currency: string; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; slug: string; timezone?: string; currency?: string; is_active?: boolean; created_at?: string; updated_at?: string };
        Update: { name?: string; slug?: string; timezone?: string; currency?: string; is_active?: boolean; updated_at?: string };
        Relationships: [];
      };
      store_memberships: {
        Row: { id: string; store_id: string; user_id: string; role: StoreRole; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; store_id: string; user_id: string; role: StoreRole; is_active?: boolean; created_at?: string; updated_at?: string };
        Update: { role?: StoreRole; is_active?: boolean; updated_at?: string };
        Relationships: [Relationship<'store_memberships_store_id_fkey', ['store_id'], 'stores', ['id']>];
      };
      store_settings: {
        Row: { id: string; store_id: string; setting_key: string; setting_value: Json; created_at: string; updated_at: string };
        Insert: { id?: string; store_id: string; setting_key: string; setting_value: Json; created_at?: string; updated_at?: string };
        Update: { setting_value?: Json; updated_at?: string };
        Relationships: [Relationship<'store_settings_store_id_fkey', ['store_id'], 'stores', ['id']>];
      };
      audit_logs: {
        Row: { id: string; store_id: string; actor_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: Json; created_at: string };
        Insert: { id?: string; store_id: string; actor_id?: string | null; action: string; entity_type: string; entity_id?: string | null; metadata?: Json; created_at?: string };
        Update: never;
        Relationships: [Relationship<'audit_logs_store_id_fkey', ['store_id'], 'stores', ['id']>];
      };
      product_categories: {
        Row: { id: string; store_id: string; name: string; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; store_id: string; name: string; is_active?: boolean; created_at?: string; updated_at?: string };
        Update: { name?: string; is_active?: boolean; updated_at?: string };
        Relationships: [Relationship<'product_categories_store_id_fkey', ['store_id'], 'stores', ['id']>];
      };
      products: {
        Row: { id: string; store_id: string; category_id: string | null; sku: string | null; name: string; description: string | null; unit: string; sale_price: number; cost_price: number | null; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; store_id: string; category_id?: string | null; sku?: string | null; name: string; description?: string | null; unit?: string; sale_price?: number; cost_price?: number | null; is_active?: boolean; created_at?: string; updated_at?: string };
        Update: { category_id?: string | null; sku?: string | null; name?: string; description?: string | null; unit?: string; sale_price?: number; cost_price?: number | null; is_active?: boolean; updated_at?: string };
        Relationships: [
          Relationship<'products_store_id_fkey', ['store_id'], 'stores', ['id']>,
          Relationship<'products_category_id_fkey', ['category_id'], 'product_categories', ['id']>,
          Relationship<'products_category_store_fkey', ['store_id', 'category_id'], 'product_categories', ['store_id', 'id']>,
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { store_role: StoreRole };
    CompositeTypes: Record<string, never>;
  };
}
