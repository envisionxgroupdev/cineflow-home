
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

REVOKE INSERT ON public.requests FROM anon;

DROP POLICY IF EXISTS "Anyone can submit requests" ON public.requests;
CREATE POLICY "Authenticated users can submit requests"
  ON public.requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests"
  ON public.requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
