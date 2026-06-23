
ALTER TABLE public.ticket_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_size integer;

-- Allow body to be empty when there's an attachment
ALTER TABLE public.ticket_messages
  ALTER COLUMN body DROP NOT NULL;

-- Storage policies for the ticket-attachments bucket.
-- Path convention: <ticket_id>/<filename>

DROP POLICY IF EXISTS "ticket attachments select own or admin" ON storage.objects;
CREATE POLICY "ticket attachments select own or admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id::text = split_part(name, '/', 1)
        AND r.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "ticket attachments insert own or admin" ON storage.objects;
CREATE POLICY "ticket attachments insert own or admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments' AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id::text = split_part(name, '/', 1)
        AND r.user_id = auth.uid()
    )
  )
);
