import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../lib/auth';

interface CheckoutResponse {
  url?: string;
}

interface PortalResponse {
  url?: string;
}

const parseJson = async (res: Response): Promise<any> => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

export const subscriptionAPI = {
  createCheckout: async (_returnUrl: string): Promise<string | null> => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('session_missing');
    }

    const res = await fetch(`${API_BASE_URL}/billing/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({ plan: 'pro' })
    });

    if (!res.ok) {
      const data = await parseJson(res);
      throw new Error(data?.error || 'checkout_failed');
    }

    const data = (await parseJson(res)) as CheckoutResponse;
    return data?.url || null;
  },

  createPortal: async (returnUrl: string): Promise<string | null> => {
    void returnUrl;
    return null;
  }
};
