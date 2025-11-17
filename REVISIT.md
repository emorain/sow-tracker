# Items to Revisit

This file tracks features and improvements to consider implementing in the future.

---

## Protocol Application Enhancements

**Added:** 2025-11-16

**Current Behavior:**
- Protocols automatically apply to all farrowings when active
- All active "farrowing" protocols apply to every farrowing event
- Tasks are tied to farrowing/sow, not individual piglets

**Potential Enhancements:**
1. **Manual Protocol Selection**
   - Allow user to choose which protocol(s) to apply when recording a farrowing
   - Checkbox or dropdown during farrowing recording

2. **Per-Piglet Task Application**
   - Apply tasks to individual piglets instead of the entire litter
   - Better tracking for operations done on specific piglets

3. **Conditional Protocols**
   - Apply different protocols based on conditions:
     - Indoor vs outdoor farrowings
     - Different breeds
     - Seasonal variations
     - Farm location/building

**Why Deferred:**
- Current auto-application works well for standard operations
- Want to test current system before adding complexity
- Need real-world usage feedback to determine best approach

---

## ✅ Breeding Protocol Triggers - IMPLEMENTED

**Added:** 2025-11-16
**Implemented:** 2025-11-16

~~Auto-generate tasks when breeding is recorded~~
- ✅ Created default breeding protocol with pregnancy check tasks
- ✅ Auto-applies when sow is marked as bred
- ✅ Generates scheduled tasks: heat detection (21d), ultrasound (28d), visual check (60d), farrowing prep (107d)
- ✅ Created dedicated bred sows view page to monitor pregnancy status
- ✅ Dashboard card showing bred sows count

---

## Additional Protocol Trigger Events

**Added:** 2025-11-16

**Potential Enhancements:**
1. **Weaning Protocol Triggers**
   - Auto-generate tasks when piglets are weaned
   - Tasks like: post-weaning monitoring, vaccination, feed transition

2. **Manual/Custom Triggers**
   - Allow users to manually trigger a protocol at any time
   - Useful for ad-hoc situations (illness outbreak, special treatments)
   - Could have a "Apply Protocol" button on sow/farrowing detail pages

3. **Sow Lifecycle Protocols**
   - Protocols for sow purchase/addition
   - Culling preparation protocols
   - Recovery protocols after farrowing

**Why Deferred:**
- Want user feedback on farrowing and breeding protocols before expanding
- Weaning tracking features need further development first

---

*To add new items to this list, update this file with the date and description.*
