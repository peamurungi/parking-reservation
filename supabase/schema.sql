-- Parking Slot Reservation System: run this in the Supabase SQL editor.
-- Task 1: tables, keys, NOT NULL rules, 10 sample rows, overlap rule.

create extension if not exists btree_gist;

-- ---------- tables ----------
create table if not exists slots (
  id    bigint generated always as identity primary key,
  code  text not null unique,          -- e.g. A1
  zone  text not null                  -- e.g. A
);

-- one row per signed-up user; the role decides what Django lets them do
create table if not exists profiles (
  user_id uuid primary key references auth.users on delete cascade,
  role    text not null default 'driver' check (role in ('driver', 'attendant'))
);

create table if not exists reservations (
  id         bigint generated always as identity primary key,
  slot_id    bigint not null references slots(id) on delete restrict,
  user_id    uuid   not null references auth.users on delete cascade,
  plate      text   not null,
  start_time timestamptz not null,
  end_time   timestamptz not null,
  fee        numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  -- DATABASE-LEVEL overlap rule: same slot cannot have two overlapping ranges
  constraint no_overlap exclude using gist (
    slot_id with =,
    tstzrange(start_time, end_time) with &&
  )
);

-- every new user becomes a 'driver'. Promote an attendant by hand:
--   update profiles set role = 'attendant' where user_id = '<uuid>';
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (user_id) values (new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- sample data: 10 slots ----------
insert into slots (code, zone) values
  ('A1','A'),('A2','A'),('A3','A'),('A4','A'),('A5','A'),
  ('B1','B'),('B2','B'),('B3','B'),('B4','B'),('B5','B')
on conflict (code) do nothing;

-- Sample reservations need a real user id. After you sign up once, run:
--   insert into reservations (slot_id, user_id, plate, start_time, end_time, fee)
--   select s.id, '<your-user-uuid>', 'RAB123A', now() + interval '1 hour',
--          now() + interval '3 hours', 2000 from slots s where s.code = 'A1';

-- ---------- practise: the overlap rule in plain SQL ----------
-- Two ranges overlap when each one starts before the other ends:
--   new_start < existing_end AND new_end > existing_start
-- select * from reservations
--  where slot_id = 1
--    and start_time < '2026-12-01 12:00+00'   -- new end
--    and end_time   > '2026-12-01 10:00+00';  -- new start
-- Any row returned = conflict. Touching ends (end = next start) is allowed.

-- ---------- row level security (defence in depth) ----------
-- Django connects with a privileged DB role and does the real checks.
-- RLS protects the tables if someone calls Supabase directly with the anon key.
alter table slots        enable row level security;
alter table profiles     enable row level security;
alter table reservations enable row level security;

create policy "anyone signed in can read slots" on slots
  for select to authenticated using (true);
create policy "read own profile" on profiles
  for select to authenticated using (auth.uid() = user_id);
create policy "read own reservations" on reservations
  for select to authenticated using (auth.uid() = user_id);
