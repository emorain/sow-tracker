# Sow Tracker - Development Guidelines & Standards

**Last Updated**: 2025-01-17

This document outlines the established patterns, standards, and compliance requirements for the Sow Tracker application. Follow these guidelines to maintain consistency across the codebase.

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Prop 12 Compliance Requirements](#prop-12-compliance-requirements)
3. [Database Patterns](#database-patterns)
4. [UI/UX Patterns](#uiux-patterns)
5. [Component Patterns](#component-patterns)
6. [Code Conventions](#code-conventions)
7. [Lifecycle Management](#lifecycle-management)

---

## Application Overview

**Purpose**: Track sow breeding, farrowing, piglet management, and maintain Prop 12 compliance for California pork sales.

**Tech Stack**:
- Next.js 14 (App Router)
- React with TypeScript
- Supabase (PostgreSQL database)
- TailwindCSS for styling
- Shadcn/ui components

**Key Features**:
- Sow and boar management
- Breeding cycle tracking (Matrix treatments)
- Farrowing management
- Individual piglet tracking (nursing → weaned lifecycle)
- Protocol and task management
- Prop 12 compliance tracking

---

## Prop 12 Compliance Requirements

### Critical Requirements to Track

**Space Requirements**:
- 24 square feet per breeding pig/sow (except during exemptions)
- Must be able to stand, lie down, fully extend limbs, and turn around freely

**Exemptions** (sows NOT required to meet space requirements during):
1. **5 days before farrowing** (expected farrowing date)
2. **While nursing piglets** (lactation period)
3. **Veterinary treatment** (examination, testing, individual treatment)
4. **Temporary confinement**:
   - Maximum 6 hours in any 24-hour period
   - Maximum 24 hours total in any 30-day period
5. **Transportation and slaughter**
6. **Exhibitions** (rodeos, fairs, etc.)

**Compliance Documentation**:
- **Detailed record keeping is CRITICAL**
- Third-party auditors or CA Dept of Food & Agriculture will verify compliance
- Must track location movements and temporary confinement periods
- **Cull sows are excluded** from Prop 12 requirements

### Implementation in Sow Tracker

**Database Schema**:
- `sows.current_location` - tracks physical housing location
- `sows.last_location_change` - timestamp of last move
- `sow_location_history` table - complete audit trail of movements
- `sow_temporary_confinement` table - tracks temporary confinement periods
- Function: `get_temp_confinement_hours_30days(sow_id)` - validates 24hr/30day limit

**Location Types**:
- `breeding` - Breeding area
- `gestation` - Gestation pens (24 sq ft requirement applies here)
- `farrowing` - Farrowing crates (EXEMPT while nursing)
- `hospital` - Medical treatment area
- `quarantine` - Quarantine area
- `other` - Other locations

**Automatic Exemption Tracking**:
- Sows with active farrowings automatically show "Farrowing" location
- Pre-farrowing period (5 days before) should be tracked in future features
- Temporary confinement must be logged with start/end times

### Future Prop 12 Features to Consider

- [ ] Automatic alerts when approaching temporary confinement limits
- [ ] Pre-farrowing exemption tracking (5 days before expected date)
- [ ] Space allocation tracking (sq ft per pen/location)
- [ ] Compliance report generation for audits
- [ ] Group pen management (tracking sows per pen to calculate space)

---

## Database Patterns

### Entity Lifecycle Statuses

**Sows**:
- `active` - Active in breeding herd
- `culled` - Removed from herd (culled)
- `sold` - Sold

**Boars**:
- `active` - Active breeding boar
- `culled` - Removed from herd
- `sold` - Sold

**Piglets**:
- `nursing` - With sow, pre-weaning (NEW - added Jan 2025)
- `weaned` - Separated from sow, weaned
- `sold` - Sold
- `died` - Died
- `culled` - Culled

### Date Field Patterns

**Convention**: Use specific date fields for lifecycle events rather than generic timestamps.

**Examples**:
- `actual_farrowing_date` - When sow actually farrowed
- `moved_out_of_farrowing_date` - When litter was weaned/sow moved out
- `weaned_date` - When piglet was weaned
- `ear_notch_date` - When ear notching was performed
- `castration_date` - When castration was performed
- `died_date` - Date of death (auto-set when status → died)
- `culled_date` - Date culled (auto-set when status → culled)
- `sold_date` - Date sold (auto-set when status → sold)

**Why**: Specific date fields enable precise tracking, reporting, and compliance documentation.

### Nullable Fields Philosophy

**Principle**: Most fields should be nullable to allow gradual data entry.

**Examples**:
- Birth weight can be recorded later
- Ear tags can be added after initial creation
- Identification (ear tags/notches) - at least ONE required, but not all
- Events (castration, ear notching) - recorded when they occur

**Rationale**: Farm operations are fluid - data is collected as events happen, not all at once.

---

## UI/UX Patterns

### Page Structure

**Standard Layout**:
```tsx
<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
  {/* Header */}
  <header className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Icon + Title */}
    </div>
  </header>

  {/* Main Content */}
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Back button */}
    {/* Card with content */}
  </main>
</div>
```

### Color Scheme

**Brand Colors**:
- Primary: Green (`green-600`, `green-50`, `emerald-50`)
- Background: Gradient from `green-50` to `emerald-50`

**Status Badges**:
- Active: `bg-green-100 text-green-800`
- Culled: `bg-red-100 text-red-800`
- Sold: `bg-blue-100 text-blue-800`
- Gilt: `bg-purple-100 text-purple-800`

**Location Badges** (Prop 12):
- Breeding: `bg-pink-100 text-pink-800`
- Gestation: `bg-blue-100 text-blue-800`
- Farrowing: `bg-orange-100 text-orange-800`
- Hospital: `bg-red-100 text-red-800`
- Quarantine: `bg-yellow-100 text-yellow-800`
- Other: `bg-gray-100 text-gray-800`

**Sex Badges** (Piglets):
- Male: `text-blue-600`
- Female: `text-pink-600`
- Unknown: `text-gray-400`

### Badge Pattern

**Standard badge structure**:
```tsx
<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-{color}-100 text-{color}-800">
  {label}
</span>
```

### Modal Pattern

**Standard modal structure**:
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-lg shadow-xl max-w-{size} w-full max-h-[90vh] overflow-hidden flex flex-col">
    {/* Header - Fixed */}
    <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <button onClick={onClose}>
        <X className="h-6 w-6" />
      </button>
    </div>

    {/* Content - Scrollable */}
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
        {/* Form content */}
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="border-t px-6 py-4 bg-white">
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  </div>
</div>
```

**Key Points**:
- Header and footer are fixed
- Middle content scrolls independently
- Max height 90vh to prevent overflow on small screens
- Always include loading state on submit button

### Form Section Pattern

**Organize forms with clear sections**:
```tsx
<div className="border-t pt-4">
  <h3 className="font-semibold text-gray-900 mb-3">Section Title</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Form fields */}
  </div>
</div>
```

### Responsive Considerations

**Mobile-first approach**:
- Stack form fields on mobile (`grid-cols-1`)
- Horizontal layout on larger screens (`md:grid-cols-2`, `lg:grid-cols-3`)
- Hide complex details on mobile, show on desktop (`hidden sm:flex`)
- Stack buttons vertically on mobile, horizontally on desktop

### Info Cards Pattern

**Use for contextual information**:
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
  <p className="text-sm font-medium text-blue-900">
    Main info
  </p>
  <p className="text-xs text-blue-700 mt-1">
    Additional context
  </p>
</div>
```

**Colors by purpose**:
- Info: `blue-50`, `blue-200`, `blue-900`, `blue-700`
- Warning: `amber-50`, `amber-200`, `amber-900`, `amber-700`
- Error: `red-50`, `red-200`, `red-700`

---

## Component Patterns

### Modal Component Naming

**Pattern**: `{Entity}{Purpose}Modal.tsx`

**Examples**:
- `SowDetailModal.tsx` - View/edit sow details
- `BoarDetailModal.tsx` - View/edit boar details
- `NursingPigletModal.tsx` - Manage nursing piglet
- `PigletEditModal.tsx` - Edit weaned piglet
- `WeanLitterModal.tsx` - Wean a litter
- `RecordLitterForm.tsx` - Record farrowing litter

### Form Component Naming

**Pattern**: `{Action}{Entity}Form.tsx`

**Examples**:
- `MoveToFarrowingForm.tsx` - Move sow to farrowing
- `MatrixTreatmentForm.tsx` - Record matrix treatment
- `RecordLitterForm.tsx` - Record litter at farrowing

### Page Structure

**Pattern**: `app/{entity}/{action}/page.tsx`

**Examples**:
- `app/sows/page.tsx` - List all sows
- `app/sows/new/page.tsx` - Add new sow
- `app/piglets/nursing/page.tsx` - List nursing piglets
- `app/piglets/weaned/page.tsx` - List weaned piglets
- `app/farrowings/active/page.tsx` - Active farrowings

### Data Fetching Pattern

**Use effect pattern**:
```tsx
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setData(data || []);
  } catch (err: any) {
    setError(err.message || 'Failed to fetch data');
  } finally {
    setLoading(false);
  }
};
```

### Modal State Pattern

**Standard modal state management**:
```tsx
const [selectedItem, setSelectedItem] = useState<Type | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);

// Opening modal
onClick={() => {
  setSelectedItem(item);
  setIsModalOpen(true);
}}

// Modal component
<Modal
  item={selectedItem}
  isOpen={isModalOpen}
  onClose={() => {
    setIsModalOpen(false);
    setSelectedItem(null);
  }}
  onSuccess={() => {
    fetchData(); // Refresh data
  }}
/>
```

---

## Code Conventions

### TypeScript Types

**Define types at the top of component files**:
```tsx
type Entity = {
  id: string;
  field: type;
  nullable_field: type | null;
  created_at: string;
};

type EntityModalProps = {
  entity: Entity | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};
```

### Supabase Queries

**Use explicit select with joins**:
```tsx
const { data, error } = await supabase
  .from('table')
  .select(`
    id,
    field1,
    field2,
    related_table!inner (
      id,
      name
    )
  `)
  .eq('status', 'active')
  .order('created_at', { ascending: false });
```

**Use `.maybeSingle()` when expecting 0 or 1 result**:
```tsx
const { data: item } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .maybeSingle();
```

### Error Handling

**Standard error handling pattern**:
```tsx
try {
  // Database operations
  const { error } = await supabase.from('table').insert(data);
  if (error) throw error;

  // Success actions
  onSuccess();
  onClose();
} catch (err: any) {
  setError(err.message || 'Generic error message');
} finally {
  setLoading(false);
}
```

### Validation Pattern

**Validate before database operations**:
```tsx
// Validate required fields
if (!formData.required_field) {
  setError('Error message');
  setLoading(false);
  return;
}

// Validate business logic
if (condition) {
  setError('Business logic error');
  setLoading(false);
  return;
}
```

---

## Lifecycle Management

### Piglet Lifecycle

**Status Flow**: `nursing` → `weaned` → `sold` | `died` | `culled`

**Creation Points**:
1. **At birth** (optional): Create individual piglets with `status='nursing'` via RecordLitterForm
2. **At weaning**: Create or update piglets via WeanLitterModal

**Key Fields by Stage**:

**Nursing Stage**:
- `birth_weight` (optional - can add later)
- `sex` (male/female/unknown)
- `ear_notch_date` (typically days 1-3)
- `castration_date` (males only, pre-weaning)
- `notes` (treatments, antibiotics, illnesses)

**Weaning Stage**:
- `weaning_weight` (required)
- `weaned_date` (required)
- Status changes: `nursing` → `weaned`
- Farrowing updated: `moved_out_of_farrowing_date` set

**Post-Weaning**:
- Can change status to `sold`, `died`, or `culled`
- Appropriate date field auto-set when status changes

### Sow Lifecycle

**Breeding Cycle**:
1. **Breeding/Heat** - Can be in heat naturally or via Matrix treatment
2. **Gestation** - Pregnant (location = `gestation`)
3. **Pre-Farrowing** - 5 days before expected farrowing (Prop 12 exempt)
4. **Farrowing** - Active farrowing (location = `farrowing`, Prop 12 exempt while nursing)
5. **Post-Weaning** - Return to breeding cycle

**Key Transitions**:
- Matrix Treatment → Expected heat date → Breeding
- Breeding → Pregnancy check → Gestation
- Move to Farrowing → Record litter → Active farrowing
- Wean litter → Set `moved_out_of_farrowing_date` → Return to cycle

### Gilt vs Sow Classification

**Logic**: Check farrowing count
- Gilt: `farrowingCount === 0` (never farrowed)
- Sow: `farrowingCount > 0` (has farrowed at least once)

**Display**: Show purple "Gilt" badge for gilts

---

## Business Logic Rules

### Move to Farrowing Button

**When to show**:
- Sow status is `active`
- AND sow does NOT have an active farrowing (no record with `actual_farrowing_date` set but `moved_out_of_farrowing_date` null)

**Implementation** (app/sows/page.tsx:418):
```tsx
{sow.status === 'active' && !activeFarrowings.has(sow.id) && (
  <Button>Move to Farrowing</Button>
)}
```

### Optional Individual Piglet Creation

**At farrowing** (RecordLitterForm):
- Checkbox to enable individual piglet creation
- If enabled, create piglet records with `status='nursing'`
- All fields optional (ear tags, notches, sex, birth weight)
- Falls back to aggregate count if not enabled

**At weaning** (WeanLitterModal):
- Check for existing nursing piglets first
- If found, update them to `status='weaned'`
- If not found, create new piglet records (backwards compatible)

### Identification Requirements

**Piglets**: At least ONE of the following required:
- Ear tag (string)
- Right ear notch (number)
- Left ear notch (number)

**Display Pattern**:
- If has ear_tag: Show ear tag as primary
- Else if has notches: Show "Notch: {right}-{left}"
- Else: Show "No ID"

---

## Notes for AI Assistants

When working on this codebase:

1. **Always check for active farrowings** before showing "Move to Farrowing" button
2. **Respect Prop 12 exemptions** - sows in farrowing are exempt from 24 sq ft requirement
3. **Make fields nullable** unless absolutely required for business logic
4. **Use specific date fields** instead of generic timestamps
5. **Follow the modal pattern** for consistent UI/UX
6. **Track location changes** in sow_location_history for Prop 12 compliance
7. **Validate temporary confinement** doesn't exceed limits (6hrs, 24hrs/30days)
8. **Support gradual data entry** - users add information as events occur
9. **Use color-coded badges** for visual status indication
10. **Keep compliance documentation** in mind for all sow movement features

---

## Changelog

- **2025-01-17**: Initial document created
  - Added Prop 12 compliance requirements and tracking
  - Documented nursing piglet lifecycle (added Jan 2025)
  - Established UI/UX patterns and color schemes
  - Documented farrowing button bug fix and location tracking
