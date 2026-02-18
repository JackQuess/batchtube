const { getProviderForUrl } = require('../providers');

const FREE_PROVIDER_IDS = new Set(['youtube', 'tiktok', 'instagram', 'generic']);

const LIMITS = {
  anonymous: {
    maxItemsPerBatch: 3,
    monthlyBatches: 5,
    monthlyItems: 25
  },
  free: {
    maxItemsPerBatch: 3,
    monthlyBatches: 40,
    monthlyItems: 200
  },
  pro: {
    maxItemsPerBatch: 50,
    monthlyBatches: 1000,
    monthlyItems: 5000
  }
};

function getPlanFromSubscription(subscription) {
  if (!subscription) return 'free';
  const status = String(subscription.status || '').toLowerCase();
  const plan = String(subscription.plan || 'free').toLowerCase();

  if (plan === 'pro' && ['active', 'trialing', 'past_due'].includes(status)) {
    return 'pro';
  }

  return 'free';
}

function getLimitProfile({ userId, plan }) {
  if (!userId) return LIMITS.anonymous;
  return plan === 'pro' ? LIMITS.pro : LIMITS.free;
}

function checkProviderAccess(items, plan) {
  if (plan === 'pro') return null;

  for (const item of items) {
    const provider = getProviderForUrl(item.url || '');
    if (!FREE_PROVIDER_IDS.has(provider.id)) {
      return {
        code: 'PROVIDER_RESTRICTED',
        provider: provider.id
      };
    }
  }

  return null;
}

function checkBatchLimits({ userId, plan, itemsCount, usage }) {
  const limits = getLimitProfile({ userId, plan });

  if (itemsCount > limits.maxItemsPerBatch) {
    return {
      code: 'LIMIT_MAX_ITEMS',
      limit: limits.maxItemsPerBatch
    };
  }

  if (!userId) return null;

  if (usage && usage.batchesCount + 1 > limits.monthlyBatches) {
    return {
      code: 'USAGE_LIMIT_REACHED',
      kind: 'batches',
      limit: limits.monthlyBatches
    };
  }

  if (usage && usage.itemsCount + itemsCount > limits.monthlyItems) {
    return {
      code: 'USAGE_LIMIT_REACHED',
      kind: 'items',
      limit: limits.monthlyItems
    };
  }

  return null;
}

module.exports = {
  LIMITS,
  FREE_PROVIDER_IDS,
  getPlanFromSubscription,
  getLimitProfile,
  checkProviderAccess,
  checkBatchLimits
};
