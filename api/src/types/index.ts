import type { ApiKey, PlanTier, User } from '@prisma/client';

export interface AuthContext {
  user: User;
  apiKey: ApiKey;
  token: string;
  plan: PlanTier;
}
