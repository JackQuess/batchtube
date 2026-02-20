import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../lib/auth';

export interface AccountSummary {
  plan: 'free' | 'pro';
  subscriptionStatus: string;
  renewalDate: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    month: string;
    batchesCount: number;
    itemsCount: number;
    maxPerBatch: number;
  };
}

export const accountAPI = {
  getSummary: async (): Promise<AccountSummary> => {
    const res = await fetch(`${API_BASE_URL}/v1/account/usage`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    if (!res.ok) {
      throw new Error('failed_summary');
    }

    const usage = await res.json();
    return {
      plan: usage.plan === 'free' ? 'free' : 'pro',
      subscriptionStatus: usage.plan === 'free' ? 'inactive' : 'active',
      renewalDate: usage.cycle_reset ?? null,
      cancelAtPeriodEnd: false,
      usage: {
        month: usage.cycle_reset ? String(usage.cycle_reset).slice(0, 7) : '-',
        batchesCount: usage?.used?.monthly_downloads ?? 0,
        itemsCount: usage?.used?.monthly_downloads ?? 0,
        maxPerBatch: 50
      }
    };
  }
};
