import type { ApiKey, User } from '@prisma/client';
import type { SaaSPlan } from '../services/plans.js';

export interface AuthContext {
  user: User;
  apiKey?: ApiKey;
  tokenType: 'supabase_jwt' | 'api_key';
  plan: SaaSPlan;
}

export interface AdminSession {
  email: string;
}
