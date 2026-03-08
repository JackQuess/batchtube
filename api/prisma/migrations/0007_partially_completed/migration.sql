-- Add partially_completed batch status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'batch_status' AND e.enumlabel = 'partially_completed') THEN
    ALTER TYPE batch_status ADD VALUE 'partially_completed';
  END IF;
END $$;
