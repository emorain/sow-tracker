# California Proposition 12 Compliance Checklist
## Sow Tracker Implementation Requirements

**Last Updated:** November 26, 2024
**Effective Date:** January 1, 2024

---

## Overview

California Proposition 12 requires strict housing and record-keeping standards for breeding pigs. This checklist outlines what Sow Tracker needs to track and document for full compliance.

---

## 1. HOUSING REQUIREMENTS

### Space Requirements
- [ ] **24 sq ft minimum per breeding sow**
  - Track usable floor space in each housing unit
  - Calculate pigs per enclosure to ensure compliance
  - Alert when space allocation falls below minimum

### Movement Freedom
- [ ] **Sows must be able to:**
  - Stand up freely
  - Turn around completely
  - Stretch limbs without touching enclosure sides or other animals
  - Document housing unit dimensions support this

### Confinement Restrictions
- [ ] **General Confinement Limits:**
  - Maximum 6 hours confinement in any 24-hour period
  - Maximum 24 hours total confinement in any 30-day period
  - Track all confinement events with timestamps

- [ ] **Farrowing Exception:**
  - May use non-compliant enclosures 5 days before expected farrowing
  - Must move to compliant housing immediately after weaning
  - Document all farrowing pen usage with dates

---

## 2. RECORD KEEPING REQUIREMENTS

### Audit Trail (2-Year Retention)
- [ ] **Animal Identification:**
  - Unique ID for each breeding pig (ear tag)
  - Birth date and origin
  - Dam and sire information

- [ ] **Location Events:**
  - Date and time of every housing transfer
  - Housing unit ID and type
  - Reason for transfer
  - Duration in each location

- [ ] **Enclosure Records:**
  - Number and size of all breeding pig enclosures
  - Usable floor space per enclosure
  - Number of pigs per enclosure at all times
  - Dates of stocking changes

- [ ] **Inventory Records:**
  - Daily pig counts by housing unit
  - Quantity of breeding pigs produced
  - Quantity processed/sold
  - Current inventory status

### Transaction Records (2-Year Retention)
- [ ] **Purchase Records:**
  - Date of acquisition
  - Quantity purchased
  - Seller name and address
  - Location where physical possession occurred
  - Compliance status of source

- [ ] **Sale Records:**
  - Date of sale
  - Quantity sold
  - Buyer name and address
  - Location where physical possession transferred
  - Offspring traceability to compliant sows

### Breeding & Farrowing Records
- [ ] **Breeding Events:**
  - Breeding date and boar ID
  - Expected farrowing date
  - Pregnancy confirmation date and method
  - Days since breeding tracking

- [ ] **Farrowing Events:**
  - Actual farrowing date and time
  - Housing unit during farrowing
  - Date moved to farrowing pen (must be ≤ 5 days before birth)
  - Weaning date
  - Date moved back to compliant housing
  - Number of piglets born/alive/weaned

### Confinement Exception Documentation
- [ ] **Non-Compliant Enclosure Usage:**
  - Start date/time of confinement
  - End date/time of confinement
  - Total hours in 24-hour period (must be ≤ 6)
  - Total hours in 30-day period (must be ≤ 24)
  - Reason for confinement (breeding, medical, farrowing)
  - Automated alerts when limits approached

### Health & Medical Records
- [ ] **Veterinary Care:**
  - Date of medical treatment
  - Reason for treatment
  - If treatment required isolation/confinement
  - Duration of medical confinement
  - Return to compliant housing date

---

## 3. COMPLIANCE DOCUMENTATION

### Certification
- [ ] **Valid Certificate of Compliance:**
  - Third-party certification required
  - Certification date and expiration
  - Certifying organization
  - Certificate number/ID

### Standard Operating Procedures
- [ ] **Written SOPs for:**
  - Housing assignment procedures
  - Transfer protocols
  - Space calculation methods
  - Confinement tracking
  - Record keeping practices
  - Segregation of compliant/non-compliant animals (if applicable)

---

## 4. TRACEABILITY REQUIREMENTS

### Offspring Tracking
- [ ] **Piglet Traceability:**
  - Link each piglet to dam (sow ID)
  - Link dam to compliant housing history
  - Track piglet location from birth through weaning
  - Document flow to nursery/finish barns
  - Label market hog shipments for Prop 12 distributors

### Split Operations (if applicable)
- [ ] **Segregation Documentation:**
  - Separate tracking for compliant vs non-compliant pigs
  - Procedures to prevent commingling
  - Identification methods to distinguish groups
  - Handling and distribution processes
  - Storage and segregation protocols

---

## 5. REPORTING CAPABILITIES

### Audit Reports (Must Generate)
- [ ] **Per-Animal Audit Trail:**
  - Complete housing history for any sow
  - All location transfers with dates/times
  - Confinement hours calculation
  - Compliance status at any point in time
  - Printable/exportable format

- [ ] **Facility-Wide Reports:**
  - Current inventory by housing unit
  - Space utilization per enclosure
  - Compliance status summary
  - Upcoming inspections/certifications
  - Exception tracking (confinement limits)

- [ ] **Transaction History:**
  - All purchases with seller details
  - All sales with buyer details
  - 2-year historical data
  - Exportable for auditors

### Compliance Alerts
- [ ] **Automated Warnings:**
  - Space allocation approaching minimum
  - Confinement hours approaching 6-hour limit
  - 30-day confinement approaching 24-hour limit
  - Farrowing sow in non-compliant housing > 5 days pre-birth
  - Weaned piglets not moved from farrowing pen
  - Missing housing assignment
  - Certification expiration approaching

---

## 6. INSPECTION READINESS

### On-Site Inspection Preparation
- [ ] **Inspector Access:**
  - All records accessible within 2 years
  - Digital and/or paper format
  - Search by animal ID, date range, housing unit
  - Quick compliance status verification

- [ ] **Documentation Package:**
  - Current certification documents
  - Facility diagrams with measurements
  - Standard Operating Procedures
  - Staff training records
  - Recent audit reports

---

## IMPLEMENTATION STATUS IN SOW TRACKER

### Currently Implemented ✓
- [x] Unique sow identification (ear tags)
- [x] Birth date tracking
- [x] Dam and sire information
- [x] Breeding date tracking
- [x] Expected farrowing date calculation
- [x] Actual farrowing date
- [x] Weaning tracking
- [x] Housing unit assignment
- [x] Housing unit names and types
- [x] Transfer tracking (via housing_unit_id changes)
- [x] Basic health records
- [x] Piglet tracking with dam linkage

### Needs Implementation ⚠️
- [ ] Housing unit floor space (sq ft) tracking
- [ ] Automated space-per-pig calculation
- [ ] Confinement event logging (timestamp, duration, reason)
- [ ] 6-hour/24-hour confinement limit tracking
- [ ] 24-hour/30-day confinement limit tracking
- [ ] Farrowing pen timeline enforcement (5 days max before birth)
- [ ] Complete location history report per animal
- [ ] Transaction records (purchases/sales with full details)
- [ ] Certification document storage
- [ ] Audit trail export functionality
- [ ] Compliance status dashboard
- [ ] Automated compliance alerts
- [ ] Split operation segregation (if needed)
- [ ] 2-year record retention automation

---

## PRIORITY IMPLEMENTATION ROADMAP

### Phase 1: Critical Tracking (High Priority)
1. Add `floor_space_sqft` to housing_units table
2. Create `confinement_events` table (timestamp, sow_id, housing_unit_id, reason, duration)
3. Add location_history tracking (automatic log on housing transfer)
4. Implement space-per-pig calculation and alerts

### Phase 2: Compliance Monitoring (Medium Priority)
1. Create compliance_status calculation per sow
2. Build confinement hours tracking (6hr/24hr and 24hr/30day)
3. Add farrowing timeline validation
4. Create compliance alerts system

### Phase 3: Documentation & Reporting (Medium Priority)
1. Build per-animal audit trail report
2. Add transaction records module
3. Create certification document management
4. Build facility-wide compliance dashboard

### Phase 4: Export & Inspector Tools (Lower Priority)
1. Add PDF export for audit trails
2. Create inspector-ready report package
3. Build data retention/archival system (2-year)
4. Add bulk compliance verification tool

---

## REFERENCES

- [Creating an audit trail for your Prop 12 compliance](https://www.nationalhogfarmer.com/livestock-management/creating-an-audit-trail-for-your-prop-12-compliance)
- [California Prop 12: A Guide for Producers and Distributors](https://fsns.com/navigating-california-prop-12-a-guide-for-producers-and-distributors/)
- [What does it take to be Prop 12 compliant?](https://www.nationalhogfarmer.com/livestock-management/what-does-it-take-to-be-prop-12-compliant-)
- [Prop 12 Key Terms - CDFA](https://www.cdfa.ca.gov/AHFSS/AnimalCare/docs/Prop12_guidance_Keyterms.pdf)
- [California Prop 12 FAQ - CDFA](https://www.cdfa.ca.gov/AHFSS/AnimalCare/docs/prop_12_faq.pdf)
- [California's Prop 12 Fully in Effect](https://www.mcguirewoods.com/client-resources/alerts/2024/3/californias-prop-12-fully-in-effect/)

---

**Note:** This checklist is for informational purposes. Consult with legal counsel and third-party certifiers for official compliance guidance.
