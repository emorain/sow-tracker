# Multi-User Team System - Implementation Plan

**Version:** 1.1 (Updated with Approved Decisions)
**Date:** 2025-01-18
**Status:** Ready for Implementation ✅

---

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Database Schema Design](#database-schema-design)
4. [RLS Policy Updates](#rls-policy-updates)
5. [Migration Strategy](#migration-strategy)
6. [Application Changes](#application-changes)
7. [Implementation Phases](#implementation-phases)
8. [Testing Strategy](#testing-strategy)
9. [Potential Challenges](#potential-challenges)
10. [Timeline Estimate](#timeline-estimate)

---

## Overview

Transform the Sow Tracker from a **single-user-per-farm** model to a **multi-user team collaboration** model where multiple users can work together on the same farm with role-based permissions and action tracking.

### Current State
- One user account = One farm
- `user_id` represents farm owner
- No team collaboration
- No permission system
- No action tracking

### Target State
- One farm (organization) = Multiple team members
- Owner + Employee roles with granular permissions
- Track who created and modified records
- Task assignment and completion tracking
- Audit trail of user actions

---

## Requirements

### 1. Roles & Permissions

#### Owner Role
- Full access to all features
- Can invite/remove team members
- Can manage permissions for employees
- Can delete the organization
- Cannot be removed (permanent)

#### Employee Role
- Customizable permissions per employee
- **Simplified 3-Level Permission System per table**:
  - **Read Only**: Can view records only, no modifications
  - **Add Only**: Can view and create new records, but cannot edit/delete existing ones
  - **Full Access**: Can view, create, edit, and delete records

**Applied to these tables:**
- Sows
- Boars
- Farrowings
- Piglets
- Tasks (+ special permissions: can_assign, can_complete)
- Protocols
- Housing Units
- Settings (Read Only or Full Access only)

### 2. Action Tracking

For all major tables (sows, boars, farrowings, piglets, etc.):
- **created_by_user_id**: Which team member created the record
- **created_by_name**: Cached name (for display if user is removed)
- **updated_by_user_id**: Which team member last modified the record
- **updated_by_name**: Cached name
- **updated_at**: When last modified (already exists)

### 3. Task Assignment & Completion

- Tasks can be **assigned to a specific team member** OR **unassigned** (shared pool)
- **Anyone can complete any task** (regardless of assignment)
- When completing a task, record **who actually completed it**
- Dropdown selector to choose who completed it (defaults to current user)

---

## Database Schema Design

### New Tables

#### 1. `organizations` Table
Represents a farm/business entity.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  name VARCHAR(200) NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Settings (migrated from farm_settings)
  logo_url TEXT,
  prop12_compliance_enabled BOOLEAN DEFAULT false,
  weight_unit VARCHAR(10) DEFAULT 'lbs',
  measurement_unit VARCHAR(10) DEFAULT 'feet',
  email_notifications_enabled BOOLEAN DEFAULT true,
  task_reminders_enabled BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_owner ON organizations(owner_user_id);
```

**Notes:**
- `owner_user_id` uses `ON DELETE RESTRICT` to prevent deleting the owner
- Farm settings merged into organizations table
- One user can own multiple organizations (future: support multiple farms)

---

#### 2. `organization_members` Table
Links users to organizations with roles.

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'employee')),

  -- User info (cached for display)
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(100), -- Display name

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_status ON organization_members(status);
```

**Notes:**
- `status = 'invited'`: User invited but hasn't accepted yet
- `status = 'active'`: User is an active team member
- `status = 'inactive'`: User was removed or deactivated
- Owner automatically gets a member record with `role = 'owner'`

---

#### 3. `user_permissions` Table
**Simplified 3-level permission system** for employees.

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,

  -- Table and permission level
  table_name VARCHAR(50) NOT NULL,
  permission_level VARCHAR(20) NOT NULL DEFAULT 'read_only'
    CHECK (permission_level IN ('read_only', 'add_only', 'full_access')),

  -- Special permissions (task-specific, only applies to 'scheduled_tasks' table)
  can_assign BOOLEAN DEFAULT false,  -- Can assign tasks to others
  can_complete BOOLEAN DEFAULT true, -- Can mark tasks complete

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(organization_member_id, table_name)
);

CREATE INDEX idx_user_perms_member_id ON user_permissions(organization_member_id);
```

**Permission Levels Explained:**
- **`read_only`**: Can view records only (SELECT)
- **`add_only`**: Can view and create new records (SELECT, INSERT)
- **`full_access`**: Can view, create, edit, and delete (SELECT, INSERT, UPDATE, DELETE)

**Notes:**
- One row per table per user
- Owner role bypasses permission checks (always has full access)
- Default for employees: Read-only (`permission_level = 'read_only'`)
- Tables covered: `sows`, `boars`, `farrowings`, `piglets`, `scheduled_tasks`, `protocols`, `housing_units`, `farm_settings`

---

### Modified Existing Tables

All core data tables need these additions:

#### Template for All Tables
```sql
-- Add organization_id (replaces user_id as the primary tenant identifier)
ALTER TABLE {table_name}
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add action tracking
ALTER TABLE {table_name}
ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN created_by_name VARCHAR(100),
ADD COLUMN updated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN updated_by_name VARCHAR(100);

-- Create indexes
CREATE INDEX idx_{table_name}_org_id ON {table_name}(organization_id);
CREATE INDEX idx_{table_name}_created_by ON {table_name}(created_by_user_id);
CREATE INDEX idx_{table_name}_updated_by ON {table_name}(updated_by_user_id);
```

#### Tables to Modify
1. `sows`
2. `boars`
3. `farrowings`
4. `piglets`
5. `scheduled_tasks` (+ extra fields below)
6. `protocols`
7. `housing_units`
8. `matrix_treatments`
9. `sow_location_history`

#### Special: `scheduled_tasks` Additional Fields
```sql
ALTER TABLE scheduled_tasks
ADD COLUMN assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN assigned_to_name VARCHAR(100),
ADD COLUMN completed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN completed_by_name VARCHAR(100);

CREATE INDEX idx_tasks_assigned_to ON scheduled_tasks(assigned_to_user_id);
CREATE INDEX idx_tasks_completed_by ON scheduled_tasks(completed_by_user_id);
```

---

## RLS Policy Updates

### Current RLS Pattern (Single User)
```sql
-- Example: sows table
CREATE POLICY "Users can view own sows"
  ON sows FOR SELECT
  USING (auth.uid() = user_id);
```

### New RLS Pattern (Multi-User Organization)

#### Helper Function: Check Organization Membership
```sql
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Helper Function: Check Permission
```sql
CREATE OR REPLACE FUNCTION has_permission(
  org_id UUID,
  table_name TEXT,
  permission_type TEXT  -- 'create', 'read', 'update', 'delete'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  has_perm BOOLEAN;
BEGIN
  -- Get user's role in this organization
  SELECT role INTO user_role
  FROM organization_members
  WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND status = 'active';

  -- Owner has all permissions
  IF user_role = 'owner' THEN
    RETURN TRUE;
  END IF;

  -- Check employee permissions
  IF permission_type = 'create' THEN
    SELECT can_create INTO has_perm FROM user_permissions up
    JOIN organization_members om ON om.id = up.organization_member_id
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND up.table_name = has_permission.table_name;
  ELSIF permission_type = 'read' THEN
    SELECT can_read INTO has_perm FROM user_permissions up
    JOIN organization_members om ON om.id = up.organization_member_id
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND up.table_name = has_permission.table_name;
  ELSIF permission_type = 'update' THEN
    SELECT can_update INTO has_perm FROM user_permissions up
    JOIN organization_members om ON om.id = up.organization_member_id
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND up.table_name = has_permission.table_name;
  ELSIF permission_type = 'delete' THEN
    SELECT can_delete INTO has_perm FROM user_permissions up
    JOIN organization_members om ON om.id = up.organization_member_id
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND up.table_name = has_permission.table_name;
  END IF;

  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### New Policy Pattern (Example: sows table)
```sql
-- SELECT: Member of organization AND has read permission
CREATE POLICY "Organization members can view sows with permission"
  ON sows FOR SELECT
  USING (
    is_organization_member(organization_id) AND
    has_permission(organization_id, 'sows', 'read')
  );

-- INSERT: Member of organization AND has create permission
CREATE POLICY "Organization members can insert sows with permission"
  ON sows FOR INSERT
  WITH CHECK (
    is_organization_member(organization_id) AND
    has_permission(organization_id, 'sows', 'create')
  );

-- UPDATE: Member of organization AND has update permission
CREATE POLICY "Organization members can update sows with permission"
  ON sows FOR UPDATE
  USING (
    is_organization_member(organization_id) AND
    has_permission(organization_id, 'sows', 'update')
  )
  WITH CHECK (
    is_organization_member(organization_id) AND
    has_permission(organization_id, 'sows', 'update')
  );

-- DELETE: Member of organization AND has delete permission
CREATE POLICY "Organization members can delete sows with permission"
  ON sows FOR DELETE
  USING (
    is_organization_member(organization_id) AND
    has_permission(organization_id, 'sows', 'delete')
  );
```

**Apply this pattern to all tables**: sows, boars, farrowings, piglets, scheduled_tasks, protocols, housing_units, matrix_treatments, sow_location_history

---

## Migration Strategy

### Challenge
Convert existing single-user farms to multi-user organizations without data loss.

### Approach

#### Step 1: Create Organizations from Existing Users
```sql
-- For each existing user with data, create an organization
INSERT INTO organizations (owner_user_id, name, created_at)
SELECT
  u.id,
  COALESCE(fs.farm_name, u.email) as name,
  u.created_at
FROM auth.users u
LEFT JOIN farm_settings fs ON fs.user_id = u.id
WHERE EXISTS (
  SELECT 1 FROM sows WHERE user_id = u.id
  UNION
  SELECT 1 FROM boars WHERE user_id = u.id
  UNION
  SELECT 1 FROM farrowings WHERE user_id = u.id
);
```

#### Step 2: Create Organization Members for Owners
```sql
-- Create member records for all organization owners
INSERT INTO organization_members (organization_id, user_id, role, user_email, status, joined_at)
SELECT
  o.id,
  o.owner_user_id,
  'owner',
  u.email,
  'active',
  NOW()
FROM organizations o
JOIN auth.users u ON u.id = o.owner_user_id;
```

#### Step 3: Backfill organization_id in Data Tables
```sql
-- For each table, map user_id -> organization_id
-- Example: sows table
UPDATE sows s
SET organization_id = o.id
FROM organizations o
WHERE o.owner_user_id = s.user_id;

-- Repeat for: boars, farrowings, piglets, scheduled_tasks, protocols, housing_units, etc.
```

#### Step 4: Backfill created_by/updated_by
```sql
-- Set created_by to the original owner (since we don't have historical data)
UPDATE sows s
SET
  created_by_user_id = o.owner_user_id,
  created_by_name = u.email,
  updated_by_user_id = o.owner_user_id,
  updated_by_name = u.email
FROM organizations o
JOIN auth.users u ON u.id = o.owner_user_id
WHERE s.organization_id = o.id
  AND s.created_by_user_id IS NULL;

-- Repeat for all tables
```

#### Step 5: Create Default Permissions for Owners
Owner permissions are not stored (they always have full access), so no action needed.

#### Step 6: Make organization_id NOT NULL
```sql
-- After backfill, enforce NOT NULL
ALTER TABLE sows ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE boars ALTER COLUMN organization_id SET NOT NULL;
-- ... repeat for all tables
```

#### Step 7: Drop old user_id column (OPTIONAL - can keep for reference)
```sql
-- OPTIONAL: Remove user_id after migration is verified
-- ALTER TABLE sows DROP COLUMN user_id;
```

---

## Application Changes

### 1. Context/Hooks

#### New: Organization Context
```tsx
// lib/organization-context.tsx
type OrganizationContextType = {
  currentOrganization: Organization | null;
  organizations: Organization[];
  members: OrganizationMember[];
  switchOrganization: (orgId: string) => void;
  hasPermission: (table: string, action: string) => boolean;
  loading: boolean;
};
```

**Features:**
- Track current organization
- List all organizations user is a member of
- Switch between organizations (if user belongs to multiple)
- Check permissions client-side
- Load team members

---

### 2. New UI Components

#### Team Management Page (`app/team/page.tsx`)
- List all team members
- Show role and status
- Invite new members (owner only)
- Remove members (owner only)
- Manage permissions per employee

#### Permission Management Modal
- Per-employee permission editor
- Checkboxes for Create/Read/Update/Delete per table
- Save permission changes
- Only accessible by owner

#### Task Assignment Components
- **Task Form**: Dropdown to assign task to team member
- **Task List**: Show assigned user
- **Task Complete Modal**: Dropdown to select who completed it (defaults to current user)

---

### 3. Modified Components

#### All Forms (Add/Edit)
- Get current organization from context
- Set `organization_id` on all inserts
- Set `created_by_user_id` and `created_by_name` on create
- Set `updated_by_user_id` and `updated_by_name` on update
- Check permissions before allowing create/update/delete

Example:
```tsx
const { currentOrganization, hasPermission } = useOrganization();
const { data: { user } } = await supabase.auth.getUser();

// Check permission
if (!hasPermission('sows', 'create')) {
  throw new Error('You do not have permission to add sows');
}

// Insert with tracking
const { error } = await supabase.from('sows').insert({
  organization_id: currentOrganization.id,
  created_by_user_id: user.id,
  created_by_name: user.email, // or display name
  // ... other fields
});
```

#### Detail Views
- Display "Created by: [name]" and "Last modified by: [name]"
- Show timestamps
- Optionally show full edit history (future enhancement)

---

### 4. Authentication Flow

#### Signup Flow
1. User signs up
2. Automatically create organization (farm)
3. Create organization_member record (owner role)
4. Redirect to dashboard

#### Invitation Flow
1. Owner sends invitation email
2. Invitee clicks link, signs up (or logs in if existing user)
3. Create organization_member record (employee role, status='invited')
4. Owner sets permissions
5. Employee accepts invitation (status='active')
6. Employee can access farm

---

## Implementation Phases

### Phase 1: Database Foundation (2-3 hours)
**Goal**: Set up new tables and migrate existing data

- [ ] Create `organizations` table
- [ ] Create `organization_members` table
- [ ] Create `user_permissions` table
- [ ] Add `organization_id`, `created_by_user_id`, `updated_by_user_id` to all tables
- [ ] Create helper functions (`is_organization_member`, `has_permission`)
- [ ] Run migration scripts to convert existing users to organizations
- [ ] Test: Verify all existing data migrated correctly

**Deliverables:**
- Migration SQL scripts
- Verification queries
- Rollback plan

---

### Phase 2: RLS Policy Updates (2-3 hours)
**Goal**: Update all RLS policies to use organization-based access control

- [ ] Drop old user-based RLS policies
- [ ] Create new organization-based RLS policies for all tables
- [ ] Test: Verify owner can access all data
- [ ] Test: Verify non-members cannot access data

**Deliverables:**
- Updated RLS policies SQL script
- RLS testing script

---

### Phase 3: Organization Context & Basic Multi-User (3-4 hours)
**Goal**: Add organization context and update all forms to use it

- [ ] Create `OrganizationContext` provider
- [ ] Update all insert operations to include `organization_id`
- [ ] Update all insert/update operations to track `created_by` and `updated_by`
- [ ] Display "Created by" and "Modified by" in detail views
- [ ] Test: Two users in same organization can see each other's data

**Deliverables:**
- OrganizationContext component
- Updated insert/update forms
- Basic multi-user functionality working

---

### Phase 4: Team Management UI (2-3 hours)
**Goal**: Allow owners to invite and manage team members

- [ ] Create Team Management page
- [ ] Implement invite system (email invitation)
- [ ] Show list of team members with roles
- [ ] Allow owner to remove members
- [ ] Test: Owner can invite employee, employee can accept

**Deliverables:**
- Team management page
- Invitation email system
- Member list UI

---

### Phase 5: Permission System (3-4 hours)
**Goal**: Implement granular permissions for employees

- [ ] Create Permission Management UI (owner only)
- [ ] Implement `hasPermission()` client-side check
- [ ] Add permission checks to all create/update/delete operations
- [ ] Show/hide UI elements based on permissions
- [ ] Test: Employee with limited permissions cannot perform restricted actions

**Deliverables:**
- Permission management UI
- Permission enforcement in all forms
- Permission-aware UI hiding/showing

---

### Phase 6: Task Assignment & Completion Tracking (2-3 hours)
**Goal**: Allow tasks to be assigned and track who completed them

- [ ] Add task assignment dropdown to task creation form
- [ ] Show assigned user on task list
- [ ] Add "Completed by" dropdown to task completion modal
- [ ] Display completion history
- [ ] Test: Tasks can be assigned and completed with tracking

**Deliverables:**
- Task assignment UI
- Task completion tracking
- Task history display

---

### Phase 7: Testing & Refinement (2-3 hours)
**Goal**: End-to-end testing and bug fixes

- [ ] Test complete owner workflow (invite, assign, manage)
- [ ] Test complete employee workflow (accept invite, complete tasks)
- [ ] Test permission enforcement across all tables
- [ ] Test with 3+ users in same organization
- [ ] Performance testing (queries with many members)
- [ ] Bug fixes and polish

**Deliverables:**
- Test plan document
- Bug fix list
- Performance optimization (if needed)

---

## Testing Strategy

### Unit Tests
- RLS policies: Test each policy with different user roles
- Helper functions: Test `is_organization_member()` and `has_permission()`
- Permission checks: Test permission enforcement

### Integration Tests
- **Scenario 1**: Owner invites employee, employee accepts
- **Scenario 2**: Employee with limited permissions tries restricted action (should fail)
- **Scenario 3**: Multiple employees working on same data simultaneously
- **Scenario 4**: Task assignment and completion by different users

### User Acceptance Testing
- **Owner**: Can I invite team members and manage permissions?
- **Employee**: Can I see only what I'm allowed to see?
- **Both**: Does action tracking work correctly?
- **Both**: Can tasks be assigned and completed properly?

---

## Potential Challenges

### 1. RLS Performance
**Challenge**: Permission checks on every query could slow down queries.

**Solution:**
- Index all foreign keys properly
- Use `SECURITY DEFINER` functions carefully
- Consider caching permission checks in application layer
- Monitor query performance

### 2. Migration Complexity
**Challenge**: Migrating existing single-user data to multi-user without breaking anything.

**Solution:**
- Create comprehensive migration scripts
- Test migration on copy of production database first
- Create rollback scripts
- Migrate during maintenance window

### 3. Permission UI Complexity
**Challenge**: Managing granular permissions for many tables/users is complex.

**Solution:**
- Start with simple role templates (e.g., "Read-only", "Full access", "Limited")
- Allow customization after selecting template
- Clear visual indicators of permission state

### 4. Invitation System
**Challenge**: Email delivery, invitation expiration, security.

**Solution:**
- Use Supabase Auth invitations if possible
- Add expiration date to invitations (7 days)
- Use signed tokens for security
- Resend capability

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Database Foundation | 2-3 hours | None |
| Phase 2: RLS Policy Updates | 2-3 hours | Phase 1 |
| Phase 3: Organization Context | 3-4 hours | Phase 2 |
| Phase 4: Team Management UI | 2-3 hours | Phase 3 |
| Phase 5: Permission System | 3-4 hours | Phase 4 |
| Phase 6: Task Assignment | 2-3 hours | Phase 3 |
| Phase 7: Testing & Refinement | 2-3 hours | All |
| **TOTAL** | **16-23 hours** | |

**Recommended Approach**: Implement over 3-4 coding sessions, testing thoroughly after each phase.

---

## Next Steps

1. **Review this plan** - Make any adjustments based on feedback
2. **Approve plan** - Confirm this is the desired approach
3. **Start Phase 1** - Begin with database foundation
4. **Iterate** - Complete one phase at a time, testing before moving on

---

## ✅ Questions RESOLVED (Approved Decisions)

- [x] **Should users belong to multiple organizations?**
  **DECISION**: **NO** - Each user can only belong to ONE organization. If someone works for multiple farms, they need separate accounts. This simplifies the data model significantly.

- [x] **Should we support permission templates/roles?**
  **DECISION**: **Simplified 3-Level System** - Instead of full CRUD granularity, use three permission levels per table: Read Only, Add Only, Full Access. Much simpler to understand and manage.

- [x] **Do we need audit logs for who deleted what and when?**
  **DECISION**: **Phase it in** - Start with basic tracking (created_by, updated_by) now. Full audit trail (complete change history) will be added later as Phase 8.

- [x] **Should removed employees still show in "created by" history?**
  **DECISION**: **Show in history, block access** - Removed employees lose all app access (status='inactive'), but their cached name remains in historical records (created_by_name, updated_by_name fields).

- [x] **User creation method?**
  **DECISION**: **Option A - Temporary Password with Forced Change**
  - Owner creates employee account with temporary password
  - Owner gives temp password to employee
  - Employee MUST change password on first login
  - Owner no longer knows the password (secure!)

---

## Revised Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 1: Database Foundation | 2-3 hours | Simplified permission table |
| Phase 2: RLS Policy Updates | 2-3 hours | 3-level permission checks |
| Phase 3: Organization Context | 2-3 hours | No org switching needed |
| Phase 4: Team Management UI | 2-3 hours | Temp password creation |
| Phase 5: Permission System | 2-3 hours | 3-level UI (simpler) |
| Phase 6: Task Assignment | 2-3 hours | |
| Phase 7: Testing & Refinement | 2-3 hours | |
| **TOTAL** | **12-18 hours** | ⬇️ Reduced from 16-23 hours |

**Simplifications saved 4-5 hours!**

---

**Document End**

*This plan is now APPROVED and ready for implementation. ✅*
