-- Add default webhook URL to users for batch webhooks
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(2048) NULL;