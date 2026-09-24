# Product feedback

The `/feedback` form is live. Signed-in users can submit ideas, bugs, practice feedback, or other notes. Messages are stored in `public.product_feedback` in Supabase. Use the project's Table Editor to review them; client users cannot read submissions. The account ID is stored; an email is copied only with explicit reply consent.

The server-only `submit_product_feedback` function serializes submissions per user, allows ten messages per rolling 24 hours, and makes retries with the same submission ID idempotent. Messages are limited to 3,000 characters. No AI calls or paid notification service are used.

`supabase/feedback-setup.sql` was applied through SQL Editor on 2026-09-22 after local PGlite privacy/rate-limit tests passed. It is a one-off setup, not a CLI-recorded migration; do not rerun it. The available CLI failed trying to create its global configuration directory, so SQL Editor was used.

Email forwarding is separate from in-app submissions. Cloudflare mail DNS replaced the five old Namecheap MX records and old SPF record on 2026-09-22. The `help@syllingo.com` rule forwards to `baconsamp@gmail.com` and is enabled, and the destination was confirmed Verified in Cloudflare. In-app submissions do not currently send email notifications.
