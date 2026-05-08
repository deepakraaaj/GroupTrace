-- GroupTrace — Sessions Flow Migration
-- Simplifies for device-based tracking without auth.users dependency
-- Adds source/destination, updates code format to 1 letter + 4 digits

-- ─────────────────────────────────────────────
-- FUNCTION: generate_session_code
-- ─────────────────────────────────────────────
create or replace function public.generate_session_code()
returns varchar(5) language plpgsql as $$
declare
  letters  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  code     varchar(5);
  exists   boolean;
begin
  loop
    code := substr(letters, floor(random() * length(letters) + 1)::int, 1) ||
            floor(random() * 10000)::varchar(4);
    select count(*) > 0 into exists from public.groups where short_code = code;
    exit when not exists;
  end loop;
  return code;
end;
$$;

-- ─────────────────────────────────────────────
-- ALTER: groups table for sessions
-- ─────────────────────────────────────────────
alter table public.groups
  add column if not exists source text,
  add column if not exists destination text,
  add column if not exists creator_device_id text;

alter table public.groups
  drop constraint if exists "groups_short_code_key";

alter table public.groups
  add constraint groups_short_code_unique unique (short_code);

-- ─────────────────────────────────────────────
-- ALTER: group_members for device-based tracking
-- ─────────────────────────────────────────────
alter table public.group_members
  add column if not exists display_name_for_session text;

-- ─────────────────────────────────────────────
-- FUNCTION: create_session
-- ─────────────────────────────────────────────
create or replace function public.create_session(
  p_creator_device_id text,
  p_creator_name      text,
  p_session_name      text,
  p_source            text,
  p_destination       text
)
returns table(session_id uuid, code varchar(5)) language plpgsql security definer as $$
declare
  v_code  varchar(5);
  v_sid   uuid;
begin
  v_code := public.generate_session_code();

  insert into public.groups(
    short_code, name, context, organizer_id,
    settings, creator_device_id, source, destination
  )
  values (
    v_code,
    p_session_name,
    'biker'::group_context,
    gen_random_uuid(),  -- dummy UUID for organizer_id (not used)
    '{
      "separationThresholdMeters": 500,
      "syncThresholdMeters": 50,
      "syncThresholdSeconds": 60
    }'::jsonb,
    p_creator_device_id,
    p_source,
    p_destination
  )
  returning id into v_sid;

  -- Add creator as member
  insert into public.group_members(
    group_id, user_id, role, device_id,
    display_name_for_session, is_active
  )
  values (
    v_sid,
    gen_random_uuid(),  -- dummy UUID for user_id
    'organizer'::member_role,
    p_creator_device_id,
    p_creator_name,
    true
  );

  return query select v_sid, v_code;
end;
$$;

-- ─────────────────────────────────────────────
-- FUNCTION: join_session_by_code
-- ─────────────────────────────────────────────
create or replace function public.join_session_by_code(
  p_device_id text,
  p_name      text,
  p_code      varchar(5)
)
returns table(session_id uuid, session_name text, source text, destination text) language plpgsql security definer as $$
declare
  v_sid   uuid;
  v_name  text;
  v_src   text;
  v_dst   text;
  v_count int;
begin
  select g.id, g.name, g.source, g.destination
  into v_sid, v_name, v_src, v_dst
  from public.groups g
  where g.short_code = upper(p_code)
    and g.is_active = true;

  if not found then
    raise exception 'Session not found or inactive';
  end if;

  -- Check member count (max 10)
  select count(*) into v_count
  from public.group_members
  where group_id = v_sid and is_active = true;

  if v_count >= 10 then
    raise exception 'Session is full (max 10 members)';
  end if;

  -- Add participant
  insert into public.group_members(
    group_id, user_id, role, device_id,
    display_name_for_session, is_active
  )
  values (
    v_sid,
    gen_random_uuid(),  -- dummy UUID for user_id
    'member'::member_role,
    p_device_id,
    p_name,
    true
  )
  on conflict(group_id, user_id) do nothing;

  return query select v_sid, v_name, v_src, v_dst;
end;
$$;

-- ─────────────────────────────────────────────
-- DISABLE RLS FOR MVP (will add back later)
-- ─────────────────────────────────────────────
alter table public.users disable row level security;
alter table public.groups disable row level security;
alter table public.group_members disable row level security;
alter table public.group_locations disable row level security;
alter table public.trips disable row level security;
alter table public.group_pins disable row level security;
alter table public.group_messages disable row level security;
