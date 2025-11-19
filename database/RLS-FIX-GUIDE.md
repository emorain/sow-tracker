# RLS Security Fix - Step by Step Guide

## Problem
Users can see ALL data from ALL accounts instead of only their own data. This is a critical security issue in your multi-tenant application.

## Root Cause
Overly permissive RLS policies that check `auth.role() = 'authenticated'` instead of `auth.uid() = user_id`.

---

## Fix Steps

### Step 1: Verify Current State

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste contents of `database/verify-current-state.sql`
5. Click **Run**
6. Take a screenshot or note the results (especially section 4 - policies)

**What to look for:**
- Section 2: Check which tables have `user_id` column
- Section 3: Verify RLS is enabled
- Section 4: Look for policies marked "WRONG (too permissive)"
- Section 6: See which user owns the data

---

### Step 2: Add user_id Columns (if missing)

**Check first:** If Step 1 showed that some tables are missing `user_id`, run this migration.

1. In Supabase SQL Editor
2. Copy contents of `database/migration-add-user-id-columns.sql`
3. Click **Run**
4. **IMPORTANT:** Check the output
   - If you have 2+ users, it will NOT auto-assign data
   - You'll need to manually assign ownership (see Appendix A below)

**Expected output:**
```
Successfully backfilled user_id for 1 users data
```

---

### Step 3: Fix RLS Policies

This is the main fix that removes permissive policies and adds user-specific ones.

1. In Supabase SQL Editor
2. Copy contents of `database/fix-rls-security.sql`
3. Click **Run**
4. Review the verification output at the end

**Expected output:**
- All tables should show `rls_enabled = true`
- All policies should be named like "Users can view own [table]"
- No errors

---

### Step 4: Fix Storage Bucket Policies (for logos)

1. In Supabase SQL Editor
2. Run this script:

```sql
-- Drop any overly permissive storage policies
DROP POLICY IF EXISTS "Enable all access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Recreate correct policies (from migration-add-logo-url.sql)
CREATE POLICY "Users can upload own farm assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'farm-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own farm assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'farm-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own farm assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'farm-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can VIEW (for public display of logos)
CREATE POLICY "Anyone can view farm assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'farm-assets');
```

---

### Step 5: Test RLS Isolation

#### Test with Account 1:
1. Log in with your first account
2. Go to the sows page
3. Note how many sows you see
4. Note the ear tags/names

#### Test with Account 2:
1. Log out
2. Log in with your second account
3. Go to the sows page
4. **Expected:** Should see ZERO sows (or only sows created by this account)
5. **If you see Account 1's sows:** RLS is still broken

#### Create new data:
1. While logged in as Account 2, create a new sow
2. Verify it appears for Account 2
3. Log back in as Account 1
4. **Expected:** Should NOT see Account 2's new sow

---

## Success Criteria

✅ **RLS is working correctly when:**
- Each user only sees their own data
- Creating new records automatically assigns them to the logged-in user
- Users cannot see or modify other users' data
- No SQL errors in the browser console

❌ **RLS is still broken if:**
- Users can see data from other accounts
- Data shows `user_id = NULL` in the database
- Console shows RLS policy errors

---

## Appendix A: Manual Data Assignment (if you have multiple users)

If the migration script detected multiple users and didn't auto-assign data, you need to manually decide who owns the existing data.

### Option 1: Assign ALL data to User 1
```sql
-- Get user IDs
SELECT id, email FROM auth.users;

-- Replace 'USER_1_ID' with the actual UUID from above
UPDATE sows SET user_id = 'USER_1_ID' WHERE user_id IS NULL;
UPDATE boars SET user_id = 'USER_1_ID' WHERE user_id IS NULL;
UPDATE farrowings SET user_id = 'USER_1_ID' WHERE user_id IS NULL;
UPDATE piglets SET user_id = 'USER_1_ID' WHERE user_id IS NULL;
UPDATE farm_settings SET user_id = 'USER_1_ID' WHERE user_id IS NULL;
UPDATE housing_units SET user_id = 'USER_1_ID' WHERE user_id IS NULL;
```

### Option 2: Split data by some logic
```sql
-- Example: Assign sows with ear_tag starting with 'A' to User 1
UPDATE sows SET user_id = 'USER_1_ID' WHERE ear_tag LIKE 'A%' AND user_id IS NULL;

-- Assign remaining sows to User 2
UPDATE sows SET user_id = 'USER_2_ID' WHERE user_id IS NULL;
```

---

## Appendix B: Quick Verification Query

Run this to quickly check if RLS is working:

```sql
-- This should only show YOUR user_id, not other users
SELECT DISTINCT user_id FROM sows;

-- This should match your auth user ID
SELECT auth.uid() as my_user_id;

-- These two should match!
```

---

## Troubleshooting

### "No rows returned" after applying RLS
**Cause:** Your data has `user_id = NULL` or assigned to a different user
**Fix:** Run Appendix A to assign ownership

### "RLS policy violation" errors in console
**Cause:** Frontend is trying to insert without setting user_id
**Fix:** Check your Supabase queries - they should NOT manually set user_id (RLS handles it)

### Users still see each other's data
**Cause:** Old permissive policies still exist
**Fix:** Re-run Step 3 (fix-rls-security.sql)

### Storage uploads failing
**Cause:** Storage policies too restrictive or path format wrong
**Fix:**
- File paths must be `{user_id}/farm-logos/{filename}`
- Re-run Step 4

---

## Need Help?

If after following all steps RLS still isn't working:
1. Run `verify-current-state.sql` again
2. Check the policy output (section 4)
3. Share the results for debugging
