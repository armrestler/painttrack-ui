# PROJECT_CONTEXT.md

## Purpose
PaintTrack is a browser-based internal app for a paint manufacturing workflow. It started as a simple prototype, but the real process is significantly more complex and closer to a lightweight production request / planning system.

The app is intended to be usable by a non-technical operator on both home and work computers.

## Product scope at current planning stage
The product must support:

1. Requests
2. Request items inside each request
3. Supporting materials for each request item
4. Multi-source allocation of supporting materials
5. Approval flow
6. Produced vs shipped tracking
7. Excel import/export
8. GitHub-based sync
9. Local cache for offline / interrupted work

## Real workflow assumptions
A request is created for a factory and includes one or more product positions.

Typical product item fields:
- barcode
- product name
- packaging
- capacity
- quantity
- unit
- weight

Later, each item may also include:
- processing price
- desired date
- produced quantity
- shipped quantity
- status indicators
- supporting materials

## Supporting materials model
Use **Supporting Materials** as the user-facing term.

Do not model source as:
- company
- factory
- split

That is too weak.

Instead, each supporting material has:
- required quantity
- unit
- allocations[]

Example:
Supporting material: metal cans
Required qty: 1000

Allocations:
- factory: 333
- company: 667

Validation rule:
`sum(allocation.qty) === requiredQty`

This allows partial sourcing from multiple parties.

## Approval flow
Request approval is expected to include:
- sales approval
- coordinator approval
- technologist approval

Final implementation may require status transitions, timestamps, and audit info.

## Delivery model
### Code
- Stored in GitHub repo
- Versioned normally with branches / commits / tags

### Data
- Stored separately in private GitHub repo
- Initially in `data.json`
- May later move to a small backend

### User access
The operator should use:
- one browser URL
- one simple setup flow for token/config
- sync on open
- explicit sync button
- later likely autosync after save

The operator should not work with:
- git
- local repository clones
- terminal
- manual builds

## Sync model
Current intended model:
- load local cache first
- then check remote
- sync on app open
- sync on explicit button click
- later autosync after successful save

Important concerns:
- local dirty state
- remote revision tracking
- remote SHA tracking
- conflict detection
- schema migration safety

## Architecture target
The codebase should move toward this structure:

- `src/domain`
- `src/application`
- `src/infrastructure`
- `src/ui`

Suggested role separation:

### Domain
Pure business entities and rules

### Application
Use cases and orchestration

### Infrastructure
GitHub sync, storage, Excel adapters, migrations

### UI
Rendering and interaction only

## Core entities
### Request
- id
- number
- customer name
- factory name / id
- status
- approvals
- items[]
- createdAt
- updatedAt
- notes

### RequestItem
- id
- barcode
- name
- packaging
- capacity
- quantity
- unit
- weight
- processingPrice
- desiredDate
- producedQty
- shippedQty
- status
- supportingMaterials[]

### SupportingMaterial
- id
- itemId
- name
- type
- requiredQty
- unit
- allocations[]

### MaterialAllocation
- id
- sourceType
- sourceName
- qty

### ApprovalState
- salesApprovedAt
- coordinatorApprovedAt
- technologistApprovedAt

## Technical principles
1. Keep business rules testable without UI
2. Prefer pure validation and calculation functions
3. Keep sync and storage details outside domain logic
4. Keep naming business-readable
5. Add schema versioning early
6. Treat current prototype as foundation, not final architecture

## Immediate implementation priority
The first serious milestone after the starter sync repo is:

1. Real request editor
2. Request details screen
3. Request item editor
4. Supporting materials editor
5. Allocation editor
6. Save + sync reliability improvements
7. Validation layer

## What Codex should optimize for
- maintainable structure
- clear naming
- small refactors
- backward-safe data evolution
- minimal operator friction
- no unnecessary complexity
