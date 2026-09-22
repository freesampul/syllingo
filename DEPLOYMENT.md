# Independent Cloudflare deployment

Status (2026-09-22): deployed to `https://syllingo.1sammpjp.workers.dev` in the owner's Cloudflare account. The four connection secrets are installed. Homepage and account configuration return HTTP 200, and sign-in redirects to the existing Supabase provider. Domain cutover, a complete production sign-in/practice test, and GitHub connection remain pending. The existing Sites deployment is retained during migration.

## Build and deploy

1. Connect GitHub and create a private `syllingo` repository. Review tracked files and history for credentials before pushing.
2. Sign in to Cloudflare on the Free Workers plan.
3. Build with `npm ci && npm run build:cloudflare`.
4. Upload with `npx wrangler deploy --config dist/server/wrangler.json`.
5. Set Worker secrets through the dashboard or secure stdin: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `OPENAI_API_KEY`. Do not paste them in shell commands or commit them. The build already sets `APP_ORIGIN=https://syllingo.com` and `OPENAI_MODEL=gpt-5.4-mini`.
6. For Git-connected deployments, use build command `npm run build:cloudflare` and deploy command `npx wrangler deploy --config dist/server/wrangler.json`.

## Domain and acceptance checks

Cloudflare Workers Custom Domains require an active Cloudflare DNS zone. Add syllingo.com to Cloudflare on the Free plan, preserve required DNS records, and update the Namecheap nameservers to the exact pair assigned to that zone. Namecheap remains the registrar.

Only switch the domain after the independent Worker and its secrets are ready. Attach `syllingo.com` as the Worker's Custom Domain. Configure `www` separately if desired; it is not implicitly covered.

Supabase already allows `https://syllingo.com/auth/callback`. Its Google provider callback remains the Supabase URL, so changing the web host does not require replacing Google credentials.

Verify the production homepage, Google sign-in, course joining, sentence generation, feedback, saved history after reload, and separation between student accounts. Check CPU usage against Free-plan limits. Keep the old deployment until these checks pass.

## Costs

Start with Workers Free and Supabase Free. OpenAI usage remains separately billed. Do not enable a paid plan or automatic credit replenishment as part of deployment. App daily request limits are not lifetime dollar caps.
