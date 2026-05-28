export type SubscriptionStatus = 'active' | 'suspended' | 'past_due' | 'canceled';

export type Store = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  domain: string | null;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type UserStoreRole = 'super_admin' | 'store_owner' | 'employee' | 'customer';
