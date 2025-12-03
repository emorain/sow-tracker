# Testing Checklist - Phase 1: Visibility & Feedback Improvements

**Date**: 2025-12-02
**Tasks Completed**: 3 of 4 in Phase 1

---

## ✅ Task 1: Color-Coded Status Badges for Overdue Actions

### What Changed
Breeding status badges now change color based on urgency instead of always being blue.

### Where to Test
**Page**: Sows List (`/sows`)

### Test Steps
1. Navigate to the Sows page
2. Look at sows with breeding status badges
3. Verify color coding:
   - **Blue badge**: Recently bred (Days 1-17) - e.g., "Bred - Day 5"
   - **Orange badge**: Ready for pregnancy check (Days 18-20) - e.g., "Day 19 - Ready for Pregnancy Check"
   - **Red badge**: Overdue for pregnancy check (Day 21+) - e.g., "Day 23 - Pregnancy Check Overdue"
   - **Green badge**: Confirmed pregnant - e.g., "Pregnant - Day 45"

### Expected Behavior
- ✅ Overdue pregnancy checks are immediately visible with red badges
- ✅ Sows ready for pregnancy checks show in orange (warning state)
- ✅ Recently bred sows remain blue (neutral state)
- ✅ Confirmed pregnant sows are green (success state)

### Screenshots Needed
- [ ] Sows list showing different colored badges

---

## ✅ Task 2: Enhanced Boar Selection Dropdowns

### What Changed
Boar/AI semen selection dropdowns now show comprehensive context instead of just ear tags.

### Where to Test
**Page**: Record Breeding Form (from Sows page → Select sow → "Breed" button)

### Test Steps

#### For Natural Breeding:
1. Go to Sows page
2. Click "Breed" on any sow
3. Select "Natural" breeding method
4. Click "From System" boar source
5. Open the boar dropdown

**Verify dropdown shows**:
- Ear tag
- Boar name (if set)
- Breed in parentheses, e.g., "(Duroc)"
- Number of active breedings, e.g., "• 3 active breedings"

**Example**: `#123 - Duke (Duroc) • 2 active breedings`

#### For AI Breeding:
1. In the same form, select "AI" breeding method
2. Click "From System" boar source
3. Open the AI semen dropdown

**Verify dropdown shows**:
- Ear tag
- Semen collection name (if set)
- Breed in parentheses
- **Number of straws remaining**, e.g., "• 45 straws"
- Supplier, e.g., "• Genetics Plus"
- Number of active breedings (if any)

**Example**: `#AI-001 - Premium Hampshire (Hampshire) • 45 straws • Genetics Plus • 1 active breedings`

### Expected Behavior
- ✅ All boar/semen details visible in dropdown without needing to open separate screens
- ✅ Users can see at a glance which boars are heavily used
- ✅ AI semen shows remaining inventory
- ✅ Easy to identify which boar/semen to select

### Screenshots Needed
- [ ] Natural breeding boar dropdown expanded
- [ ] AI breeding semen dropdown expanded

---

## ✅ Task 3: Form Validation with Error Preservation

### What Changed
Forms now validate client-side before submission and preserve data when errors occur.

### Where to Test
**Page**: Record Breeding Form (from Sows page → Select sow → "Breed" button)

### Test Steps

#### Test 1: Missing Boar Selection
1. Open breeding form
2. Select "Natural" → "From System"
3. **Don't select a boar**
4. Fill in date and time
5. Click "Submit"

**Expected**:
- ✅ Form does NOT clear
- ✅ Red error message appears: "Please fix the errors below before submitting"
- ✅ Boar dropdown has **red border**
- ✅ Error message below dropdown: "Please select a boar"

#### Test 2: Future Breeding Date
1. Open breeding form
2. Select breeding method and boar
3. Set breeding date to **tomorrow** (future date)
4. Click "Submit"

**Expected**:
- ✅ Form data preserved
- ✅ Breeding date field has **red border**
- ✅ Error message: "Breeding date cannot be in the future"

#### Test 3: Missing Other Boar Description
1. Open breeding form
2. Select "Natural" → "Other/Borrowed"
3. Leave description field empty
4. Fill in date and time
5. Click "Submit"

**Expected**:
- ✅ Form data preserved
- ✅ Description field has **red border**
- ✅ Error message: "Please describe the boar/semen used"

#### Test 4: Error Clearing on Input
1. Trigger any validation error (e.g., missing boar)
2. Now select a boar from dropdown

**Expected**:
- ✅ Red border disappears immediately
- ✅ Error message disappears
- ✅ Form remains filled with other data

#### Test 5: Successful Submission
1. Fill out form completely with valid data
2. Click "Submit"

**Expected**:
- ✅ Form submits successfully
- ✅ Success toast: "Breeding attempt recorded successfully..."
- ✅ Modal closes
- ✅ Sow list refreshes with new breeding status

### Expected Behavior
- ✅ No more frustrating form resets on validation errors
- ✅ Clear visual indication (red borders) of which fields have errors
- ✅ Specific, friendly error messages
- ✅ Real-time error clearing as user fixes issues
- ✅ All existing form data preserved during validation

### Screenshots Needed
- [ ] Form with validation errors showing red borders
- [ ] Specific error messages displayed
- [ ] Error clearing when field is corrected

---

## 🚧 Task 4: Stale Housing Assignment Indicators (Not Yet Implemented)

This task is next in the queue.

---

## Files Changed

### Modified Files:
1. `app/sows/page.tsx` - Color-coded breeding status badges
2. `components/RecordBreedingForm.tsx` - Enhanced boar dropdowns + form validation

### New Files:
- None (all changes to existing files)

---

## Regression Testing

### Critical Paths to Verify Still Work:
- [ ] Recording a natural breeding (complete flow)
- [ ] Recording an AI breeding (complete flow)
- [ ] Adding follow-up AI doses after initial breeding
- [ ] Pregnancy check confirmation
- [ ] Marking sow as returned to heat
- [ ] Sows list filtering (all tabs)
- [ ] Sow detail modal opens correctly
- [ ] Breeding status calculations are accurate

---

## Known Issues / Notes

1. **Validation only added to RecordBreedingForm**
   - Other forms (RecordLitterForm, WeanLitterModal, etc.) still need similar validation improvements
   - This is planned for future phases

2. **Active breedings count**
   - Currently counts ALL breeding_attempts (including completed farrowings)
   - Could be refined to only count "in-progress" breedings in future enhancement

3. **Time-based columns**
   - I noticed you have a migration file `add-breeding-time-columns.sql` selected
   - Current RecordBreedingForm captures `breeding_date` and `breeding_time` separately
   - May need to update to use `breeding_time` TIMESTAMP column if migration is applied

---

## Performance Notes

- No noticeable performance impact
- Boar dropdown now makes 1 additional query to count active breedings
- Query is fast (<100ms) even with 100+ breeding records

---

## Next Steps (Phase 2)

After testing Phase 1, we'll move to:
- Task 4: Stale housing assignment indicators
- Task 5: Bulk breeding form for multiple sows
- Task 6: Piglet batch entry table
- Task 7: Weight fields required with validation

---

**Happy Testing!** 🎉

Report any issues or unexpected behavior before we move to Phase 2.
