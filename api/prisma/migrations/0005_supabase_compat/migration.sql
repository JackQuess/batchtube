CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_tier') THEN
    CREATE TYPE plan_tier AS ENUM ('starter', 'power_user', 'archivist', 'enterprise');
  ELSE
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'plan_tier' AND e.enumlabel = 'starter') THEN
      ALTER TYPE plan_tier ADD VALUE 'starter';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'plan_tier' AND e.enumlabel = 'power_user') THEN
      ALTER TYPE plan_tier ADD VALUE 'power_user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'plan_tier' AND e.enumlabel = 'archivist') THEN
      ALTER TYPE plan_tier ADD VALUE 'archivist';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'plan_tier' AND e.enumlabel = 'enterprise') THEN
      ALTER TYPE plan_tier ADD VALUE 'enterprise';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_plan') THEN
    CREATE TYPE profile_plan AS ENUM ('free', 'pro', 'archivist', 'enterprise');
  ELSE
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'profile_plan' AND e.enumlabel = 'free') THEN
      ALTER TYPE profile_plan ADD VALUE 'free';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'profile_plan' AND e.enumlabel = 'pro') THEN
      ALTER TYPE profile_plan ADD VALUE 'pro';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'profile_plan' AND e.enumlabel = 'archivist') THEN
      ALTER TYPE profile_plan ADD VALUE 'archivist';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'profile_plan' AND e.enumlabel = 'enterprise') THEN
      ALTER TYPE profile_plan ADD VALUE 'enterprise';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'batch_status') THEN
    CREATE TYPE batch_status AS ENUM ('created', 'queued', 'processing', 'completed', 'failed', 'cancelled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status') THEN
    CREATE TYPE item_status AS ENUM ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT '__supabase_jwt_auth__',
  plan plan_tier NOT NULL DEFAULT 'starter',
  disabled BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id VARCHAR(255),
  webhook_secret VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  plan profile_plan NOT NULL DEFAULT 'free',
  paddle_customer_id TEXT,
  paddle_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key_prefix VARCHAR(10) NOT NULL DEFAULT 'bt_live_',
  key_hash VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(50),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  status batch_status NOT NULL DEFAULT 'created',
  options JSONB NOT NULL DEFAULT '{}',
  callback_url VARCHAR(2048),
  zip_file_path VARCHAR(1024),
  item_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.batch_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  original_url TEXT NOT NULL,
  provider VARCHAR(50),
  status item_status NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES public.batch_items(id) ON DELETE SET NULL,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  storage_path VARCHAR(1024) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usage_counters (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  bandwidth_bytes BIGINT NOT NULL DEFAULT 0,
  batches_processed INT NOT NULL DEFAULT 0,
  credits_used INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period_start)
);

ALTER TABLE public.usage_counters
  ADD COLUMN IF NOT EXISTS bandwidth_bytes BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.usage_counters
  ADD COLUMN IF NOT EXISTS batches_processed INT NOT NULL DEFAULT 0;

ALTER TABLE public.usage_counters
  ADD COLUMN IF NOT EXISTS credits_used INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason VARCHAR(80) NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  action VARCHAR(50) NOT NULL,
  resource_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_batches_user ON public.batches(user_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.batches(status);
CREATE INDEX IF NOT EXISTS idx_items_batch ON public.batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_files_user ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_counters_period_start ON public.usage_counters(period_start);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_created ON public.credit_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_batch ON public.credit_ledger(batch_id);
