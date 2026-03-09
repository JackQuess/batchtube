-- Add Lemon Squeezy billing metadata to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS lemonsqueezy_variant_id VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS lemonsqueezy_status VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS lemonsqueezy_current_period_end TIMESTAMPTZ NULL;

