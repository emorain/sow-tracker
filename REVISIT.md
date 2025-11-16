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

## Additional Trigger Events for Protocols

**Added:** 2025-11-16

**Current Behavior:**
- Only "Farrowing" trigger is implemented and auto-applies
- Breeding and Weaning options exist but don't trigger
- No custom/manual trigger option

**Potential Enhancements:**
1. **Breeding Protocol Triggers**
   - Auto-generate tasks when breeding is recorded
   - Tasks like: heat detection verification, pregnancy check, vaccination schedules

2. **Weaning Protocol Triggers**
   - Auto-generate tasks when piglets are weaned
   - Tasks like: post-weaning monitoring, vaccination, feed transition

3. **Manual/Custom Triggers**
   - Allow users to manually trigger a protocol at any time
   - Useful for ad-hoc situations (illness outbreak, special treatments)
   - Could have a "Apply Protocol" button on sow/farrowing detail pages

4. **Sow Lifecycle Protocols**
   - Protocols for sow purchase/addition
   - Culling preparation protocols
   - Recovery protocols after farrowing

**Why Deferred:**
- Farrowing is the most common use case
- Need to implement breeding and weaning recording features first
- Want user feedback on farrowing protocols before expanding

---

*To add new items to this list, update this file with the date and description.*
