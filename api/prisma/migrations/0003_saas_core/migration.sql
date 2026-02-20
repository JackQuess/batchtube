DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_plan') THEN
    CREATE TYPE profile_plan AS ENUM ('free', 'pro', 'archivist', 'enterprise');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan profile_plan NOT NULL DEFAULT 'free',
  paddle_customer_id TEXT,
  paddle_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_counters (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  batches_processed INT DEFAULT 0,
  bandwidth_bytes BIGINT DEFAULT 0,
  PRIMARY KEY (user_id, period_start)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash VARCHAR(64) UNIQUE NOT NULL,
  key_prefix VARCHAR(10) NOT NULL DEFAULT 'bt_live_',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  name VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_counters_period_start ON usage_counters(period_start);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

