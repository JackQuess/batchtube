import { apiClient } from '../lib/apiClient';

export interface UsageResponse {
  plan: 'free' | 'pro' | 'archivist' | 'enterprise';
  cycle_reset: string;
  credits: {
    used: number;
    limit: number;
    available: number;
  };
}

export interface AccountSummary {
  plan: UsageResponse['plan'];
  subscriptionStatus?: string;
  cancelAtPeriodEnd?: boolean;
  renewalDate: string | null;
  credits: UsageResponse['credits'];
  usage: {
    month: string;
    batchesCount: number;
    itemsCount: number;
    maxPerBatch: number;
  };
}

export const accountAPI = {
  getUsage: async (): Promise<UsageResponse> => {
    return apiClient<UsageResponse>('/v1/account/usage');
  },

  getSummary: async (): Promise<AccountSummary> => {
    const usage = await apiClient<UsageResponse>('/v1/account/usage');
    return {
      plan: usage.plan,
      subscriptionStatus: usage.plan === 'free' ? 'inactive' : 'active',
      cancelAtPeriodEnd: false,
      renewalDate: usage.cycle_reset ?? null,
      credits: usage.credits,
      usage: {
        month: usage.cycle_reset ? String(usage.cycle_reset).slice(0, 7) : '-',
        batchesCount: usage.credits.used,
        itemsCount: usage.credits.used,
        maxPerBatch: usage.plan === 'free' ? 10 : 50
      }
    };
  }
};
