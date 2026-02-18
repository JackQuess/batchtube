const express = require('express');
const { requireUser } = require('../utils/auth');
const {
  ensureProfile,
  getSubscription,
  getUsageMonthly,
  monthKey
} = require('../utils/supabaseAdmin');
const {
  getPlanFromSubscription,
  getLimitProfile
} = require('../utils/planLimits');

const router = express.Router();

router.get('/account/summary', requireUser, async (req, res) => {
  try {
    const user = req.user;
    await ensureProfile(user.id, user.email);

    const [subscription, usage] = await Promise.all([
      getSubscription(user.id),
      getUsageMonthly(user.id, monthKey())
    ]);

    const plan = getPlanFromSubscription(subscription);
    const limits = getLimitProfile({ userId: user.id, plan });

    return res.json({
      plan,
      subscriptionStatus: subscription?.status || 'inactive',
      renewalDate: subscription?.current_period_end || null,
      cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
      usage: {
        month: monthKey(),
        batchesCount: Number(usage?.batches_count || 0),
        itemsCount: Number(usage?.items_count || 0),
        maxPerBatch: limits.maxItemsPerBatch
      }
    });
  } catch (error) {
    console.error('[Account] summary error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch account summary' });
  }
});

module.exports = router;
