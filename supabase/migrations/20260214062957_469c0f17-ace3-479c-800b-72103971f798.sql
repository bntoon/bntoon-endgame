
-- Drop foreign key constraints on comments that reference series and chapters in Supabase
-- (the actual data lives in NeonDB, not in Supabase tables)
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_series_id_fkey;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_chapter_id_fkey;
