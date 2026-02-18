const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseRequest(path, init = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('supabase_not_configured');
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `supabase_error_${res.status}`);
  }

  const data = await res.json().catch(() => null);
  return data;
}

function monthKey() {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return month;
}

async function ensureProfile(userId, email) {
  if (!isSupabaseConfigured() || !userId) return;

  await supabaseRequest('profiles', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([
      {
        id: userId,
        email: email || null
      }
    ])
  });
}

async function getSubscription(userId) {
  if (!isSupabaseConfigured() || !userId) return null;

  const rows = await supabaseRequest(`subscriptions?user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc.nullslast&limit=1`);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function getUsageMonthly(userId, month = monthKey()) {
  if (!isSupabaseConfigured() || !userId) return null;

  const rows = await supabaseRequest(`usage_monthly?user_id=eq.${encodeURIComponent(userId)}&month=eq.${encodeURIComponent(month)}&limit=1`);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function incrementUsage(userId, itemsDelta = 0) {
  if (!isSupabaseConfigured() || !userId) return null;

  const month = monthKey();
  const existing = await getUsageMonthly(userId, month);

  const next = {
    user_id: userId,
    month,
    batches_count: (existing?.batches_count || 0) + 1,
    items_count: (existing?.items_count || 0) + itemsDelta
  };

  await supabaseRequest('usage_monthly', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([next])
  });

  return next;
}

async function upsertSubscription(data) {
  if (!isSupabaseConfigured()) return;

  await supabaseRequest('subscriptions', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([data])
  });
}

function verifyPaddleSignature(rawBody, signatureHeader, secret) {
  if (!secret) return true;
  if (!signatureHeader || !rawBody) return false;

  const parts = String(signatureHeader).split(';').reduce((acc, pair) => {
    const [k, v] = pair.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const payload = `${ts}:${rawBody}`;
  const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const sigA = Buffer.from(digest, 'hex');
  const sigB = Buffer.from(h1, 'hex');

  if (sigA.length !== sigB.length) return false;
  return crypto.timingSafeEqual(sigA, sigB);
}

module.exports = {
  isSupabaseConfigured,
  monthKey,
  ensureProfile,
  getSubscription,
  getUsageMonthly,
  incrementUsage,
  upsertSubscription,
  verifyPaddleSignature
};
