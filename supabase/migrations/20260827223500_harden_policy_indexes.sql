create index if not exists dou_responses_user_idx
  on public.dou_responses(user_id, session_id);

drop policy if exists owners_manage_sessions on public.dou_sessions;
drop policy if exists participants_read_session on public.dou_sessions;

create policy session_read_access on public.dou_sessions for select
to authenticated using (
  owner_id = (select auth.uid()) or exists (
    select 1 from public.dou_session_participants p
    where p.session_id = id and p.user_id = (select auth.uid()) and p.removed_at is null
  )
);
create policy session_owner_insert on public.dou_sessions for insert
to authenticated with check (owner_id = (select auth.uid()));
create policy session_owner_update on public.dou_sessions for update
to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
create policy session_owner_delete on public.dou_sessions for delete
to authenticated using (owner_id = (select auth.uid()));
