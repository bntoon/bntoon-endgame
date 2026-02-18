
-- Fix 1: Restrict user_profiles SELECT to only profiles of users who have commented
-- (needed for comment display) instead of exposing all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_profiles;

CREATE POLICY "Profiles viewable for comment authors"
  ON public.user_profiles FOR SELECT
  USING (
    user_id IN (SELECT DISTINCT user_id FROM public.comments)
    OR auth.uid() = user_id
  );

-- Fix 2: Restrict chapter_views SELECT to admins only (no public need to read tracking data)
DROP POLICY IF EXISTS "Views are viewable by everyone" ON public.chapter_views;

CREATE POLICY "Only admins can view chapter_views"
  ON public.chapter_views FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
