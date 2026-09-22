# Syllingo

Language practice built around what your class has actually covered.

The first pilot supports Hiyaku Chapter 1 and Genki I–II: a searchable study library, flashcard review, English/Japanese sentence translation, and feedback scoped to selected vocabulary and grammar. Students sign in with Google and keep individual practice histories. Listening is planned.

## Architecture

- React and Vinext on Cloudflare Workers
- Supabase Postgres and Google authentication
- Server-side OpenAI sentence generation and feedback
- Course memberships, private progress, and row-level database security

## Local development

Use Node 22.13 or newer. Run `npm ci`, copy `.env.example` to `.env.local`, fill in your own connection values, then run `npm run dev`.

Never commit API keys, `.env.local`, or database exports containing student data.

## Validation

Run `npx tsc --noEmit`, `npm run test:accounts`, and `npm run build:cloudflare`.

## Independent hosting

See [DEPLOYMENT.md](DEPLOYMENT.md). The independent build excludes the Sites plugin and does not require the legacy D1 database. Existing accounts and progress stay in Supabase.

## Pilot scope

This repository includes course study data. Keep the deployment repository private for now; a public portfolio edition can show the code and product story with an appropriate sample dataset.
