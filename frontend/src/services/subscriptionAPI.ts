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
  createCheckout: async (returnUrl: string): Promise<string | null> => {
    const res = await fetch(`${API_BASE_URL}/api/subscription/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ returnUrl })
    });

    if (!res.ok) {
      const data = await parseJson(res);
      throw new Error(data?.error || 'checkout_failed');
    }

    const data = (await parseJson(res)) as CheckoutResponse;
    return data?.url || null;
  },

  createPortal: async (returnUrl: string): Promise<string | null> => {
    const res = await fetch(`${API_BASE_URL}/api/subscription/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ returnUrl })
    });

    if (!res.ok) {
      const data = await parseJson(res);
      throw new Error(data?.error || 'portal_failed');
    }

    const data = (await parseJson(res)) as PortalResponse;
    return data?.url || null;
  }
};
