-- =============================================================================
-- BatchTube API – Tek seferde sıfırdan kurulum (public şema)
-- Supabase SQL Editor'a yapıştır, Run. auth şemasına dokunmaz.
-- =============================================================================

-- 1) Tabloları sil (FK sırasına göre)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.credit_ledger CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.batch_items CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.usage_counters CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2) Enum tiplerini sil
DROP TYPE IF EXISTS public.item_status CASCADE;
DROP TYPE IF EXISTS public.batch_status CASCADE;
DROP TYPE IF EXISTS public.profile_plan CASCADE;
DROP TYPE IF EXISTS public.plan_tier CASCADE;

-- 3) Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 4) Enum'ları oluştur
CREATE TYPE public.plan_tier AS ENUM ('starter', 'power_user', 'archivist', 'enterprise');
CREATE TYPE public.profile_plan AS ENUM ('free', 'pro', 'archivist', 'enterprise');
CREATE TYPE public.batch_status AS ENUM ('created', 'queued', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE public.item_status AS ENUM ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled');

-- 5) Tabloları oluştur
CREATE TABLE public.users (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email              VARCHAR(255) UNIQUE NOT NULL,
  password_hash      VARCHAR(255) NOT NULL,
  plan               public.plan_tier NOT NULL DEFAULT 'starter',
  disabled           BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id VARCHAR(255),
  webhook_secret     VARCHAR(64),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.profiles (
  id                     UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  plan                   public.profile_plan NOT NULL DEFAULT 'free',
  paddle_customer_id     TEXT,
  paddle_subscription_id TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.api_keys (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key_prefix   VARCHAR(10) NOT NULL,
  key_hash     VARCHAR(64) UNIQUE NOT NULL,
  name         VARCHAR(50),
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.batches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name          VARCHAR(255),
  status        public.batch_status NOT NULL DEFAULT 'created',
  options       JSONB NOT NULL DEFAULT '{}',
  callback_url  VARCHAR(2048),
  zip_file_path VARCHAR(1024),
  item_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE TABLE public.batch_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id      UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.users(id),
  original_url  TEXT NOT NULL,
  provider      VARCHAR(50),
  status        public.item_status NOT NULL DEFAULT 'pending',
  progress      INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  retry_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.files (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id         UUID REFERENCES public.batch_items(id) ON DELETE SET NULL,
  batch_id        UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id),
  storage_path    VARCHAR(1024) NOT NULL,
  filename        VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type       VARCHAR(100),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.usage_counters (
  user_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_start       DATE NOT NULL,
  bandwidth_bytes    BIGINT NOT NULL DEFAULT 0,
  batches_processed  INTEGER NOT NULL DEFAULT 0,
  credits_used       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period_start)
);

CREATE TABLE public.credit_ledger (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  reason     VARCHAR(80) NOT NULL,
  batch_id   UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id),
  action      VARCHAR(50) NOT NULL,
  resource_id UUID,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6) İndeksler
CREATE INDEX idx_users_plan ON public.users(plan);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_batches_user ON public.batches(user_id);
CREATE INDEX idx_batches_status ON public.batches(status);
CREATE INDEX idx_items_batch ON public.batch_items(batch_id);
CREATE INDEX idx_files_user ON public.files(user_id);
CREATE INDEX idx_usage_counters_period_start ON public.usage_counters(period_start);
CREATE INDEX idx_profiles_plan ON public.profiles(plan);
CREATE INDEX idx_credit_ledger_user_created ON public.credit_ledger(user_id, created_at DESC);
CREATE INDEX idx_credit_ledger_batch ON public.credit_ledger(batch_id);

-- Bitti. Prisma migration geçmişini senkron etmek için yerelde:
-- npx prisma migrate resolve --applied "0001_init"
-- npx prisma migrate resolve --applied "0002_admin_user_disabled"
-- npx prisma migrate resolve --applied "0003_saas_core"
-- npx prisma migrate resolve --applied "0004_token_credits"
-- npx prisma migrate resolve --applied "0005_supabase_compat"
