# Breeding Attempt Status Fix

## Problem Description

### The Bug
When a sow is bred, gives birth to a litter, and then gets re-bred again, the system shows her as pregnant immediately after the second breeding. This happens because:

1. **November**: Sow is bred → breeding attempt created with `result = 'pending'`
2. **Pregnancy confirmed**: Breeding attempt updated to `result = 'pregnant'` and farrowing record created
3. **Sow farrows**: Farrowing record updated with `actual_farrowing_date`
4. **Problem**: The old breeding attempt with `result = 'pregnant'` is **never closed**
5. **May**: New breeding is recorded → creates a NEW breeding attempt with `result = 'pending'`
6. **The Issue**: Both breeding attempts match the filter `result IN ('pending', 'pregnant')`:
   - The November breeding still has `result = 'pregnant'` (even though the sow already farrowed)
   - The May breeding has `result = 'pending'`

The query orders by `breeding_date DESC`, so it returns the May breeding (the more recent one), which makes it look like the sow is immediately pregnant again, bypassing the normal AI attempt cycle and pregnancy check process.

### Root Cause
The `breeding_attempts` table has a `result` field that tracks the outcome:
- `'pending'` - Not yet pregnancy checked
- `'pregnant'` - Confirmed pregnant
- `'returned_to_heat'` - Not pregnant
- `'aborted'` - Pregnancy lost
- `'unknown'` - Unknown status

**Missing**: There is no `'farrowed'` status to indicate that a pregnancy successfully resulted in farrowing.

When a sow farrows, the farrowing record is updated but the breeding attempt is never closed out, leaving it as `'pregnant'` forever.

The views and queries filter for `result IN ('pending', 'pregnant')` to show active breeding attempts, which incorrectly includes old pregnancies that have already farrowed.

### Files Affected
- `database/migration-add-breeding-attempts.sql:25` - Original result check constraint
- `supabase/migrations/20251215000001_add_breeding_fields_to_sow_list_view.sql:56-81` - View that queries for active breeding attempts
- `app/breeding/bred-sows/page.tsx:64` - Page that filters for pending/pregnant breeding attempts
- `components/PregnancyCheckModal.tsx` - Updates breeding attempt to 'pregnant' but doesn't handle farrowing
- `components/RecordLitterForm.tsx` - Records farrowing but doesn't update breeding attempt

## The Solution

Add a `'farrowed'` status to the `result` enum and automatically update breeding attempts when a sow farrows.

### Changes Made

1. **New Migration File**: `supabase/migrations/20260303000004_fix_breeding_attempt_farrowed_status.sql`
   - Adds `'farrowed'` to the result enum check constraint
   - Updates existing breeding attempts that have completed farrowings
   - Creates a trigger to automatically mark breeding attempts as 'farrowed' when actual_farrowing_date is set

2. **Trigger Logic**:
   - When a farrowing record gets an `actual_farrowing_date`
   - The linked breeding attempt is automatically updated from `'pregnant'` to `'farrowed'`
   - This prevents old pregnancies from appearing in active breeding lists

## How to Apply the Fix

### Option 1: Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard:
   https://supabase.com/dashboard/project/eveuhponokpcsodikwpf

2. Navigate to **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy the entire contents of the migration file:
   `supabase/migrations/20260303000004_fix_breeding_attempt_farrowed_status.sql`

5. Paste into the SQL Editor

6. Click **Run** (or press Ctrl+Enter)

7. You should see success messages indicating:
   - Constraint updated
   - Existing breeding attempts updated (if any)
   - Trigger function created
   - Trigger created

### Option 2: Command Line (Alternative)

If you have the Supabase CLI authenticated:

```bash
npx supabase db push
```

This will apply all pending migrations in the `supabase/migrations/` folder.

## Verification

After applying the migration, verify it worked:

### Check 1: Verify the Constraint
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'breeding_attempts_result_check';
```

You should see `'farrowed'` in the CHECK constraint.

### Check 2: Verify Updated Records
```sql
SELECT result, COUNT(*)
FROM breeding_attempts
GROUP BY result;
```

You should see breeding attempts with `result = 'farrowed'` if you have any sows that have farrowed.

### Check 3: Verify Trigger Exists
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_breeding_attempt_on_farrowing';
```

You should see the trigger on the `farrowings` table.

## Expected Behavior After Fix

### Before Fix:
1. Sow bred in November → `result = 'pending'`
2. Pregnancy confirmed → `result = 'pregnant'`
3. Sow farrows → `result` stays `'pregnant'` ❌
4. Re-bred in May → New breeding attempt with `result = 'pending'`
5. **BUG**: Sow shows as pregnant because May breeding is most recent and matches filter

### After Fix:
1. Sow bred in November → `result = 'pending'`
2. Pregnancy confirmed → `result = 'pregnant'`
3. Sow farrows → `result` automatically changes to `'farrowed'` ✅
4. Re-bred in May → New breeding attempt with `result = 'pending'`
5. **FIXED**: Sow shows as pending (waiting for pregnancy check) because only May breeding matches filter

## Testing the Fix

### Test Case 1: Existing Farrowed Sows
For sows that have already farrowed, their old breeding attempts should now show `result = 'farrowed'` instead of `'pregnant'`.

### Test Case 2: New Farrowing
1. Record a breeding for a sow
2. Confirm pregnancy (breeding attempt updates to `result = 'pregnant'`)
3. Record the farrowing with actual_farrowing_date
4. Check the breeding attempt - it should automatically update to `result = 'farrowed'`

### Test Case 3: Re-breeding After Farrowing
1. Complete Test Case 2
2. Record a new breeding for the same sow
3. The sow should NOT show as pregnant immediately
4. The new breeding should show as `result = 'pending'` waiting for pregnancy check

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove the trigger
DROP TRIGGER IF EXISTS trigger_update_breeding_attempt_on_farrowing ON farrowings;
DROP FUNCTION IF EXISTS update_breeding_attempt_on_farrowing();

-- Revert farrowed status back to pregnant
UPDATE breeding_attempts
SET result = 'pregnant'
WHERE result = 'farrowed';

-- Restore original constraint
ALTER TABLE breeding_attempts
DROP CONSTRAINT IF EXISTS breeding_attempts_result_check;

ALTER TABLE breeding_attempts
ADD CONSTRAINT breeding_attempts_result_check
CHECK (result IN ('pending', 'pregnant', 'returned_to_heat', 'aborted', 'unknown'));
```

## Additional Notes

- This fix is **backwards compatible** - existing `'pending'` and `'pregnant'` statuses remain valid
- The trigger only fires on UPDATE of the `farrowings` table when `actual_farrowing_date` changes
- The trigger does not affect existing farrowings until they are updated
- All existing farrowings with `actual_farrowing_date` are updated when the migration runs

## Support

If you encounter any issues applying this migration:

1. Check the Supabase dashboard for any error messages
2. Verify your database credentials are correct
3. Ensure you have admin/owner permissions on the Supabase project
4. Contact support with the migration file name and error message
