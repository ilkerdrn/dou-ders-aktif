create schema if not exists private;

create table if not exists public.dou_staff_allowlist (
  email text primary key check (email = lower(email) and email like '%@dogus.edu.tr'),
  added_at timestamptz not null default now()
);

alter table public.dou_staff_allowlist enable row level security;
revoke all on table public.dou_staff_allowlist from anon, authenticated;

create table if not exists public.dou_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (email = lower(email) and email like '%@dogus.edu.tr'),
  full_name text,
  role text not null default 'student' check (role in ('student', 'instructor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dou_user_profiles enable row level security;
grant select on table public.dou_user_profiles to authenticated;
revoke insert, update, delete on table public.dou_user_profiles from anon, authenticated;

drop policy if exists "users_read_own_dou_profile" on public.dou_user_profiles;
create policy "users_read_own_dou_profile"
on public.dou_user_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function private.create_dou_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(coalesce(new.email, ''));
  assigned_role text := 'student';
begin
  if normalized_email not like '%@dogus.edu.tr' then
    return new;
  end if;

  if exists (
    select 1 from public.dou_staff_allowlist s where s.email = normalized_email
  ) then
    assigned_role := 'instructor';
  end if;

  insert into public.dou_user_profiles (user_id, email, full_name, role)
  values (
    new.id,
    normalized_email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    assigned_role
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.dou_user_profiles.full_name),
    role = assigned_role,
    updated_at = now();

  return new;
end;
$$;

revoke all on function private.create_dou_user_profile() from public;

drop trigger if exists on_dou_auth_user_created on auth.users;
create trigger on_dou_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function private.create_dou_user_profile();

insert into public.dou_user_profiles (user_id, email, full_name, role)
select
  u.id,
  lower(u.email),
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  case when exists (
    select 1 from public.dou_staff_allowlist s where s.email = lower(u.email)
  ) then 'instructor' else 'student' end
from auth.users u
where lower(coalesce(u.email, '')) like '%@dogus.edu.tr'
on conflict (user_id) do nothing;
