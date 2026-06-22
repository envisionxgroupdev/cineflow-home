
-- Expand reports into tickets
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS unread_for_admin boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS unread_for_user boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Drop existing report policies, recreate for ticket model
DO $$ DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='reports' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.reports', p.policyname);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

CREATE POLICY "Users view own tickets" ON public.reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own tickets" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own ticket unread flag" ON public.reports
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete tickets" ON public.reports
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Ticket messages
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read messages of own ticket or admin" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.reports r WHERE r.id = ticket_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Insert messages on own ticket or admin" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      public.has_role(auth.uid(),'admin')
      OR EXISTS (SELECT 1 FROM public.reports r WHERE r.id = ticket_id AND r.user_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.ticket_messages(ticket_id, created_at);

-- Trigger: bump last_message_at and unread flags
CREATE OR REPLACE FUNCTION public.handle_new_ticket_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reports
    SET last_message_at = now(),
        updated_at = now(),
        unread_for_admin = CASE WHEN NEW.is_admin THEN unread_for_admin ELSE true END,
        unread_for_user = CASE WHEN NEW.is_admin THEN true ELSE unread_for_user END,
        status = CASE WHEN status = 'closed' THEN 'open' ELSE status END
    WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_ticket_message ON public.ticket_messages;
CREATE TRIGGER trg_new_ticket_message
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_ticket_message();

-- Updated_at trigger on reports
DROP TRIGGER IF EXISTS trg_reports_updated_at ON public.reports;
CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
