-- =====================================================================
-- SECURITY FIXES — run this in your Supabase SQL editor
-- =====================================================================

-- 1) site_settings: restrict writes to admins, keep public read
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read settings" ON public.site_settings;

CREATE POLICY "Public can read settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) profiles: stop exposing emails publicly. Owner + admin only.
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- 3) contact_messages: anyone can insert, only admins can read/update/delete
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage contact messages"
  ON public.contact_messages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) reports: anyone can insert, only admins can read/update/delete
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;

CREATE POLICY "Anyone can insert reports"
  ON public.reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage reports"
  ON public.reports FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
