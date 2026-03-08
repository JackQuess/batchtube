-- Add cache_key to files for download cache reuse (provider+sourceId+format+quality)
ALTER TABLE files ADD COLUMN IF NOT EXISTS cache_key VARCHAR(64) NULL;
CREATE INDEX IF NOT EXISTS idx_files_cache_key_expires ON files (cache_key, expires_at) WHERE cache_key IS NOT NULL;
