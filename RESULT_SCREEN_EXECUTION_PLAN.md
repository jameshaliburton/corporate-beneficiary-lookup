# Product Results Screen – Execution Plan

## Overview
This plan outlines the step-by-step process to design and implement a mobile-friendly, modular product results screen for the OwnedBy webapp, following the detailed requirements provided.

---

## 1. Component Structure
- **ProductResultScreen** (main container)
  - **ProductHeader**: Product name, brand, country (flag), barcode
  - **OwnershipTrail**: Visual hierarchy of ownership chain (pills/cards/rows)
  - **ConfidenceAttribution**: Confidence badge/bar, tooltip, confirm/flag actions
  - **ProcessTrace**: Collapsible table of agent steps, status, reasoning, time
  - **ErrorFallback**: Error and fallback messages/actions
  - **ManualEntryForm**: For failed/partial lookups
  - **StickyActionBar**: Retry, confirm, flag, manual entry (always visible)

---

## 2. Data Flow
- Accept all data as props (or via context) for easy integration with scan/lookup pipeline
- Support both real and mock data for development/testing
- Each subcomponent receives only the data it needs

---

## 3. UX Flow
- Show results screen **only after** a scan/manual entry
- Fallback to error/manual entry UI if lookup fails or is incomplete
- Sticky action bar always visible for retry, confirm, flag, or manual entry
- Allow user to return to scan/start screen at any time

---

## 4. Visual & Mobile-First
- Mobile-first layout with vertical scrolling
- Section headers with emoji and clear separation
- Badges/pills for company type, confidence, etc.
- Collapsible process trace for clean UX
- Light-tinted backgrounds and clear sectioning

---

## 5. Error States & Fallbacks
- Handle all error/partial scenarios:
  - Barcode not found → manual entry
  - Product found, brand missing → manual brand entry
  - Brand found, no ownership → flag/suggest owner
  - API/server error → retry option
- Always provide a fallback path

---

## 6. Step-by-Step Implementation

### Step 1: Scaffold Components
- Create `ProductResultScreen/` directory with subcomponents:
  - ProductHeader.tsx
  - OwnershipTrail.tsx
  - ConfidenceAttribution.tsx
  - ProcessTrace.tsx
  - ErrorFallback.tsx
  - ManualEntryForm.tsx
  - StickyActionBar.tsx
- Main `ProductResultScreen.tsx` composes these

### Step 2: Mock Data & UI
- Implement each subcomponent with mock data and props
- Style for mobile, use emoji headers, badges, sticky bar

### Step 3: Integrate with Scan/Lookup Flow
- Plug the new `ProductResultScreen` into the pipeline
- Show only after a scan/manual entry
- Pass real data as props

### Step 4: Fallbacks & Error Handling
- Implement error and fallback states per requirements
- Show manual entry form when needed

### Step 5: Functional Testing
- Test all flows: success, partial, error, manual entry, retry, confirm, flag
- Adjust based on feedback

---

## 7. Future Enhancements (Optional)
- "Watch this brand" (bookmarking)
- "Why we track this" education modal
- "Similar products" link

---

**This file will be used as a reference and checklist for implementation.** 