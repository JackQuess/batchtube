import { apiClient, ApiError } from '../lib/apiClient';

interface CheckoutResponse {
  url?: string;
}

export const subscriptionAPI = {
  createCheckout: async (): Promise<string | null> => {
    const data = await apiClient<CheckoutResponse>('/billing/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro' })
    });
    return data?.url || null;
  },

  createPortal: async (): Promise<string | null> => {
    throw new ApiError(501, 'not_implemented', 'Portal henüz aktif değil.');
  }
};
