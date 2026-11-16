export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: { Row: { id: string; name: string; slug: string; settings: Json; feature_flags: Json } };
      events: { Row: { id: string; tenant_id: string; title: string; starts_at: string; ends_at: string; status: string } };
      rsvps: { Row: { id: string; tenant_id: string; event_id: string; user_id: string; status: string; checked_in_at: string | null } };
      integrations: { Row: { id: string; tenant_id: string; provider: string; status: string; secret_ref: string | null } };
    };
    Functions: {
      analytics_summary: { Args: Record<string, never>; Returns: Json };
      networking_suggestions: { Args: { target_user: string }; Returns: Json };
      provision_tenant: { Args: { tenant_name: string; tenant_slug: string; tenant_settings: Json; tenant_flags: Json }; Returns: Json };
    };
  };
}
