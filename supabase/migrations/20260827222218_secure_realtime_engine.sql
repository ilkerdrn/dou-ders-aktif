-- DOU DersAktif production baseline and server-authoritative live session engine.
-- Idempotent so a fresh school installation and the existing pilot database
-- converge on the same schema.

create extension if not exists pgcrypto;

create table if not exists public.dou_courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  title text not null,
  term text not null default '2026 Güz',
  created_at timestamptz not null default now()
);

create table if not exists public.dou_activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.dou_courses(id) on delete set null,
  title text not null,
  game_type text not null,
  content jsonb not null default '[]'::jsonb,
  outcome_map jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dou_support_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  student_ref text not null,
  read_aloud boolean not null default false,
  extra_time_percent integer not null default 0 check (extra_time_percent between 0 and 100),
  focus_mode boolean not null default false,
  hints boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(owner_id, student_ref)
);

create table if not exists public.dou_question_bank (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject text,
  content jsonb not null default '[]'::jsonb,
  outcome_map jsonb not null default '{}'::jsonb,
  is_shared boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.dou_audit_logs (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.dou_courses enable row level security;
alter table public.dou_activities enable row level security;
alter table public.dou_support_profiles enable row level security;
alter table public.dou_question_bank enable row level security;
alter table public.dou_audit_logs enable row level security;

grant select, insert, update, delete on public.dou_courses, public.dou_activities,
  public.dou_support_profiles, public.dou_question_bank to authenticated;
grant select, insert on public.dou_audit_logs to authenticated;
grant usage, select on sequence public.dou_audit_logs_id_seq to authenticated;

drop policy if exists owners_manage_courses on public.dou_courses;
create policy owners_manage_courses on public.dou_courses for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists owners_manage_activities on public.dou_activities;
create policy owners_manage_activities on public.dou_activities for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists owners_manage_supports on public.dou_support_profiles;
create policy owners_manage_supports on public.dou_support_profiles for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists bank_select on public.dou_question_bank;
create policy bank_select on public.dou_question_bank for select to authenticated
using (owner_id = (select auth.uid()) or (is_shared and is_verified));
drop policy if exists bank_insert on public.dou_question_bank;
create policy bank_insert on public.dou_question_bank for insert to authenticated
with check (owner_id = (select auth.uid()) and is_verified = false);
drop policy if exists bank_update on public.dou_question_bank;
create policy bank_update on public.dou_question_bank for update to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()) and is_verified = false);
drop policy if exists bank_delete on public.dou_question_bank;
create policy bank_delete on public.dou_question_bank for delete to authenticated
using (owner_id = (select auth.uid()));
drop policy if exists owners_read_audit on public.dou_audit_logs;
create policy owners_read_audit on public.dou_audit_logs for select to authenticated
using (owner_id = (select auth.uid()));
drop policy if exists owners_insert_audit on public.dou_audit_logs;
create policy owners_insert_audit on public.dou_audit_logs for insert to authenticated
with check (owner_id = (select auth.uid()));

create table if not exists public.dou_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid references public.dou_activities(id) on delete set null,
  join_code text not null,
  status text not null default 'lobby',
  started_at timestamptz,
  ended_at timestamptz
);

alter table public.dou_sessions
  add column if not exists activity_title text not null default 'Canlı etkinlik',
  add column if not exists game_type text not null default 'Quiz',
  add column if not exists questions jsonb not null default '[]'::jsonb,
  add column if not exists current_round integer not null default 0,
  add column if not exists round_started_at timestamptz,
  add column if not exists round_ends_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists dou_sessions_active_join_code_uidx
  on public.dou_sessions(join_code)
  where status in ('lobby', 'question', 'leaderboard');
create index if not exists dou_sessions_owner_idx on public.dou_sessions(owner_id);
create index if not exists dou_sessions_activity_idx on public.dou_sessions(activity_id);

create table if not exists public.dou_session_participants (
  session_id uuid not null references public.dou_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  score integer not null default 0 check (score >= 0),
  streak integer not null default 0 check (streak >= 0),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (session_id, user_id)
);
create index if not exists dou_session_participants_user_idx
  on public.dou_session_participants(user_id, session_id);

create table if not exists public.dou_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.dou_sessions(id) on delete cascade,
  participant_hash text not null,
  question_index integer not null,
  answer jsonb not null,
  is_correct boolean,
  points integer not null default 0,
  answered_at timestamptz not null default now()
);
alter table public.dou_responses
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists response_ms integer,
  add column if not exists outcome text;
create unique index if not exists dou_responses_one_per_round_uidx
  on public.dou_responses(session_id, user_id, question_index)
  where user_id is not null;
create index if not exists dou_responses_session_idx
  on public.dou_responses(session_id, question_index);

alter table public.dou_sessions enable row level security;
alter table public.dou_session_participants enable row level security;
alter table public.dou_responses enable row level security;

grant select, insert, update, delete on public.dou_sessions to authenticated;
revoke all on public.dou_session_participants from anon, authenticated;
revoke insert, update, delete on public.dou_responses from anon, authenticated;
grant select on public.dou_session_participants to authenticated;
grant update (removed_at) on public.dou_session_participants to authenticated;
grant select on public.dou_responses to authenticated;

drop policy if exists owners_manage_sessions on public.dou_sessions;
create policy owners_manage_sessions on public.dou_sessions for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists active_session_lookup on public.dou_sessions;
drop policy if exists participants_read_session on public.dou_sessions;
create policy participants_read_session on public.dou_sessions for select
to authenticated using (
  owner_id = (select auth.uid()) or exists (
    select 1 from public.dou_session_participants p
    where p.session_id = id and p.user_id = (select auth.uid()) and p.removed_at is null
  )
);

drop policy if exists participants_read_self on public.dou_session_participants;
create policy participants_read_self on public.dou_session_participants for select
to authenticated using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.dou_sessions s
    where s.id = session_id and s.owner_id = (select auth.uid())
  )
);
drop policy if exists session_owner_moderates_participants on public.dou_session_participants;
create policy session_owner_moderates_participants on public.dou_session_participants for update
to authenticated using (
  exists (select 1 from public.dou_sessions s
          where s.id = session_id and s.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.dou_sessions s
          where s.id = session_id and s.owner_id = (select auth.uid()))
);

drop policy if exists owners_insert_responses on public.dou_responses;
drop policy if exists owners_read_responses on public.dou_responses;
create policy session_owner_reads_responses on public.dou_responses for select
to authenticated using (
  exists (select 1 from public.dou_sessions s
          where s.id = session_id and s.owner_id = (select auth.uid()))
  or user_id = (select auth.uid())
);

create or replace function public.dou_join_session(p_join_code text, p_display_name text)
returns table(session_id uuid, activity_title text, game_type text, status text)
language plpgsql security definer set search_path = ''
as $$
declare
  v_session public.dou_sessions%rowtype;
  v_name text := regexp_replace(trim(p_display_name), '\s+', ' ', 'g');
  v_normalized text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if char_length(v_name) not between 2 and 24 then raise exception 'invalid_display_name'; end if;
  if v_name !~ '^[[:alnum:]çÇğĞıİöÖşŞüÜ._ -]+$' then raise exception 'invalid_display_name'; end if;
  v_normalized := lower(regexp_replace(v_name, '[._ -]', '', 'g'));
  if v_normalized = any(array['admin','yonetici','yönetici','moderator','moderatör','sistem'])
     or v_normalized ~ '(amk|orospu|siktir|yarrak|yarak|amcik|amcık|porno|seks|escort|gerizekali|gerizekalı|salak|aptal)'
  then raise exception 'blocked_display_name'; end if;

  select * into v_session from public.dou_sessions s
  where s.join_code = regexp_replace(p_join_code, '\s', '', 'g')
    and s.status in ('lobby', 'question', 'leaderboard')
    and s.ended_at is null
  order by s.started_at desc nulls last limit 1;
  if v_session.id is null then raise exception 'session_not_found'; end if;

  insert into public.dou_session_participants(session_id, user_id, display_name)
  values (v_session.id, auth.uid(), v_name)
  on conflict (session_id, user_id) do update set
    display_name = excluded.display_name,
    last_seen_at = now(),
    removed_at = null;

  return query select v_session.id, v_session.activity_title, v_session.game_type, v_session.status;
end;
$$;

create or replace function public.dou_submit_answer(
  p_session_id uuid,
  p_question_index integer,
  p_answer jsonb
)
returns table(accepted boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  v_session public.dou_sessions%rowtype;
  v_question jsonb;
  v_correct boolean := false;
  v_points integer := 0;
  v_response_ms integer;
  v_streak integer;
  v_score integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_session from public.dou_sessions where id = p_session_id for update;
  if v_session.id is null or v_session.status <> 'question' then raise exception 'answers_closed'; end if;
  if v_session.current_round <> p_question_index then raise exception 'invalid_round'; end if;
  if v_session.round_ends_at is not null and now() > v_session.round_ends_at + interval '2 seconds' then
    raise exception 'answers_closed';
  end if;
  if not exists (select 1 from public.dou_session_participants p
                 where p.session_id = p_session_id and p.user_id = auth.uid() and p.removed_at is null)
  then raise exception 'not_a_participant'; end if;

  v_question := v_session.questions -> p_question_index;
  if v_question is null then raise exception 'question_not_found'; end if;
  if v_session.game_type in ('Anket', 'Kelime Bulutu') then
    v_correct := true;
  elsif v_question ->> 'kind' = 'open' then
    v_correct := lower(trim(coalesce(p_answer ->> 'text', ''))) =
      lower(trim(coalesce(v_question -> 'a' ->> coalesce((v_question ->> 'correct')::integer, 0), '')));
  elsif v_question ->> 'kind' = 'pin' then
    v_correct := sqrt(
      power(coalesce((p_answer ->> 'x')::numeric, -1000) - coalesce((v_question ->> 'pinX')::numeric, 50), 2) +
      power(coalesce((p_answer ->> 'y')::numeric, -1000) - coalesce((v_question ->> 'pinY')::numeric, 50), 2)
    ) <= 12;
  elsif jsonb_typeof(v_question -> 'corrects') = 'array' then
    v_correct := coalesce(p_answer -> 'indexes', '[]'::jsonb) = v_question -> 'corrects';
  elsif v_question ->> 'kind' = 'ranking' then
    v_correct := coalesce(p_answer -> 'indexes', '[]'::jsonb) = v_question -> 'corrects';
  else
    v_correct := (p_answer ->> 'index')::integer = coalesce((v_question ->> 'correct')::integer, 0);
  end if;

  v_response_ms := greatest(0, extract(epoch from (now() - coalesce(v_session.round_started_at, now())))::integer * 1000);
  select p.streak, p.score into v_streak, v_score
  from public.dou_session_participants p
  where p.session_id = p_session_id and p.user_id = auth.uid() for update;
  v_streak := case when v_correct then v_streak + 1 else 0 end;
  v_points := case when v_correct then
    600 + greatest(0, 400 - (v_response_ms / 25)) + least(v_streak * 75, 375)
    else 0 end;

  insert into public.dou_responses(session_id, participant_hash, user_id, question_index,
    answer, is_correct, points, response_ms, outcome)
  values (p_session_id, encode(digest(auth.uid()::text, 'sha256'), 'hex'), auth.uid(),
    p_question_index, p_answer, v_correct, v_points, v_response_ms, v_question ->> 'outcome');

  update public.dou_session_participants set score = score + v_points,
    streak = v_streak, last_seen_at = now()
  where session_id = p_session_id and user_id = auth.uid()
  returning score into v_score;
  return query select true;
exception when unique_violation then
  raise exception 'already_answered';
end;
$$;

revoke all on function public.dou_join_session(text, text) from public, anon;
revoke all on function public.dou_submit_answer(uuid, integer, jsonb) from public, anon;
grant execute on function public.dou_join_session(text, text) to authenticated;
grant execute on function public.dou_submit_answer(uuid, integer, jsonb) to authenticated;

-- Private Realtime: session owners publish game state; authenticated members
-- can receive broadcasts and publish presence only.
drop policy if exists dou_realtime_read on realtime.messages;
create policy dou_realtime_read on realtime.messages for select to authenticated using (
  exists (
    select 1 from public.dou_sessions s
    where 'dou-room-' || s.join_code = (select realtime.topic())
      and (s.owner_id = (select auth.uid()) or exists (
        select 1 from public.dou_session_participants p
        where p.session_id = s.id and p.user_id = (select auth.uid()) and p.removed_at is null
      ))
  ) and realtime.messages.extension in ('broadcast', 'presence')
);

drop policy if exists dou_realtime_write on realtime.messages;
create policy dou_realtime_write on realtime.messages for insert to authenticated with check (
  exists (
    select 1 from public.dou_sessions s
    where 'dou-room-' || s.join_code = (select realtime.topic())
      and (
        s.owner_id = (select auth.uid())
        or ((realtime.messages.extension = 'presence' or
             (realtime.messages.extension = 'broadcast' and realtime.messages.event = 'pulse')) and exists (
          select 1 from public.dou_session_participants p
          where p.session_id = s.id and p.user_id = (select auth.uid()) and p.removed_at is null
        ))
      )
  ) and realtime.messages.extension in ('broadcast', 'presence')
);
