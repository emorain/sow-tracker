# Sow Tracker — Deep Audit & Revamp Plan

**Audit date:** 2026-07-02
**Scope:** Full codebase (~35,500 LOC), 43 migrations, all workflows
**Method:** 4 parallel deep audits — architecture, database, UX/workflow, correctness — plus clean TypeScript typecheck (0 errors)

---

## Executive Summary

The app **works** and compiles clean, but it grew by accretion: the same features were built 2–3 different ways in different places, the primary workflows are scattered across 34 routes and 35 modals, and several real bugs are corrupting or hiding production data right now. The revamp should proceed in three phases: **(P0) stop the bleeding, (P1) make the data layer trustworthy, (P2) rebuild the UX around daily work.**

---

## P0 — Broken right now (fix before anything else)

| # | Bug | Impact | Where |
|---|-----|--------|-------|
| 1 | `EditFarrowingModal` writes non-existent column `mummies` (DB column is `mummified`) | **Every farrowing edit fails.** Active Farrowings page also always displays 0 mummified | `components/EditFarrowingModal.tsx:72,50,161` · `app/farrowings/active/page.tsx:44,162,487` |
| 2 | CSV import inserts sows/farrowings with **no `organization_id`** | Imported sows are invisible in all org-scoped views — a 200-sow import vanishes | `app/sows/import/page.tsx:434-531` |
| 3 | Bulk breeding creates a farrowing at breeding time; pregnancy check creates a **second** one. Single breeding creates none | Duplicate farrowings, double-counted litters/calendar. Single vs bulk paths disagree | `components/BulkBreedingForm.tsx:240-254` vs `RecordBreedingForm.tsx:218` vs `PregnancyCheckModal.tsx:66-82` |
| 4 | `WeanLitterModal` fallback path creates piglets with no `organization_id` | Weaned piglets invisible/undeletable in org views | `components/WeanLitterModal.tsx:255-268` |
| 5 | `PregnancyCheckModal` hardcodes `breeding_method: 'natural'` | AI-bred litters get wrong provenance on pedigree | `components/PregnancyCheckModal.tsx:74` |
| 6 | Frontend `result` type unions missing `'farrowed'` (added to DB in May) | Post-farrowing records carry a status the UI doesn't handle | `components/EditBreedingModal.tsx:21` · `components/SowDetailModal.tsx:100` |
| 7 | Pending migration `20260303000003` is numbered **before** already-applied `000004` and was applied by hand (not in migration history) | Future `supabase db push` errors out; rebuilt DBs lose `sire_name`/`dam_name` (genetics-disappear bug returns) | Renumber → `20260303000005`, commit |
| 8 | **Migration chain cannot rebuild the database** — baseline file is 0 bytes; core tables (`sows`, `boars`, `breeding_attempts`, `farrowings`, `piglets`, …) are never created in any migration | Production DB is the only copy of the real schema. No disaster recovery, no fresh envs | Dump live schema (`supabase db dump --schema public`) into a real baseline migration |

---

## P1 — Data-layer trust (reliability & integrity)

1. **Transactions via Postgres RPCs.** All lifecycle flows are multi-step client-side writes with no rollback — a mid-sequence failure leaves half-weaned litters, orphan farrowings, or duplicate records on retry. Move into `security definer` DB functions: `record_litter()`, `wean_litter()`, `confirm_pregnancy()`, `record_breeding(sow_ids[])`.
   - `RecordLitterForm.tsx:211-269`, `WeanLitterModal.tsx:223-284`, `PregnancyCheckModal.tsx:66-96`, `BulkBreedingForm.tsx:208-254`
2. **Atomic counters.** Straw decrements and ear-notch litter numbers are read-modify-write in JS — concurrent use loses decrements and issues duplicate litter numbers (a legal/traceability field). Do both DB-side (`UPDATE ... SET semen_straws = semen_straws - 1 WHERE semen_straws > 0`, sequence/locked counter for notches).
3. **Correction paths must roll state back.** Return-to-heat and farrowing-delete don't reset `breeding_attempts.result` or restore straws — inventory drifts permanently low, dangling statuses accumulate. `app/sows/page.tsx:445-477`, `SowDetailModal.tsx:560-584`.
4. **Stop swallowing errors.** Straw-decrement, task-generation, and matrix-update failures are console-only. Standardize on a `useAsyncAction` hook + toast.
5. **Date-only handling.** `new Date('YYYY-MM-DD')` parses UTC → off-by-one for US timezones in gestation math (+114d), task due dates, and displays (28 inline day-math sites). Add `lib/format.ts` with safe date-only parse + `daysBetween` + `expectedFarrowingDate`.
6. **Org scoping standardization.** Replace remaining `.eq('user_id', ...)` reads/writes/deletes with `organization_id` (breeding counts, SowDetail piglet delete, boar location-history delete). Add org RLS policies for `protocols`, `protocol_templates`, `matrix_treatment_batches`; reconcile `tasks` vs `scheduled_tasks`.
7. **Resolve `ai_doses` vs `ai_semen_doses`** table-name split (app vs script/migration).
8. **Offline honesty.** PWA claims offline support but writes just fail (background-sync handler is a stub). Either build an IndexedDB write queue or remove the claim.

---

## P2 — UX Revamp (the "harder to use" fix)

### Core moves
1. **"Today" worklist dashboard.** Replace stats-first layout with an action list: sows due to farrow, pregnancy checks due (breeding + 21d), heats expected, incomplete AI cycles, overdue tasks. Stats grid moves below.
2. **Sow detail page (`/sows/[id]`) with tabs** — Overview / Breeding / Farrowings / Health — replacing the 1,904-line `SowDetailModal` and its 4 nested modals. Boar equivalent shares the extracted sections.
3. **One canonical piglet flow.** Single "Add piglets to litter" component; remove the 3-way fork (inline-in-RecordLitter / CreatePigletsModal / inside-WeanModal) that risks double-creation.
4. **Guided breeding cycle.** Replace the AI "remember to complete" trap with explicit cycle status + next-action prompt (and surface incomplete cycles on the Today list).
5. **Navigation by workflow.** Merge redundant surfaces: `/breeding` (orphan) and `/breeding/bred-sows` become Sows filters; the two piglet pages become one with a tab; kill the "Utilities" grab-bag.
6. **Feature toggles.** Finances, Prop 12 compliance, Transfers (currently polling every 30s in the header), Protocols, multi-org — gate behind per-farm settings so unused modules carry zero UI weight.

### Consolidation (shrinks the codebase, prevents regressions)
7. Merge `RecordBreedingForm` + `BulkBreedingForm` (~85% identical) into one form + shared `recordBreeding()` service.
8. Extract shared subsystems used by both detail views: `AnimalPhotoManager`, `HealthRecordsSection`, edit-form hook (~700–900 LOC removed).
9. `lib/format.ts` (dates, age, status colors — kills 4×/5×/13×/28× duplication) and generated Supabase types (kills most of the 161 `any`s).
10. Shared `<Modal>` wrapper replacing 31 hand-rolled overlays; one confirmation modal replacing native `confirm()`.
11. Unify sow/boar list pages (`AnimalListPage` + `useAnimalSelection`); centralize cascade-deletes in `lib/`.

### Cleanup
12. Delete orphaned `lib/types.ts` (contradicts real schema), `InviteUserModal`, `/debug` route (or env-gate).
13. Archive `database/` (95 legacy files incl. contradictory RLS + destructive scripts) to `database/_archive/` after baseline dump; prune one-off `scripts/apply-*` runners.
14. Consolidate the 13 top-level markdown docs into `docs/` (keep README + this plan).

---

## Suggested sequence

1. **Week 1 — P0**: bugs 1–6 are small, surgical fixes; 7–8 are migration hygiene. Ship as one or two commits, verify on prod.
2. **Week 2 — P1**: RPC transactions + atomic counters + correction paths (the foundation the revamp sits on).
3. **Weeks 3+ — P2**: Today dashboard first (highest daily value), then sow detail page, then piglet flow, then consolidation as you touch each area.

---

*Full agent reports available in session transcripts. Findings verified against source at commit `53f5796`.*
