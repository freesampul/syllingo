# Accounts rollout

## Current remote setup

A dedicated Free-plan project **Hiyaku Study** was created in the existing organization on September 21, 2026. Project reference: `rmvajfhgdmzoxiuoazmd`. API URL: `https://rmvajfhgdmzoxiuoazmd.supabase.co`. Dashboard: https://supabase.com/dashboard/project/rmvajfhgdmzoxiuoazmd

Automatic RLS is enabled and automatic table exposure is disabled. The migration and seed have **not** been applied yet: dashboard sign-in was interrupted by `ERR_NETWORK_CHANGED`. Google provider setup and app environment configuration are still pending. Reuse this project rather than creating another.

The app now uses Supabase Auth (Google OAuth, PKCE, HTTP-only cookies) and Postgres for account data. All personal and AI endpoints require a verified Supabase user and a course membership. Only the current Japanese class is exposed. The database uses course-scoped keys so future courses do not require a rewrite.

## Connect a Supabase project

1. Apply `supabase/migrations/202609210001_accounts.sql` in a new/dedicated Supabase project.
2. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `APP_ORIGIN` in the ignored local environment and in the host's runtime environment. The secret key must remain server-only. No service key is sent to the browser. The existing OpenAI variables remain unchanged.
3. Set `APP_ORIGIN=http://localhost:3000` locally and the exact HTTPS app origin on the host. Do not use an arbitrary forwarded Host header for OAuth redirects.
4. Run `npm run db:seed`. This inserts the 2,081 bundled entries without overwriting existing edits. Optionally pass a JSON export of the old app's entries as the second argument to `node scripts/seed-course.mjs` on the initial seed. Existing D1 content and personal reviews are untouched. Do not assign legacy shared reviews to arbitrary new users.
5. Configure Google OAuth in Supabase Authentication → Sign In / Providers → Google. Create a Web application OAuth client in Google Auth Platform. Add the exact Supabase callback URL shown in the provider settings as the authorized Google redirect URI; enter the Google client ID and secret directly in Supabase. The app does not need Google API scopes beyond identity/email/profile.
6. In Supabase URL Configuration, set the production Site URL and allow the exact `/auth/callback` paths for the production app and local development. Do not use a broad wildcard in production.
7. Sign in once as the owner. In an administrative SQL session, insert the owner's profile and course membership using that verified `auth.users.id`; set role to `owner`. The app never promotes the first visitor or trusts a role from profile metadata.
8. After verifying Google login and the seeded course, set `courses.enrollment_open=true` for the Hiyaku course. Signed-in users with the app link can then explicitly join as students. This is link-shared enrollment, not a school roster restriction; leave it closed if a stricter invitation flow is wanted.

Course ID: `9a684d50-2772-43bf-9a5b-1d7e0a399153`.

Owner bootstrap (replace the UUID with the verified owner's auth user ID):

```sql
begin;
insert into public.profiles(id,display_name)
select id,coalesce(raw_user_meta_data->>'full_name','Course owner')
from auth.users where id = '<OWNER_AUTH_USER_ID>'::uuid
on conflict(id) do nothing;
insert into public.course_memberships(course_id,user_id,role)
values('9a684d50-2772-43bf-9a5b-1d7e0a399153','<OWNER_AUTH_USER_ID>'::uuid,'owner')
on conflict(course_id,user_id) do update set role='owner';
commit;
```

## Sharing and hosting

The existing hosted Sites app is still private to its owner. Google sign-in inside the app does not change the hosting access policy. Before classmates can reach it, the chosen host must allow them to reach the app and Google callback. Do not share the old hosted URL as if this update were already deployed. The app's own sign-in, membership checks, and database policies protect personal records independently of hosting.

## What is saved

- A private review event with a snapshot of the term, answer (written recall), self-rating, and time.
- Independent recognition and production review schedules per account/course/item.
- Each generated sentence's actual text, vocabulary coverage, grammar target snapshot, direction, and model.
- Every checked translation, feedback, and whether the example was viewed. AI assessment is not labeled as a course grade.
- Account-based practice preferences (saved explicitly) and paginated history with summary counts.

Database RLS restricts personal reads to the owning account, including when a teacher reads through the direct Supabase API. Client-side writes are denied; privileged writes occur only through authenticated server routes. Editing class material requires owner/teacher membership. The Google session is verified via `auth.getUser()`, not trusted from browser-submitted IDs.

Review writes use idempotency IDs and a transactional function. Feedback writes claim an attempt before calling AI and retry failed attempts without duplicating history. A completed attempt is returned on request replay. Daily usage reservations cap each account at 120 AI-call units and the whole app at 2,000 units (UTC); generation reserves four calls and feedback one. Failed generation still consumes the reservation. This controls request volume, not dollar spend; keep the OpenAI project hard spending cap too.

## Verification

`npm run test:accounts` runs the migration against actual embedded Postgres and checks cross-account isolation, mutation permissions, course enrollment, distinct skill progress, retry idempotency, ownership foreign keys, private summary counts, and daily usage limits. `npx tsc --noEmit` checks the app integration. The production build must pass before deployment.

Live OAuth sign-in, session refresh, real database persistence across devices, and hosted cookie behavior must also be verified after project/provider configuration. Those cannot be claimed from a local schema test.
