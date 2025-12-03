# Breeding Cycle Completion Feature

## Overview

This feature adds proper tracking and management of AI breeding cycles, allowing users to signal when all AI doses are complete and ready for pregnancy check countdown.

## Problem Solved

**Before**: AI breeding had no clear "done" signal
- Users could keep adding AI doses indefinitely
- Pregnancy check countdown started from first dose, even if doses continued for 3+ days
- No way to distinguish "still dosing" from "ready for pregnancy check"

**After**: Clear breeding cycle completion workflow
- Manual "Complete Breeding" button for immediate control
- Auto-complete after 2 days of no new doses
- Pregnancy check countdown always from first dose (consistent with natural breeding)

---

## Database Changes

### New Columns on `breeding_attempts` table:

```sql
- breeding_cycle_complete (BOOLEAN, DEFAULT FALSE)
  -- TRUE when all AI doses complete and ready for pregnancy check

- breeding_cycle_completed_at (TIMESTAMP WITH TIME ZONE, NULL)
  -- When breeding cycle was marked complete (manual or auto)

- last_dose_date (DATE)
  -- Date of the last AI dose (updated automatically)
```

### Migrations to Run:

1. **`add-breeding-cycle-completion.sql`** - Adds new columns and auto-completes existing records
2. **`update-sow-list-view-add-cycle-complete.sql`** - Updates the optimized view to include new field

**IMPORTANT**: Run migrations in this order before deploying code changes.

---

## How It Works

### Natural Breeding:
- Automatically marked `breeding_cycle_complete = TRUE` on creation
- No "Complete Breeding" button shown (not needed)
- Pregnancy check countdown starts immediately from breeding date

### AI Breeding:

**Initial Breeding**:
- `breeding_cycle_complete = FALSE` (default)
- `last_dose_date` = breeding_date
- Shows both "AI Dose" and "Complete Breeding" buttons

**Adding Follow-up Doses**:
- Updates `last_dose_date` to the new dose date
- Resets auto-complete timer (2 days from last dose)
- Still shows both buttons

**Manual Completion** (user clicks "Complete Breeding"):
- Sets `breeding_cycle_complete = TRUE`
- Sets `breeding_cycle_completed_at = NOW()`
- Hides both "AI Dose" and "Complete Breeding" buttons
- Pregnancy check countdown proceeds from first dose

**Auto-Completion** (2 days after last dose):
- Migration handles this via database update
- Same effect as manual completion
- Runs on database side (no UI action needed)

---

## UI Changes

### Sows List Page

**Before**:
```
[Bred sow with AI method]
  Buttons: [AI Dose] [Preg Check] [Details] [Housing]
```

**After**:
```
[Bred sow with AI method - INCOMPLETE cycle]
  Buttons: [AI Dose] [Complete Breeding] [Preg Check] [Details] [Housing]

[Bred sow with AI method - COMPLETE cycle]
  Buttons: [Preg Check] [Details] [Housing]
  (AI Dose and Complete Breeding hidden)
```

Button Colors:
- **AI Dose**: Purple (`bg-purple-600`)
- **Complete Breeding**: Green outline (`border-green-600 text-green-700`)

---

## Code Changes

### Files Modified:

1. **`app/sows/page.tsx`**
   - Added `handleCompleteBreedingCycle()` function
   - Added `breeding_cycle_complete` to Sow type
   - Conditional rendering of buttons based on cycle completion
   - Button only shows if: `sow.current_breeding_method === 'ai' && !sow.breeding_cycle_complete`

2. **`components/RecordBreedingForm.tsx`**
   - Sets `breeding_cycle_complete = true` for natural breedings
   - Sets `breeding_cycle_complete = false` for AI breedings
   - Sets `last_dose_date = breeding_date` for all

3. **`components/BulkBreedingForm.tsx`**
   - Same logic as RecordBreedingForm for bulk operations

4. **`components/AIDoseModal.tsx`**
   - Updates `last_dose_date` after recording each AI dose
   - Resets auto-complete timer

5. **`database/add-breeding-cycle-completion.sql`** (NEW)
   - Migration to add columns
   - Auto-complete existing old AI breedings

6. **`database/update-sow-list-view-add-cycle-complete.sql`** (NEW)
   - Updates optimized view to include `breeding_cycle_complete`

---

## Testing Checklist

### Test 1: Natural Breeding
- [ ] Record a natural breeding
- [ ] Verify "Complete Breeding" button does NOT show
- [ ] Verify pregnancy check countdown starts immediately

### Test 2: AI Breeding - Manual Completion
- [ ] Record an AI breeding
- [ ] Verify both "AI Dose" and "Complete Breeding" buttons appear
- [ ] Click "Complete Breeding"
- [ ] Verify both buttons disappear
- [ ] Verify toast: "Breeding cycle marked complete..."

### Test 3: AI Breeding - Follow-up Doses
- [ ] Record an AI breeding
- [ ] Add 2-3 follow-up doses
- [ ] Verify "AI Dose" button still shows after each dose
- [ ] Verify last_dose_date updates in database

### Test 4: Bulk Breeding
- [ ] Select 5 sows
- [ ] Record bulk AI breeding
- [ ] Verify all 5 show "Complete Breeding" button
- [ ] Complete one manually
- [ ] Verify only that one hides the buttons

### Test 5: Auto-Complete (Database Migration)
- [ ] Create AI breeding, don't complete
- [ ] Manually set last_dose_date to 3 days ago in database
- [ ] Run migration
- [ ] Verify breeding_cycle_complete set to TRUE
- [ ] Verify UI no longer shows buttons

---

## Migration Instructions

### Option 1: Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy contents of `add-breeding-cycle-completion.sql`
4. Run query
5. Verify success notice appears
6. Repeat for `update-sow-list-view-add-cycle-complete.sql`

### Option 2: Using psql CLI

```bash
psql $DATABASE_URL < database/add-breeding-cycle-completion.sql
psql $DATABASE_URL < database/update-sow-list-view-add-cycle-complete.sql
```

### Option 3: Using Supabase CLI

```bash
supabase db push --db-url $DATABASE_URL
```

---

## Auto-Complete Logic (Future Enhancement)

The migration includes auto-complete logic for existing records, but ongoing auto-completion can be implemented via:

**Option A**: Daily cron job
```sql
UPDATE breeding_attempts
SET
  breeding_cycle_complete = TRUE,
  breeding_cycle_completed_at = NOW()
WHERE breeding_method = 'ai'
  AND breeding_cycle_complete = FALSE
  AND last_dose_date < CURRENT_DATE - INTERVAL '2 days';
```

**Option B**: Database trigger
```sql
CREATE OR REPLACE FUNCTION auto_complete_breeding_cycles()
RETURNS void AS $$
BEGIN
  -- Same UPDATE query as above
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron extension
SELECT cron.schedule('auto-complete-breeding', '0 2 * * *',
  'SELECT auto_complete_breeding_cycles()');
```

**Option C**: Application-level check on page load
- Check on sow list page render
- Update any stale breeding cycles
- Currently NOT implemented (migrations handle historical data)

---

## Benefits

1. **User Control**: Manual button gives immediate feedback
2. **Automatic Fallback**: Auto-complete after 2 days prevents forgotten records
3. **Consistent Countdown**: Pregnancy check always from first dose (18-21 days)
4. **Better UX**: Clear visual state (buttons shown/hidden based on status)
5. **Data Integrity**: Tracks exactly when breeding cycle was completed

---

## Questions?

- Why 2 days for auto-complete? Most AI protocols dose every 12-24 hours. 2 days ensures no false auto-completes.
- Why from first dose? Industry standard - pregnancy is determined from insemination date, not last dose.
- Can users re-open a completed cycle? No - once complete, you'd mark as "return to heat" and start fresh breeding.
