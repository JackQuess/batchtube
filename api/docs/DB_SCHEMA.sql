-- See prisma/migrations/0001_init/migration.sql for executable schema.
-- This file mirrors the requested schema + audit_logs/webhook_secret extensions.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE plan_tier AS ENUM ('starter', 'power_user', 'archivist', 'enterprise');
CREATE TYPE batch_status AS ENUM ('created', 'queued', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE item_status AS ENUM ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled');
