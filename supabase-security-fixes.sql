-- =============================================
-- SECURITY FIXES — Run this in Supabase SQL Editor
-- Adds RLS + policies to: site_settings, tv_channels,
-- contact_messages, reports
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS)
-- =============================================

-- 1) site_settings -----------------------------
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read settings" ON public.site_settings;
CREATE POLICY "Public can read settings"
  ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.site_settings;
CREATE POLICY "Admins can manage settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) tv_channels -------------------------------
ALTER TABLE IF EXISTS public.tv_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active channels are public" ON public.tv_channels;
CREATE POLICY "Active channels are public"
  ON public.tv_channels FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage channels" ON public.tv_channels;
CREATE POLICY "Admins manage channels"
  ON public.tv_channels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) contact_messages --------------------------
ALTER TABLE IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins manage contact messages"
  ON public.contact_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) reports -----------------------------------
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert reports" ON public.reports;
CREATE POLICY "Anyone can insert reports"
  ON public.reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage reports" ON public.reports;
CREATE POLICY "Admins manage reports"
  ON public.reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
