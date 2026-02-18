-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enums
CREATE TYPE plan_tier AS ENUM ('starter', 'power_user', 'archivist', 'enterprise');
CREATE TYPE batch_status AS ENUM ('created', 'queued', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE item_status AS ENUM ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled');

-- 2. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan plan_tier DEFAULT 'starter',
    stripe_customer_id VARCHAR(255),
    webhook_secret VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_prefix VARCHAR(10) NOT NULL,
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(50),
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Batches
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    status batch_status DEFAULT 'created',
    options JSONB DEFAULT '{}',
    callback_url VARCHAR(2048),
    zip_file_path VARCHAR(1024),
    item_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_batches_user ON batches(user_id);
CREATE INDEX idx_batches_status ON batches(status);

-- 5. Batch Items
CREATE TABLE batch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    original_url TEXT NOT NULL,
    provider VARCHAR(50),
    status item_status DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_items_batch ON batch_items(batch_id);

-- 6. Files
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES batch_items(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    storage_path VARCHAR(1024) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_files_user ON files(user_id);

-- 7. Usage Counters
CREATE TABLE usage_counters (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    bandwidth_bytes BIGINT DEFAULT 0,
    items_processed INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, period_start)
);

-- 8. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
