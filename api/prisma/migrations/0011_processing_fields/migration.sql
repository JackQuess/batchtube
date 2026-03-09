-- Add processing enums and fields for media processing pipeline
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processing_mode') THEN
    CREATE TYPE processing_mode AS ENUM (
      'none',
      'upscale_4k',
      'resolution_convert',
      'audio_extract',
      'compress',
      'format_convert'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processing_status') THEN
    CREATE TYPE processing_status AS ENUM (
      'pending',
      'queued',
      'processing',
      'completed',
      'failed'
    );
  END IF;
END $$;

ALTER TABLE batch_items
  ADD COLUMN IF NOT EXISTS processing_mode processing_mode NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS processing_status processing_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_error text NULL,
  ADD COLUMN IF NOT EXISTS processing_output_file_id uuid NULL,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz NULL;

