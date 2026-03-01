-- Fix permissions for the admin role trigger
-- The function must be SECURITY DEFINER to bypass RLS and read auth.users during profile creation

CREATE OR REPLACE FUNCTION set_admin_role()
RETURNS trigger 
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id AND email = 'najdmejri625@gmail.com') THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
