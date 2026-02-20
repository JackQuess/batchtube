ALTER TABLE usage_counters
  ADD COLUMN IF NOT EXISTS credits_used INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason VARCHAR(80) NOT NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_created
  ON credit_ledger(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_batch
  ON credit_ledger(batch_id);
