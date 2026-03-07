-- =============================================================================
-- BatchTube API – Row Level Security (RLS) policies
-- Supabase SQL Editor'da seed_clean_public.sql çalıştırdıktan sonra bunu çalıştır.
-- auth.uid() = Supabase Auth'daki giriş yapan kullanıcı; public.users.id ile eşleşmeli.
-- =============================================================================

-- 1) RLS'i etkinleştir
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2) Policy'ler (kullanıcı sadece kendi verisine erişir)

-- users: sadece kendi satırı (okuma/güncelleme + kendi id ile kayıt)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (id = auth.uid());

-- profiles: sadece kendi satırı
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- api_keys: sadece kendi anahtarları
DROP POLICY IF EXISTS "api_keys_all_own" ON public.api_keys;
CREATE POLICY "api_keys_all_own" ON public.api_keys FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- batches: sadece kendi batch'leri
DROP POLICY IF EXISTS "batches_all_own" ON public.batches;
CREATE POLICY "batches_all_own" ON public.batches FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- batch_items: sadece kendi batch'lerine ait item'lar
DROP POLICY IF EXISTS "batch_items_all_own" ON public.batch_items;
CREATE POLICY "batch_items_all_own" ON public.batch_items FOR ALL
  USING (batch_id IN (SELECT id FROM public.batches WHERE user_id = auth.uid()))
  WITH CHECK (batch_id IN (SELECT id FROM public.batches WHERE user_id = auth.uid()));

-- files: kendi batch'leri veya user_id kendisi
DROP POLICY IF EXISTS "files_all_own" ON public.files;
CREATE POLICY "files_all_own" ON public.files FOR ALL
  USING (
    user_id = auth.uid()
    OR batch_id IN (SELECT id FROM public.batches WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR batch_id IN (SELECT id FROM public.batches WHERE user_id = auth.uid())
  );

-- usage_counters: sadece kendi kullanımı
DROP POLICY IF EXISTS "usage_counters_all_own" ON public.usage_counters;
CREATE POLICY "usage_counters_all_own" ON public.usage_counters FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- credit_ledger: sadece kendi kayıtları
DROP POLICY IF EXISTS "credit_ledger_all_own" ON public.credit_ledger;
CREATE POLICY "credit_ledger_all_own" ON public.credit_ledger FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- audit_logs: sadece kendi logları (okuma); yazma API üzerinden
DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own" ON public.audit_logs FOR SELECT USING (user_id = auth.uid());

-- Not: _prisma_migrations'a RLS eklenmez; Prisma migration okuma/yazma için erişmeli.
-- Not: Backend (Railway API) DATABASE_URL ile bağlandığında genelde postgres/service role
-- kullanır ve RLS'i bypass eder; yani API çalışmaya devam eder. Bu policy'ler özellikle
-- Supabase client (anon/authenticated) ile doğrudan tabloya erişimde devreye girer.
