# AGENTS.md

## Project
PaintTrack — browser-based internal application for managing paint production requests for a Ukrainian paint manufacturer.

## Current product direction
This is not a simple CRUD demo anymore. Treat it as a lightweight production request / planning / shipment tracking system with:
- requests
- request items
- supporting materials
- approvals
- production vs shipment tracking
- Excel import/export
- GitHub-based sync for data

## Repositories
- `painttrack-ui` — public repo, browser app, hosted via GitHub Pages
- `painttrack-data` — private repo, stores operational data (`data.json` initially)

## Runtime model
- User opens one browser URL on home and work computers
- App stores local cache in browser storage
- App syncs with GitHub data repo:
  - on open
  - on explicit Sync button
  - later also after Save
- Do not assume a backend exists
- Backend may be added later, so keep infrastructure isolated

## Non-negotiable engineering rules
1. Keep UI logic separate from business logic
2. Keep domain rules out of components and DOM handlers
3. Prefer pure functions for validation and calculations
4. Build for incremental migration, not big rewrites
5. Preserve compatibility with existing stored data where possible
6. Any data shape change should consider `schemaVersion` and migration impact
7. Keep naming explicit and business-readable

## Architecture target
Use pragmatic clean architecture:

### Domain
Entities and core rules only:
- Request
- RequestItem
- SupportingMaterial
- MaterialAllocation
- ApprovalState
- ShipmentRecord

### Application
Use cases / workflows:
- create request
- update request
- add item
- update item
- import from excel
- approve request
- save data
- sync with github
- export report

### Infrastructure
Adapters only:
- browser storage / IndexedDB
- GitHub contents API sync
- Excel import/export
- time/date helpers
- schema migrations

### UI
Presentation layer only:
- screens
- forms
- tables
- filters
- modals
- print/export triggers

## Business language
Prefer these terms in code and UI:
- Request
- Request Item
- Supporting Materials
- Allocation
- Factory
- Produced Qty
- Shipped Qty
- Desired Date
- Approval

Avoid vague generic terms like:
- thing
- record item
- aux
- misc data

## Key domain rules
1. A request contains many request items
2. Supporting materials belong to a request item
3. A supporting material can have multiple allocations by source
4. Allocation is not a single select mode
5. `sum(allocations.qty)` must equal supporting material `requiredQty`
6. `shippedQty` cannot exceed produced quantity or total available quantity, depending on final implementation
7. Request approval flow includes:
   - sales
   - coordinator
   - technologist
8. Treat overdue logic as domain/application logic, not UI-only formatting
9. Keep sync metadata separate from business entities

## Data and sync constraints
- Operational data lives in `painttrack-data`
- Initial source of truth is `data.json`
- Sync uses GitHub repo contents API
- Writes should be treated as serial operations
- Remote revision / SHA tracking matters
- Preserve local dirty state and sync metadata clearly

## User profile
Primary real user is a non-technical operator (the user's mother).
This means:
- simple UI
- low-friction workflow
- no git, npm, terminal, or local repo usage by the operator
- safe defaults
- visible sync status
- understandable validation messages

## How to work in this repo
When making changes:
1. Read `docs/PROJECT_CONTEXT.md`
2. Read relevant domain and application files first
3. Explain proposed structure briefly before large refactors
4. Prefer small, reviewable commits
5. Do not collapse architecture layers for convenience
6. If a quick hack conflicts with maintainability, prefer maintainability

## Response style for this project
When suggesting code:
- be concrete
- use production-oriented naming
- avoid overengineering
- avoid academic abstractions unless they clearly pay off
- optimize for clarity and future growth
