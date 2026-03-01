-- Migration pour créer les tables et la vue utilisées par Ramadan Game Hub

-- Table des profils utilisateurs
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Table des rooms (salons)
create table if not exists rooms (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  owner_id uuid not null references profiles(id) on delete cascade,
  status text default 'waiting',
  created_at timestamp with time zone default now()
);

-- Table des membres d’une room
create table if not exists room_members (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text default 'player',
  is_ready boolean default false,
  joined_at timestamp with time zone default now(),
  unique (room_id, user_id)
);

-- Table des sessions de jeu
create table if not exists game_sessions (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  game_type text not null,
  status text default 'active',
  state_json jsonb,
  created_at timestamp with time zone default now(),
  ended_at timestamp with time zone
);

-- Table des résultats de match
create table if not exists match_results (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references game_sessions(id) on delete cascade,
  winner_user_id uuid references profiles(id) on delete set null,
  points_awarded integer,
  summary_json jsonb,
  created_at timestamp with time zone default now()
);

-- Table du ledger de points (historique des points)
create table if not exists points_ledger (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  delta_points integer not null,
  reason text,
  session_id uuid references game_sessions(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Vue de classement agrégée
create or replace view leaderboard_view as
select
  p.id as user_id,
  p.username,
  coalesce(sum(pl.delta_points), 0) as total_points,
  coalesce(count(case when pl.delta_points >= 10 then 1 end), 0) as wins,
  coalesce(count(pl.id), 0) as games_played
from profiles p
left join points_ledger pl on p.id = pl.user_id
group by p.id, p.username
order by total_points desc;