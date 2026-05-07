-- GroupTrace — Initial Schema Migration
-- Requires: Supabase with PostGIS extension enabled

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- TYPES / ENUMS
-- ─────────────────────────────────────────────
do $$ begin
  create type group_context as enum (
    'biker', 'trekking', 'convoy', 'pilgrimage',
    'family', 'delivery', 'tour_guide'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type member_role as enum (
    'member', 'organizer', 'guide', 'parent', 'dispatcher'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type trip_status as enum ('planned', 'active', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pin_type as enum (
    'wait_here', 'danger', 'petrol', 'regroup', 'checkpoint'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_type as enum ('text', 'preset', 'system', 'alert');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  phone_hash    text unique,
  avatar_color  text not null default '#4CAF50',
  device_id     text,
  created_at    timestamptz not null default now()
);

create table if not exists public.groups (
  id           uuid primary key default gen_random_uuid(),
  short_code   varchar(6) not null unique,
  name         text not null,
  context      group_context not null,
  organizer_id uuid not null references public.users(id) on delete restrict,
  is_active    boolean not null default true,
  settings     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create table if not exists public.group_members (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  role         member_role not null default 'member',
  device_id    text,
  is_active    boolean not null default true,
  joined_at    timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create table if not exists public.group_locations (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  latitude   decimal(10,8) not null,
  longitude  decimal(11,8) not null,
  accuracy   decimal,
  speed      decimal,       -- m/s
  heading    decimal,       -- degrees 0–360
  geom       geometry(Point, 4326),
  timestamp  timestamptz not null default now()
);

create table if not exists public.trips (
  id               uuid primary key default gen_random_uuid(),
  group_id         uuid not null references public.groups(id) on delete cascade,
  name             text not null,
  destination_lat  decimal(10,8),
  destination_lng  decimal(11,8),
  destination_name text,
  status           trip_status not null default 'planned',
  started_at       timestamptz,
  ended_at         timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists public.group_pins (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade,
  created_by   uuid not null references public.users(id) on delete restrict,
  pin_type     pin_type not null,
  latitude     decimal(10,8) not null,
  longitude    decimal(11,8) not null,
  message      text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.group_messages (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete restrict,
  message      text not null,
  message_type message_type not null default 'text',
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────

-- group_locations: spatial index + lookup by group+user+time
create index if not exists idx_group_locations_geom
  on public.group_locations using gist(geom);

create index if not exists idx_group_locations_group_time
  on public.group_locations(group_id, timestamp desc);

create index if not exists idx_group_locations_user_time
  on public.group_locations(user_id, timestamp desc);

create index if not exists idx_group_members_group
  on public.group_members(group_id) where is_active = true;

create index if not exists idx_group_members_user
  on public.group_members(user_id) where is_active = true;

create index if not exists idx_groups_short_code
  on public.groups(short_code) where is_active = true;

create index if not exists idx_group_pins_group
  on public.group_pins(group_id) where is_active = true;

create index if not exists idx_group_messages_group_time
  on public.group_messages(group_id, created_at desc);

-- ─────────────────────────────────────────────
-- TRIGGER: auto-fill geometry column
-- ─────────────────────────────────────────────
create or replace function public.fill_location_geom()
returns trigger language plpgsql as $$
begin
  new.geom := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326);
  return new;
end;
$$;

drop trigger if exists trg_fill_location_geom on public.group_locations;
create trigger trg_fill_location_geom
  before insert or update on public.group_locations
  for each row execute function public.fill_location_geom();

-- ─────────────────────────────────────────────
-- FUNCTION: generate_short_code
-- ─────────────────────────────────────────────
create or replace function public.generate_short_code()
returns varchar(6) language plpgsql as $$
declare
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- exclude 0/O/1/I (ambiguous)
  code   varchar(6);
  exists boolean;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    select count(*) > 0 into exists from public.groups where short_code = code;
    exit when not exists;
  end loop;
  return code;
end;
$$;

-- ─────────────────────────────────────────────
-- FUNCTION: context_default_settings
-- ─────────────────────────────────────────────
create or replace function public.context_default_settings(ctx group_context)
returns jsonb language plpgsql as $$
begin
  return case ctx
    when 'biker' then '{
      "separationThresholdMeters": 500,
      "syncThresholdMeters": 50,
      "syncThresholdSeconds": 60,
      "ridingSpeedKmh": 30,
      "stoppedSpeedKmh": 5
    }'::jsonb
    when 'trekking' then '{
      "separationThresholdMeters": 200,
      "syncThresholdMeters": 30,
      "syncThresholdSeconds": 45,
      "walkingSpeedKmh": 3,
      "restingSpeedKmh": 0.5
    }'::jsonb
    when 'convoy' then '{
      "separationThresholdMeters": 2000,
      "syncThresholdMeters": 100,
      "syncThresholdSeconds": 30,
      "highwaySpeedKmh": 60,
      "citySpeedKmh": 10,
      "missedTurnHeadingDegrees": 30
    }'::jsonb
    when 'pilgrimage' then '{
      "separationThresholdMeters": 300,
      "syncThresholdMeters": 40,
      "syncThresholdSeconds": 90,
      "maxGroupSize": 100
    }'::jsonb
    when 'family' then '{
      "separationThresholdMeters": 100,
      "syncThresholdMeters": 20,
      "syncThresholdSeconds": 30
    }'::jsonb
    when 'delivery' then '{
      "separationThresholdMeters": 99999,
      "syncThresholdMeters": 200,
      "syncThresholdSeconds": 120,
      "stationaryAlertMinutes": 10
    }'::jsonb
    when 'tour_guide' then '{
      "separationThresholdMeters": 150,
      "syncThresholdMeters": 30,
      "syncThresholdSeconds": 45
    }'::jsonb
  end;
end;
$$;

-- ─────────────────────────────────────────────
-- FUNCTION: create_group
-- ─────────────────────────────────────────────
create or replace function public.create_group(
  p_organizer_id uuid,
  p_name         text,
  p_context      group_context
)
returns table(group_id uuid, short_code varchar(6)) language plpgsql security definer as $$
declare
  v_code  varchar(6);
  v_gid   uuid;
begin
  v_code := public.generate_short_code();

  insert into public.groups(short_code, name, context, organizer_id, settings)
  values (v_code, p_name, p_context, p_organizer_id, public.context_default_settings(p_context))
  returning id into v_gid;

  insert into public.group_members(group_id, user_id, role, is_active)
  values (v_gid, p_organizer_id, 'organizer', true);

  return query select v_gid, v_code;
end;
$$;

-- ─────────────────────────────────────────────
-- FUNCTION: join_group_by_code
-- ─────────────────────────────────────────────
create or replace function public.join_group_by_code(
  p_user_id   uuid,
  p_code      varchar(6),
  p_device_id text default null
)
returns table(group_id uuid, group_name text, context group_context) language plpgsql security definer as $$
declare
  v_gid  uuid;
  v_name text;
  v_ctx  group_context;
begin
  select g.id, g.name, g.context
  into v_gid, v_name, v_ctx
  from public.groups g
  where g.short_code = upper(p_code)
    and g.is_active = true;

  if not found then
    raise exception 'Group not found or inactive';
  end if;

  insert into public.group_members(group_id, user_id, role, device_id, is_active, last_seen_at)
  values (v_gid, p_user_id, 'member', p_device_id, true, now())
  on conflict(group_id, user_id) do update
    set is_active    = true,
        device_id    = coalesce(p_device_id, group_members.device_id),
        last_seen_at = now();

  return query select v_gid, v_name, v_ctx;
end;
$$;

-- ─────────────────────────────────────────────
-- FUNCTION: sync_location
-- ─────────────────────────────────────────────
create or replace function public.sync_location(
  p_group_id  uuid,
  p_user_id   uuid,
  p_lat       decimal(10,8),
  p_lng       decimal(11,8),
  p_accuracy  decimal default null,
  p_speed     decimal default null,
  p_heading   decimal default null
)
returns void language plpgsql security definer as $$
begin
  insert into public.group_locations(group_id, user_id, latitude, longitude, accuracy, speed, heading)
  values (p_group_id, p_user_id, p_lat, p_lng, p_accuracy, p_speed, p_heading);

  update public.group_members
  set last_seen_at = now()
  where group_id = p_group_id and user_id = p_user_id;
end;
$$;

-- ─────────────────────────────────────────────
-- FUNCTION: compute_group_state
-- ─────────────────────────────────────────────
create or replace function public.compute_group_state(p_group_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_context           group_context;
  v_separation_meters decimal;
  v_settings          jsonb;
  v_result            jsonb;
  v_center_lat        decimal;
  v_center_lng        decimal;
  v_rider_count       int;
  v_separated_count   int;
  v_avg_speed_kmh     decimal;
begin
  select g.context, g.settings
  into v_context, v_settings
  from public.groups g
  where g.id = p_group_id;

  v_separation_meters := (v_settings->>'separationThresholdMeters')::decimal;

  -- latest location per member within last 5 minutes
  with latest as (
    select distinct on (user_id)
      user_id, latitude, longitude, speed
    from public.group_locations
    where group_id = p_group_id
      and timestamp > now() - interval '5 minutes'
    order by user_id, timestamp desc
  ),
  stats as (
    select
      count(*)::int                              as rider_count,
      avg(latitude)::decimal                     as center_lat,
      avg(longitude)::decimal                    as center_lng,
      avg(coalesce(speed, 0) * 3.6)::decimal     as avg_speed_kmh
    from latest
  ),
  separated as (
    select count(*)::int as separated_count
    from latest l, stats s
    where ST_Distance(
      ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(s.center_lng, s.center_lat), 4326)::geography
    ) > v_separation_meters
  )
  select
    s.rider_count,
    s.center_lat,
    s.center_lng,
    s.avg_speed_kmh,
    sep.separated_count
  into v_rider_count, v_center_lat, v_center_lng, v_avg_speed_kmh, v_separated_count
  from stats s, separated sep;

  v_result := jsonb_build_object(
    'center_lat',       v_center_lat,
    'center_lng',       v_center_lng,
    'rider_count',      coalesce(v_rider_count, 0),
    'separated_count',  coalesce(v_separated_count, 0),
    'avg_speed_kmh',    coalesce(round(v_avg_speed_kmh, 1), 0),
    'computed_at',      now()
  );

  return v_result;
end;
$$;

-- ─────────────────────────────────────────────
-- ENABLE REALTIME
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.group_locations;
alter publication supabase_realtime add table public.group_messages;
alter publication supabase_realtime add table public.group_pins;
alter publication supabase_realtime add table public.group_members;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

alter table public.users         enable row level security;
alter table public.groups        enable row level security;
alter table public.group_members enable row level security;
alter table public.group_locations enable row level security;
alter table public.trips         enable row level security;
alter table public.group_pins    enable row level security;
alter table public.group_messages enable row level security;

-- Helper: is authenticated user an active member of a group?
create or replace function public.is_group_member(p_group_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id
      and user_id  = auth.uid()
      and is_active = true
  );
$$;

-- users
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (id = auth.uid());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (id = auth.uid());

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (id = auth.uid());

-- groups: readable by active members
drop policy if exists "groups_select_member" on public.groups;
create policy "groups_select_member" on public.groups
  for select using (public.is_group_member(id));

drop policy if exists "groups_insert_auth" on public.groups;
create policy "groups_insert_auth" on public.groups
  for insert with check (organizer_id = auth.uid());

drop policy if exists "groups_update_organizer" on public.groups;
create policy "groups_update_organizer" on public.groups
  for update using (organizer_id = auth.uid());

-- group_members
drop policy if exists "members_select_group" on public.group_members;
create policy "members_select_group" on public.group_members
  for select using (public.is_group_member(group_id));

drop policy if exists "members_insert_own" on public.group_members;
create policy "members_insert_own" on public.group_members
  for insert with check (user_id = auth.uid());

drop policy if exists "members_update_own" on public.group_members;
create policy "members_update_own" on public.group_members
  for update using (user_id = auth.uid());

-- group_locations
drop policy if exists "locations_select_group" on public.group_locations;
create policy "locations_select_group" on public.group_locations
  for select using (public.is_group_member(group_id));

drop policy if exists "locations_insert_own" on public.group_locations;
create policy "locations_insert_own" on public.group_locations
  for insert with check (user_id = auth.uid() and public.is_group_member(group_id));

-- trips
drop policy if exists "trips_select_group" on public.trips;
create policy "trips_select_group" on public.trips
  for select using (public.is_group_member(group_id));

drop policy if exists "trips_insert_group" on public.trips;
create policy "trips_insert_group" on public.trips
  for insert with check (public.is_group_member(group_id));

drop policy if exists "trips_update_group" on public.trips;
create policy "trips_update_group" on public.trips
  for update using (public.is_group_member(group_id));

-- group_pins
drop policy if exists "pins_select_group" on public.group_pins;
create policy "pins_select_group" on public.group_pins
  for select using (public.is_group_member(group_id));

drop policy if exists "pins_insert_group" on public.group_pins;
create policy "pins_insert_group" on public.group_pins
  for insert with check (created_by = auth.uid() and public.is_group_member(group_id));

drop policy if exists "pins_update_creator" on public.group_pins;
create policy "pins_update_creator" on public.group_pins
  for update using (created_by = auth.uid());

-- group_messages
drop policy if exists "messages_select_group" on public.group_messages;
create policy "messages_select_group" on public.group_messages
  for select using (public.is_group_member(group_id));

drop policy if exists "messages_insert_group" on public.group_messages;
create policy "messages_insert_group" on public.group_messages
  for insert with check (user_id = auth.uid() and public.is_group_member(group_id));
