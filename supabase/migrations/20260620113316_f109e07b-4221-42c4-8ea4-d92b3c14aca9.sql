
-- 1) Add resolved_at column
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Backfill so existing resolved/dismissed reports get cleaned up on schedule
UPDATE public.reports
   SET resolved_at = created_at
 WHERE resolved_at IS NULL
   AND status IN ('resolved','dismissed');

-- 2) Trigger to maintain resolved_at automatically
CREATE OR REPLACE FUNCTION public.set_report_resolved_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('resolved','dismissed') THEN
    IF OLD.status IS DISTINCT FROM NEW.status OR NEW.resolved_at IS NULL THEN
      NEW.resolved_at := now();
    END IF;
  ELSE
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reports_resolved_at ON public.reports;
CREATE TRIGGER trg_reports_resolved_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.set_report_resolved_at();

-- 3) Cleanup function + daily cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.cleanup_old_reports()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.reports
   WHERE status IN ('resolved','dismissed')
     AND resolved_at IS NOT NULL
     AND resolved_at < now() - interval '7 days';
$$;

-- Remove any previous schedule with the same name, then (re)create it
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-old-reports-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-old-reports-daily',
  '0 3 * * *',
  $$ SELECT public.cleanup_old_reports(); $$
);
