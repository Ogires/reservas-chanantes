# Deviations from the MVP Implementation Plan

This document records everything done during implementation that was NOT in the original plan (`2026-02-20-mvp-supabase-admin-booking.md`).

---

## 1. Plan saved as a document

The plan itself was not a persisted file. During implementation it was saved to `docs/plans/2026-02-20-mvp-supabase-admin-booking.md` at the user's request.

---

## 2. Supabase CLI setup and migration

**Plan said:** Create `supabase/schema.sql` as a reference file, user runs it manually in the Supabase SQL editor.

**What we did instead:**
- Ran `npx supabase init` to initialize the CLI project (created `supabase/config.toml`)
- Ran `npx supabase migration new initial_schema` to create a proper migration file at `supabase/migrations/20260220221052_initial_schema.sql`
- Copied the schema SQL into the migration file
- User linked the project with `npx supabase link` and ran `npx supabase db push`

**Commit:** `b36e679 chore: add Supabase CLI config and initial migration`

**New files not in plan:**
- `supabase/config.toml`
- `supabase/migrations/20260220221052_initial_schema.sql`

---

## 3. Supabase email confirmation disabled

**Plan assumed:** `signUp` would create a session immediately, allowing the subsequent tenant insert to pass RLS.

**What happened:** Supabase's default config requires email confirmation. After `signUp`, no session is established, so `auth.uid()` is null and the RLS policy `auth.uid() = owner_id` blocks the tenant INSERT.

**Fix:** User disabled "Confirm email" in Supabase Dashboard > Authentication > Providers > Email. No code change was needed — this is a Supabase project configuration.

**Documented in:** README.md setup instructions (step 4).

---

## 4. `revalidatePath` added after code review

**Plan did not include** cache invalidation after mutations.

**Issue found during review:** According to the Next.js 16 docs, `redirect()` alone does not invalidate the Router Cache or Full Route Cache. After creating/editing/deleting a service or saving a schedule, the list pages could show stale data from cache.

**Fix:** Added `revalidatePath()` calls before `redirect()` in:
- `src/app/admin/(dashboard)/services/actions.ts` — after save and delete
- `src/app/admin/(dashboard)/schedule/actions.ts` — after save

**Commit:** `4aa05a5 fix(admin): add revalidatePath after mutations to prevent stale cache`

---

## 5. README rewrite

**Plan did not include** any README changes.

**What we did:** Replaced the default Create Next App README with a full project description covering features, tech stack, architecture, setup guide, and project structure.

**Commit:** `4ef0717 docs: rewrite README with project description and setup guide`

---

## 6. Git remote setup and branch naming

**Plan said:** `git commit` for each task. Did not cover remote setup or deployment.

**What we did:**
1. Added remote: `git remote add origin https://github.com/Ogires/reservas-chanantes.git`
2. Initial push went to `master` branch (git default)
3. Vercel was listening on `main`, so renamed: `git branch -m master main`
4. Force-pushed to `main` to overwrite GitHub's initial commit (README-only)

---

## 7. Vercel deployment troubleshooting

**Plan did not cover** deployment at all.

**Issues encountered:**
1. **Port 3000 occupied** during local smoke test — another app was running. Used port 3001 instead.
2. **Framework Preset = "Other"** in Vercel — Vercel did not auto-detect Next.js, causing a 23-second "build" that produced no output (all routes → 404). Fix: changed Framework Preset to "Next.js" in Vercel Settings > Build and Deployment, then redeployed.

---

## 8. Smoke test performed with Playwright

**Plan said:** Manual smoke test (step-by-step instructions for the user).

**What we did:** Automated the full smoke test using Playwright browser tools:
1. Landing page → verified title and links
2. Register → created "Peluquería Test" account (hit RLS error first, fixed via email confirmation toggle, then succeeded)
3. Dashboard → verified cards showing 0 services, 0 bookings
4. Services → created "Corte de pelo" (30 min, 15 EUR)
5. Schedule → enabled Monday-Friday 09:00-17:00, saved successfully
6. Public page `/peluqueria-test` → selected service, picked date 2026-02-23
7. Slot picker → 16 available 30-min slots displayed, selected 10:00
8. Booking form → entered "Ana García" / ana.garcia@gmail.com → "Booking confirmed!"
9. Dashboard → verified Active services: 1

All steps passed.

---

## Summary

| Deviation | Type | Impact |
|-----------|------|--------|
| Plan saved as document | Process | None (documentation only) |
| Supabase CLI migration | Infrastructure | Better DX, version-controlled migrations |
| Email confirmation disabled | Configuration | Required for registration to work |
| `revalidatePath` added | Bug fix | Prevents stale cache after mutations |
| README rewrite | Documentation | Professional project presentation |
| Branch rename master→main | Git | Required for Vercel deployment |
| Vercel framework preset fix | Deployment | Required for Vercel to build Next.js |
| Playwright smoke test | QA | Automated verification of full flow |
