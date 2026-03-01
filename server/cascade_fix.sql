-- We need to ensure that when a profile is deleted, its related gossips/points are as well,
-- AND when a user is deleted from auth.users, the profile is deleted.
-- If the foreign keys restrict deletion, auth.users won't delete.

-- 1. Drop existing constraints if they exist
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.gossips DROP CONSTRAINT IF EXISTS gossips_created_by_fkey;
ALTER TABLE public.points_ledger DROP CONSTRAINT IF EXISTS points_ledger_user_id_fkey;

-- 2. Re-add them with ON DELETE CASCADE
ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.gossips 
    ADD CONSTRAINT gossips_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.points_ledger 
    ADD CONSTRAINT points_ledger_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also let's ensure the leaderboard_view handles nulls safely
DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view AS
SELECT 
    p.id AS user_id,
    p.username,
    COALESCE(SUM(l.delta_points), 0) AS total_points
FROM 
    public.profiles p
LEFT JOIN 
    public.points_ledger l ON p.id = l.user_id
GROUP BY 
    p.id, p.username;
