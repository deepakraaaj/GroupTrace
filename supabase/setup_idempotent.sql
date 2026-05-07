-- GroupTrace safe setup - idempotent version
-- Handles existing tables/functions without errors

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
-- HELPER: generate_short_code
-- ─────────────────────────────────────────────
create or replace function public.generate_short_code()
returns varchar(4) language plpgsql as $$
declare
  code    varchar(4);
  taken   boolean;
begin
  loop
    code := lpad((floor(random() * 10000))::int::text, 4, '0');
    select exists(
      select 1
      from public.groups
      where short_code = code
    ) into taken;
    exit when not taken;
  end loop;
  return code;
end;
$$;

-- ─────────────────────────────────────────────
-- HELPER: context_default_settings
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
-- HELPER: ensure_user
-- ─────────────────────────────────────────────
create or replace function public.ensure_user(
  p_user_id text,
  p_display_name text default null,
  p_avatar_color text default null
)
returns void language plpgsql security definer as $$
begin
  insert into public.users(id, display_name, avatar_color)
  values (
    p_user_id,
    coalesce(nullif(p_display_name, ''), 'User ' || right(p_user_id, 4)),
    coalesce(
      p_avatar_color,
      (array[
        '#06d6a0', '#7c3aed', '#3b82f6', '#f59e0b', '#ef4444',
        '#10b981', '#6366f1', '#ec4899', '#f97316', '#06b6d4'
      ])[1 + floor(random() * 10)::int]
    )
  )
  on conflict (id) do nothing;
end;
$$;

-- ─────────────────────────────────────────────
-- FUNCTION: create_group
-- ─────────────────────────────────────────────
create or replace function public.create_group(
  p_organizer_id   text,
  p_name           text,
  p_context        group_context,
  p_display_name   text default null,
  p_avatar_color   text default null
)
returns table(group_id uuid, short_code varchar(4)) language plpgsql security definer as $$
declare
  v_code  varchar(4);
  v_gid   uuid;
begin
  perform public.ensure_user(p_organizer_id, p_display_name, p_avatar_color);

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
  p_user_id       text,
  p_code          varchar(4),
  p_device_id     text default null,
  p_display_name  text default null,
  p_avatar_color  text default null
)
returns table(group_id uuid, group_name text, context group_context) language plpgsql security definer as $$
declare
  v_gid  uuid;
  v_name text;
  v_ctx  group_context;
begin
  perform public.ensure_user(p_user_id, p_display_name, p_avatar_color);

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
  on conflict (group_id, user_id) do update
    set is_active    = true,
        device_id    = coalesce(p_device_id, public.group_members.device_id),
        last_seen_at = now();

  return query select v_gid, v_name, v_ctx;
end;
$$;

-- ─────────────────────────────────────────────
-- FUNCTION: sync_location
-- ─────────────────────────────────────────────
create or replace function public.sync_location(
  p_group_id  uuid,
  p_user_id   text,
  p_lat       decimal(10,8),
  p_lng       decimal(11,8),
  p_accuracy  decimal default null,
  p_speed     decimal default null,
  p_heading   decimal default null
)
returns void language plpgsql security definer as $$
begin
  perform public.ensure_user(p_user_id);

  insert into public.group_locations(group_id, user_id, latitude, longitude, accuracy, speed, heading)
  values (p_group_id, p_user_id, p_lat, p_lng, p_accuracy, p_speed, p_heading);

  update public.group_members
  set last_seen_at = now(),
      is_active = true
  where group_id = p_group_id
    and user_id = p_user_id;
end;
$$;

-- ─────────────────────────────────────────────
-- TRIGGER: auto-fill geometry column (safe replace)
-- ─────────────────────────────────────────────
drop trigger if exists trg_fill_location_geom on public.group_locations;

create or replace function public.fill_location_geom()
returns trigger language plpgsql as $$
begin
  new.geom := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326);
  return new;
end;
$$;

create trigger trg_fill_location_geom
  before insert or update on public.group_locations
  for each row execute function public.fill_location_geom();

-- ─────────────────────────────────────────────
-- ENABLE REALTIME (safe - only if not already enabled)
-- ─────────────────────────────────────────────
do $$
begin
  -- Try to add tables if not already in publication
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'group_locations'
  ) then
    alter publication supabase_realtime add table public.group_locations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'group_messages'
  ) then
    alter publication supabase_realtime add table public.group_messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'group_pins'
  ) then
    alter publication supabase_realtime add table public.group_pins;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'group_members'
  ) then
    alter publication supabase_realtime add table public.group_members;
  end if;
exception when others then
  -- If publication checks fail, that's ok - tables may already be added
  null;
end $$;

-- ─────────────────────────────────────────────
-- PERMISSIVE ACCESS FOR TESTING
-- ─────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

alter table public.users disable row level security;
alter table public.groups disable row level security;
alter table public.group_members disable row level security;
alter table public.group_locations disable row level security;
alter table public.trips disable row level security;
alter table public.group_pins disable row level security;
alter table public.group_messages disable row level security;
