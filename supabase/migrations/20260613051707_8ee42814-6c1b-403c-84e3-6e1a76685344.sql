CREATE TABLE IF NOT EXISTS public.signup_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ip text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signup_ips_ip_idx ON public.signup_ips (ip);

GRANT SELECT ON public.signup_ips TO authenticated;
GRANT ALL ON public.signup_ips TO service_role;

ALTER TABLE public.signup_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read signup_ips"
ON public.signup_ips FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
