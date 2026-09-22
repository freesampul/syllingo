-- One-off SQL Editor setup. CLI is unavailable in this environment.
begin;
create table public.product_feedback (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('idea','bug','content','other')),
 message text not null check(char_length(message) between 10 and 3000),
 reply_email text,
 created_at timestamptz not null default now()
);
create index product_feedback_user_created on public.product_feedback(user_id,created_at);
alter table public.product_feedback enable row level security;
revoke all on public.product_feedback from public,anon,authenticated;
grant select,insert on public.product_feedback to service_role;
create function public.submit_product_feedback(p_id uuid,p_user uuid,p_kind text,p_message text,p_email text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('product-feedback:'||p_user::text,0));
 if exists(select 1 from public.product_feedback where id=p_id and user_id=p_user) then return true; end if;
 if (select count(*) from public.product_feedback where user_id=p_user and created_at>=now()-interval '24 hours')>=10 then return false; end if;
 insert into public.product_feedback(id,user_id,kind,message,reply_email) values(p_id,p_user,p_kind,p_message,p_email);
 return true;
end;
$$;
revoke all on function public.submit_product_feedback(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.submit_product_feedback(uuid,uuid,text,text,text) to service_role;
commit;
