export interface ApiError {
  error: {
    code: string;
    message: string;
    request_id: string;
    details: Record<string, unknown>;
  };
}

export interface UserRow {
  id: string;
  email: string;
  plan: 'starter' | 'power_user' | 'archivist' | 'enterprise';
  disabled: boolean;
  created_at: string;
  last_used_at: string | null;
  month_items_processed: number;
  month_bandwidth_bytes: number;
}
