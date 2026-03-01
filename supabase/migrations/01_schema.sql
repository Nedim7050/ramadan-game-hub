-- Profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rooms
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  owner_id uuid REFERENCES profiles(id),
  status text DEFAULT 'waiting', -- waiting, playing, closed
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Room Members
CREATE TABLE room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'player', -- owner, player, spectator
  is_ready boolean DEFAULT false,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(room_id, user_id)
);

-- Game Sessions
CREATE TABLE game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id),
  game_type text NOT NULL,
  status text DEFAULT 'active', -- active, finished
  state_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at timestamp with time zone
);

-- Match Results
CREATE TABLE match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  winner_user_id uuid REFERENCES profiles(id), -- nullable
  points_awarded int DEFAULT 0,
  summary_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Points Ledger
CREATE TABLE points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  delta_points int NOT NULL,
  reason text,
  session_id uuid REFERENCES game_sessions(id), -- nullable
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Leaderboard View
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  p.username,
  p.id AS user_id,
  COALESCE(SUM(pl.delta_points), 0) AS total_points,
  COUNT(mr.id) FILTER (WHERE mr.winner_user_id = p.id) AS wins,
  COUNT(DISTINCT pl.session_id) AS games_played
FROM profiles p
LEFT JOIN points_ledger pl ON p.id = pl.user_id
LEFT JOIN match_results mr ON mr.winner_user_id = p.id
GROUP BY p.id, p.username
ORDER BY total_points DESC;
