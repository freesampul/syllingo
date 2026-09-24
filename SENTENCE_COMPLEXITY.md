# Sentence complexity

Sentence practice offers Focused (one meaningful pattern), Connected (two), and Worksheet (two–three with layered clauses/context). Existing accounts and requests default to Focused. Save practice preferences persists the choice in study_settings; each exercise also stores its complexity and audited target list in its existing content JSON. Older exercises retain single-target grading.

The primary focus still comes from the selected chapter/pattern. Supporting grammar comes from that chapter and earlier Genki chapters (all Genki for the Hiyaku pilot). Vocabulary chapter coverage remains a separate control. Existing vocabulary surface matching, kanji checks, two-attempt limit, and AI usage reservation remain in place. The same model is used.

The generator receives level-specific requirements. A second AI call reviews actual grammar IDs, naturalness, translation and structural complexity. The server rejects absent primary targets, unknown/duplicate-inflated pattern counts, and insufficient complexity. Grammar classification is AI-reviewed, not a formal proof. The answer tutor evaluates every requested pattern for Japanese production and meaning for English comprehension.

Calibration used the user-supplied Chapter 1 and review worksheets: reported decisions/reasons, embedded questions, nominalized activities, noun-modifying clauses, and time clauses around requests. Source PDFs are not uploaded or committed. No worksheet vocabulary is automatically added to the library.

Validation: eight automated tests cover defaults, invalid settings, grammar boundaries, insufficient complexity rejection, both translation directions, account preference round trips, multi-pattern grading, legacy exercises, and database/account isolation. TypeScript and Cloudflare builds pass. Bounded live AI trials were used to strengthen Worksheet requirements after early examples were too simple. A final passing example combines にとって, ので, and a noun-modifying clause: school study time increasing makes daily study at home difficult. Live tests used isolated in-memory storage, not student practice records.

Database change: migration sentence_complexity applied using Supabase MCP; local SQL mirrors its returned version 20260923232054. Verified the column/default in production. Existing row policies and permissions are unchanged. Security advisor notices concern existing server-only tables, the platform rls_auto_enable function, and password protection; this change adds no new roles, tables, or access.
