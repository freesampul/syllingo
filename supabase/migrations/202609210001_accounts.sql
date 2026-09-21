-- Account data lives in Postgres. Existing D1 tables remain untouched for backup.
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '', created_at timestamptz not null default now()
);
create table public.courses (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 title text not null, language_code text not null, enrollment_open boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.course_memberships (
 course_id uuid not null references public.courses on delete cascade,
 user_id uuid not null references public.profiles on delete cascade,
 role text not null default 'student' check (role in ('owner','teacher','student')),
 joined_at timestamptz not null default now(), primary key(course_id,user_id)
);
create index memberships_user on public.course_memberships(user_id,course_id);
create table public.course_units (
 course_id uuid not null references public.courses on delete cascade, id text not null,
 title text not null, position integer not null, primary key(course_id,id)
);
create table public.learning_items (
 course_id uuid not null references public.courses on delete cascade, id text not null,
 unit_id text not null, kind text not null check(kind in ('vocabulary','kanji','grammar')),
 data jsonb not null check(jsonb_typeof(data)='object'), revision integer not null default 1,
 updated_at timestamptz not null default now(), primary key(course_id,id),
 foreign key(course_id,unit_id) references public.course_units(course_id,id),
 check(data->>'id'=id and data->>'kind'=kind and data->>'lesson'=unit_id)
);
create table public.study_settings (
 course_id uuid not null, user_id uuid not null,
 genki_through integer not null default 23 check(genki_through between 1 and 23),
 include_hiyaku boolean not null default true, grammar_group text not null default 'hiyaku-1',
 target text not null default 'mixed', direction text not null default 'en-ja' check(direction in ('en-ja','ja-en')),
 updated_at timestamptz not null default now(), primary key(course_id,user_id),
 foreign key(course_id,user_id) references public.course_memberships on delete cascade
);
create table public.item_progress (
 course_id uuid not null, user_id uuid not null, item_id text not null,
 skill text not null check(skill in ('recognition','production')),
 due_at timestamptz not null, interval_days integer not null check(interval_days between 0 and 90),
 review_count integer not null default 0 check(review_count>=0), last_reviewed_at timestamptz not null,
 primary key(course_id,user_id,item_id,skill),
 foreign key(course_id,user_id) references public.course_memberships on delete cascade,
 foreign key(course_id,item_id) references public.learning_items
);
create index progress_due on public.item_progress(user_id,course_id,skill,due_at);
create table public.review_events (
 id uuid primary key, course_id uuid not null, user_id uuid not null, item_id text not null,
 skill text not null check(skill in ('recognition','production')),
 rating text not null check(rating in ('again','hard','good')),
 answer text check(length(answer)<=2000), item_snapshot jsonb not null,
 result jsonb not null, created_at timestamptz not null default now(),
 foreign key(course_id,user_id) references public.course_memberships on delete cascade,
 foreign key(course_id,item_id) references public.learning_items
);
create index review_history on public.review_events(user_id,course_id,created_at desc);
create table public.practice_exercises (
 id uuid primary key default gen_random_uuid(), course_id uuid not null, user_id uuid not null,
 target_id text not null, direction text not null check(direction in ('en-ja','ja-en')),
 content jsonb not null, model text not null, created_at timestamptz not null default now(),
 unique(id,course_id,user_id),
 foreign key(course_id,user_id) references public.course_memberships on delete cascade,
 foreign key(course_id,target_id) references public.learning_items
);
create index exercise_history on public.practice_exercises(user_id,course_id,created_at desc);
create table public.practice_attempts (
 id uuid primary key, course_id uuid not null, user_id uuid not null, exercise_id uuid not null,
 answer text not null check(length(answer) between 1 and 2000),
 assisted boolean not null default false,
 status text not null check(status in ('pending','complete','failed')),
 feedback jsonb, created_at timestamptz not null default now(), completed_at timestamptz,
 foreign key(exercise_id,course_id,user_id) references public.practice_exercises(id,course_id,user_id) on delete cascade,
 check(status<>'complete' or (feedback is not null and feedback->>'verdict' in ('correct','partly_correct','try_again')))
);
create index attempt_history on public.practice_attempts(user_id,course_id,created_at desc);
create table public.ai_daily_usage (
 day date not null, bucket text not null, units integer not null check(units>=0), primary key(day,bucket)
);

-- Only authenticated members can read course material. Personal records are private.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create function private.is_course_member(p_course uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.course_memberships where course_id=p_course and user_id=(select auth.uid()));
$$;
revoke all on function private.is_course_member(uuid) from public,anon;
grant execute on function private.is_course_member(uuid) to authenticated;
do $$ declare t text; begin
 foreach t in array array['profiles','courses','course_memberships','course_units','learning_items','study_settings','item_progress','review_events','practice_exercises','practice_attempts','ai_daily_usage'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant select on public.profiles,public.courses,public.course_memberships,public.course_units,public.learning_items,public.study_settings,public.item_progress,public.review_events,public.practice_exercises,public.practice_attempts to authenticated;
create policy own_profile on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy own_membership on public.course_memberships for select to authenticated using(user_id=(select auth.uid()));
create policy member_course on public.courses for select to authenticated using(private.is_course_member(id));
create policy member_units on public.course_units for select to authenticated using(private.is_course_member(course_id));
create policy member_items on public.learning_items for select to authenticated using(private.is_course_member(course_id));
do $$ declare t text; begin
 foreach t in array array['study_settings','item_progress','review_events','practice_exercises','practice_attempts'] loop
 execute format('create policy own_records on public.%I for select to authenticated using (user_id=(select auth.uid()) and private.is_course_member(course_id))',t);
 end loop;
end $$;

-- Privileged mutations are only callable by the app backend after auth.getUser().
create function public.join_hiyaku_course(p_user uuid,p_name text default 'Student') returns boolean language plpgsql security invoker set search_path='' as $$
declare c constant uuid := '9a684d50-2772-43bf-9a5b-1d7e0a399153'; begin
 if not exists(select 1 from public.courses where id=c and enrollment_open) then return false; end if;
 insert into public.profiles(id,display_name) values(p_user,left(coalesce(p_name,'Student'),120)) on conflict(id) do nothing;
 insert into public.course_memberships(course_id,user_id) values(c,p_user) on conflict do nothing;
 insert into public.study_settings(course_id,user_id) values(c,p_user) on conflict do nothing;
 return true;
end $$;
create function public.reserve_ai_usage(p_user uuid,p_course uuid,p_units integer) returns boolean language plpgsql security invoker set search_path='' as $$
declare d date := (now() at time zone 'UTC')::date; total integer; personal integer; begin
 if p_units not between 1 and 4 or not exists(select 1 from public.course_memberships where course_id=p_course and user_id=p_user) then return false; end if;
 -- One global lock prevents races between requests and between per-user/global limits.
 perform pg_advisory_xact_lock(842761);
 select units into total from public.ai_daily_usage where day=d and bucket='global';
 select units into personal from public.ai_daily_usage where day=d and bucket=p_user::text;
 if coalesce(total,0)+p_units>2000 or coalesce(personal,0)+p_units>120 then return false; end if;
 insert into public.ai_daily_usage(day,bucket,units) values(d,'global',p_units),(d,p_user::text,p_units)
 on conflict(day,bucket) do update set units=public.ai_daily_usage.units+excluded.units;
 return true;
end $$;
create function public.record_review(p_event uuid,p_user uuid,p_course uuid,p_item text,p_skill text,p_rating text,p_answer text)
 returns jsonb language plpgsql security invoker set search_path='' as $$
declare old public.item_progress; event public.review_events; item jsonb; days integer; due timestamptz; result jsonb; begin
 if p_skill not in ('recognition','production') or p_rating not in ('again','hard','good') or length(p_answer)>2000 then raise exception 'Invalid review'; end if;
 if not exists(select 1 from public.course_memberships where course_id=p_course and user_id=p_user) then raise exception 'Not a course member'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_course::text||p_item||p_skill,0));
 select * into event from public.review_events where id=p_event;
 if found then
 if event.user_id<>p_user or event.course_id<>p_course or event.item_id<>p_item or event.skill<>p_skill or event.rating<>p_rating or event.answer is distinct from p_answer then raise exception 'Review identifier conflict'; end if;
 return event.result;
 end if;
 select data into item from public.learning_items where course_id=p_course and id=p_item;
 if not found then raise exception 'Unknown item'; end if;
 select * into old from public.item_progress where course_id=p_course and user_id=p_user and item_id=p_item and skill=p_skill;
 days:=case when p_rating='again' then 0 when p_rating='hard' then 1 else least(90,greatest(1,coalesce(old.interval_days,0)*2)) end;
 due:=now()+case when days=0 then interval '10 minutes' else days*interval '1 day' end;
 result:=jsonb_build_object('id',p_item,'days',days,'due',floor(extract(epoch from due)*1000),'reviews',coalesce(old.review_count,0)+1);
 insert into public.item_progress(course_id,user_id,item_id,skill,due_at,interval_days,review_count,last_reviewed_at)
 values(p_course,p_user,p_item,p_skill,due,days,coalesce(old.review_count,0)+1,now())
 on conflict(course_id,user_id,item_id,skill) do update set due_at=excluded.due_at,interval_days=excluded.interval_days,review_count=excluded.review_count,last_reviewed_at=excluded.last_reviewed_at;
 insert into public.review_events(id,course_id,user_id,item_id,skill,rating,answer,item_snapshot,result) values(p_event,p_course,p_user,p_item,p_skill,p_rating,p_answer,item,result);
 return result;
end $$;
create function public.practice_summary(p_course uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'reviews',(select count(*) from public.review_events where course_id=p_course),
 'itemsStudied',(select count(distinct item_id) from public.item_progress where course_id=p_course),
 'sentenceAttempts',(select count(*) from public.practice_attempts where course_id=p_course and status='complete'),
 'correctUnassisted',(select count(*) from public.practice_attempts where course_id=p_course and status='complete' and not assisted and feedback->>'verdict'='correct'),
 'unassistedAttempts',(select count(*) from public.practice_attempts where course_id=p_course and status='complete' and not assisted),
 'activeDays',(select count(distinct (created_at at time zone 'UTC')::date) from (select created_at from public.review_events where course_id=p_course union all select created_at from public.practice_attempts where course_id=p_course and status='complete') activity)
 );
$$;
revoke all on function public.join_hiyaku_course(uuid,text),public.reserve_ai_usage(uuid,uuid,integer),public.record_review(uuid,uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.join_hiyaku_course(uuid,text),public.reserve_ai_usage(uuid,uuid,integer),public.record_review(uuid,uuid,uuid,text,text,text,text) to service_role;
revoke all on function public.practice_summary(uuid) from public,anon;
grant execute on function public.practice_summary(uuid) to authenticated;
create function public.save_course_items(p_course uuid,p_items jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare item jsonb; begin
 for item in select value from jsonb_array_elements(p_items) loop
 insert into public.course_units(course_id,id,title,position) values(p_course,item->>'lesson',item->>'lesson',1000) on conflict do nothing;
 insert into public.learning_items(course_id,id,unit_id,kind,data) values(p_course,item->>'id',item->>'lesson',item->>'kind',item)
 on conflict(course_id,id) do update set unit_id=excluded.unit_id,kind=excluded.kind,data=excluded.data,revision=public.learning_items.revision+1,updated_at=now();
 end loop;
end $$;
revoke all on function public.save_course_items(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_course_items(uuid,jsonb) to service_role;
