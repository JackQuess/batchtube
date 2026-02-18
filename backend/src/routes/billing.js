const express = require('express');
const axios = require('axios');
const { requireUser } = require('../utils/auth');
const { ensureProfile, upsertSubscription, verifyPaddleSignature } = require('../utils/supabaseAdmin');

const router = express.Router();

const PADDLE_API_URL = process.env.PADDLE_API_URL || 'https://api.paddle.com';
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || '';
const PADDLE_PRICE_ID_PRO = process.env.PADDLE_PRICE_ID_PRO || '';
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || '';
const PADDLE_MANAGE_URL = process.env.PADDLE_MANAGE_URL || '';

function requireBillingConfig(res) {
  if (!PADDLE_API_KEY || !PADDLE_PRICE_ID_PRO) {
    res.status(503).json({ error: 'Billing is not configured' });
    return false;
  }
  return true;
}

router.post('/billing/checkout', requireUser, async (req, res) => {
  try {
    if (!requireBillingConfig(res)) return;

    const user = req.user;
    await ensureProfile(user.id, user.email);

    const returnUrl = req.body?.returnUrl || '/billing/success';
    const successUrl = `${process.env.APP_URL || 'https://batchtube.net'}${returnUrl}`;
    const cancelUrl = `${process.env.APP_URL || 'https://batchtube.net'}/billing/cancel`;

    const response = await axios.post(
      `${PADDLE_API_URL}/transactions`,
      {
        items: [{ price_id: PADDLE_PRICE_ID_PRO, quantity: 1 }],
        customer_email: user.email || undefined,
        custom_data: { user_id: user.id },
        checkout: {
          url: successUrl,
          success_url: successUrl,
          cancel_url: cancelUrl
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const checkoutUrl = response?.data?.data?.checkout?.url || null;
    return res.json({ url: checkoutUrl });
  } catch (error) {
    console.error('[Billing] checkout error:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Checkout creation failed' });
  }
});

router.post('/billing/portal', requireUser, async (req, res) => {
  if (PADDLE_MANAGE_URL) {
    return res.json({ url: PADDLE_MANAGE_URL });
  }

  return res.json({ url: null, message: 'Manage on Paddle' });
});

async function handleBillingWebhookRaw(req, res) {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    const signature = req.header('paddle-signature');

    const isValid = verifyPaddleSignature(rawBody, signature, PADDLE_WEBHOOK_SECRET);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(rawBody || '{}');
    const eventType = payload?.event_type || '';
    const data = payload?.data || {};
    const customUserId = data?.custom_data?.user_id || data?.metadata?.user_id || null;

    if (!customUserId) {
      return res.status(200).json({ ok: true });
    }

    if (eventType.startsWith('subscription.')) {
      await upsertSubscription({
        user_id: customUserId,
        paddle_subscription_id: data?.id || null,
        status: data?.status || 'inactive',
        plan: 'pro',
        current_period_end: data?.current_billing_period?.ends_at || null,
        cancel_at_period_end: Boolean(data?.scheduled_change?.action === 'cancel'),
        updated_at: new Date().toISOString()
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[Billing] webhook error:', error.message);
    return res.status(500).json({ error: 'Webhook handling failed' });
  }
}

module.exports = {
  billingRouter: router,
  handleBillingWebhookRaw
};
