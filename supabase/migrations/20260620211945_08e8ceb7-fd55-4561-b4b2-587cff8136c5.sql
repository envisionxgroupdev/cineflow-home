
-- 1) Profiles: restrict SELECT to authenticated users (drop public anon access)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Revoke any default anon grants on profiles, keep authenticated + service_role
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2) Lock down SECURITY DEFINER helper functions that should never be
--    callable through the Data API. Triggers run as the table owner and do
--    not need EXECUTE on PUBLIC.
REVOKE ALL ON FUNCTION public.cleanup_old_reports() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_report_resolved_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role() must remain executable because RLS policies call it as the
-- current request role; keep that grant explicit.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
