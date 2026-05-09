-- Clean slate: drop old tables if they exist
drop table if exists group_locations cascade;
drop table if exists group_messages cascade;
drop table if exists group_pins cascade;
drop table if exists trips cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;
drop table if exists users cascade;

-- users: device identity, no Supabase Auth
create table users (
  id text primary key,
  display_name text not null,
  avatar_color text not null,
  created_at timestamptz default now()
);

-- rooms: replaces groups
create table rooms (
  id text primary key default gen_random_uuid()::text,
  code varchar(5) unique not null,  -- 1 letter + 4 digits (e.g. K7392)
  name text not null,
  context text not null default 'biker',
  organizer_id text not null references users(id) on delete cascade,
  settings jsonb default '{
    "separationThresholdMeters": 100,
    "syncThresholdMeters": 20,
    "syncThresholdSeconds": 30
  }'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- room_members
create table room_members (
  room_id text not null references rooms(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  primary key (room_id, user_id)
);

-- room_locations: upsert pattern, one row per user per room
create table room_locations (
  room_id text not null references rooms(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  latitude numeric not null,
  longitude numeric not null,
  accuracy numeric,
  speed numeric,
  heading numeric,
  updated_at timestamptz default now(),
  primary key (room_id, user_id)
);

-- trips
create table trips (
  id text primary key default gen_random_uuid()::text,
  room_id text not null references rooms(id) on delete cascade,
  name text not null,
  destination_lat numeric,
  destination_lng numeric,
  destination_name text,
  status text not null default 'planned',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- enable realtime on locations and members
alter publication supabase_realtime add table room_locations;
alter publication supabase_realtime add table room_members;

-- no RLS for now (anon key, same as before)
alter table users disable row level security;
alter table rooms disable row level security;
alter table room_members disable row level security;
alter table room_locations disable row level security;

-- grant anon access
grant select, insert, update, delete on users to anon;
grant select, insert, update, delete on rooms to anon;
grant select, insert, update, delete on room_members to anon;
grant select, insert, update, delete on room_locations to anon;
