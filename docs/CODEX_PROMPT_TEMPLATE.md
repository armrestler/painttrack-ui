# CODEX_PROMPT_TEMPLATE.md

Use this as a starting prompt inside Codex when opening the PaintTrack repo.

---

Please read `AGENTS.md` and `docs/PROJECT_CONTEXT.md` first.

Project goal:
We are building PaintTrack, a browser-based internal app for managing paint production requests. The app is used by a non-technical operator and syncs operational data through a separate private GitHub data repo.

Important constraints:
- keep clean separation between UI, application, domain, and infrastructure
- do not put business rules into UI handlers
- preserve simple operator UX
- use the term "Supporting Materials"
- supporting material sourcing must use `allocations[]`, not a single source mode

Current task:

Read AGENTS.md and docs/PROJECT_CONTEXT.md first.

This repository already has working GitHub sync, local persistence, and a minimal starter UI.
Do not replace the current architecture, do not introduce frameworks, and do not rewrite the app.
Keep the current modular vanilla JavaScript structure and make a small incremental change.

Goal:
Implement the first usable Request Editor on top of the current starter version.

Scope:
1. Keep the current left sidebar with GitHub settings and sync actions.
2. Keep the current requests table, but make each request row clickable.
3. Add a "Створити заявку" action that creates a real empty request instead of using only the test request button.
4. Add a Request Details panel for the selected request.
5. In Request Details, support editing these request-level fields:
    - number
    - customerName
    - factoryName
    - status
    - note (new optional field)
    - priority/sequnce (all the Requests can have different priorities/sequnce, e.g., high, medium, low for its factories, sales department can change it depending on ongoing needs)
6. In Request Details, add basic item management:
    - show request items in a table
    - add item
    - edit item inline or in a simple form
    - delete item
7. For each item, support these fields:
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
8. Add basic validation rules in application/domain logic, not directly in render code:
    - shippedQty must not be greater than producedQty
    - quantity must not be negative
    - producedQty must not be negative
    - shippedQty must not be negative
9. Persist all edits to the existing local state and local storage.
10. Do not change GitHub sync behavior except wiring the new edited state into the already existing save/sync flow.

Important constraints:
- Do not implement Supporting Materials yet.
- Do not modify the remote data contract more than necessary.
- If a new optional field is needed, keep it backward-compatible.
- Do not break existing sync-on-open, manual sync, or snapshot rendering.
- Keep changes small and easy to review.
- Prefer extending existing modules over introducing many new abstractions.

Before coding:
1. Summarize the exact files you will change.
2. State any minimal data shape extension you need.
3. Then implement.

After coding:
Provide a short summary of what was added and what was intentionally left for the next phase.

Before coding:
1. briefly summarize the relevant existing structure
2. mention which files you plan to touch
3. keep the change small and reviewable
