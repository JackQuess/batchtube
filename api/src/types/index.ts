import type { ApiKey, User } from '@prisma/client';
import type { SaaSPlan } from '../services/plans.js';

export interface AuthContext {
  user: User;
  apiKey?: ApiKey;
  tokenType: 'supabase_jwt' | 'api_key';
  plan: SaaSPlan;
  /** True if JWT has app_metadata.role admin/owner or service_role (no plan limits). */
  isAdmin?: boolean;
}

export interface AdminSession {
  email: string;
}
