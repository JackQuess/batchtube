-- Add archive flow batch statuses: resolving_channel, discovering_items, queueing_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'batch_status' AND e.enumlabel = 'resolving_channel') THEN
    ALTER TYPE batch_status ADD VALUE 'resolving_channel';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'batch_status' AND e.enumlabel = 'discovering_items') THEN
    ALTER TYPE batch_status ADD VALUE 'discovering_items';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.typname = 'batch_status' AND e.enumlabel = 'queueing_items') THEN
    ALTER TYPE batch_status ADD VALUE 'queueing_items';
  END IF;
END $$;
