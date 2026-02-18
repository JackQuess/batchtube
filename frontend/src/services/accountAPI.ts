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
    const res = await fetch(`${API_BASE_URL}/api/account/summary`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    if (!res.ok) {
      throw new Error('failed_summary');
    }

    return res.json();
  }
};
