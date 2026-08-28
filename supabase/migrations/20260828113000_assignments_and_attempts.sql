-- Student-paced assignments, attempts and teacher-owned accommodations.

create table if not exists public.dou_assignments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.dou_courses(id) on delete cascade,
  activity_id uuid not null references public.dou_activities(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  max_attempts smallint not null default 1 check (max_attempts between 1 and 3),
  feedback_mode text not null default 'after_due'
    check (feedback_mode in ('after_question', 'after_submit', 'after_due')),
  shuffle boolean not null default true,
  retry_wrong boolean not null default false,
  show_leaderboard boolean not null default false,
  apply_support_profiles boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dou_assignment_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.dou_assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_no smallint not null check (attempt_no between 1 and 3),
  answers jsonb not null default '[]'::jsonb,
  score integer not null default 0 check (score >= 0),
  progress smallint not null default 0 check (progress between 0 and 100),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique(assignment_id, user_id, attempt_no)
);

create index if not exists dou_assignments_owner_idx
  on public.dou_assignments(owner_id, status, due_at);
create index if not exists dou_assignment_attempts_user_idx
  on public.dou_assignment_attempts(user_id, assignment_id);

alter table public.dou_assignments enable row level security;
alter table public.dou_assignment_attempts enable row level security;

grant select, insert, update, delete on public.dou_assignments to authenticated;
grant select, insert, update on public.dou_assignment_attempts to authenticated;

drop policy if exists assignment_owner_manage on public.dou_assignments;
create policy assignment_owner_manage on public.dou_assignments for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists students_read_published_assignments on public.dou_assignments;
create policy students_read_published_assignments on public.dou_assignments for select to authenticated
using (status = 'published');

drop policy if exists students_manage_own_attempts on public.dou_assignment_attempts;
create policy students_manage_own_attempts on public.dou_assignment_attempts for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.dou_assignments a
    where a.id = assignment_id
      and a.status = 'published'
      and (a.due_at is null or a.due_at > now())
  )
);

drop policy if exists assignment_owner_reads_attempts on public.dou_assignment_attempts;
create policy assignment_owner_reads_attempts on public.dou_assignment_attempts for select to authenticated
using (
  exists (
    select 1 from public.dou_assignments a
    where a.id = assignment_id and a.owner_id = (select auth.uid())
  )
);
