/**
 * V2 Requirements - Ramadan Game Hub
 */

-- Gossips Table (Pour les messages anonymes)
CREATE TABLE IF NOT EXISTS gossips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL, -- peut être null si "totalement anonyme" sans session
  type text NOT NULL, -- 'dare' ou 'gossip'
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: L'admin sera identifié au niveau du code via son email 'najdmejri625@gmail.com',
-- ou on peut ajouter une colonne 'is_admin' dans_profiles.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- On crée un trigger pour attribuer automatiquement le rôle admin
-- à cet email dès la création ou lors d'une mise à jour (pour contourner le fait
-- que le compte n'est peut-être pas encore créé quand ce script SQL est exécuté).

-- D'abord, on met à jour si le compte existe déjà :
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'najdmejri625@gmail.com'
);

-- Ensuite, on crée un trigger sur la table profiles
CREATE OR REPLACE FUNCTION set_admin_role()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id AND email = 'najdmejri625@gmail.com') THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_admin_role ON profiles;
CREATE TRIGGER ensure_admin_role
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_role();
