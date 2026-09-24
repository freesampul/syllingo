-- Mirrors the migration applied through Supabase MCP on 2026-09-23.
alter table public.study_settings add column complexity text not null default 'focused'
 check (complexity in ('focused','connected','worksheet'));
