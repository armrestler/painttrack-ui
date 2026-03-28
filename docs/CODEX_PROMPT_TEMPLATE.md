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

Important:
The current deployed UI is only a technical starter and its layout must NOT be preserved as the target product UI.
Do not keep the left settings sidebar as the main interaction model.
Keep the existing sync/storage/business logic as much as possible, but replace the current UI shell.

Goal:
Refactor the app UI to match the intended PaintTrack product direction:
top navigation, dedicated pages/tabs, and modal-based request editing.

Required UI direction:
0. Check as reference our old UI that had desired design in
painttrack_refactored.html
1. Replace the current left sidebar layout.
2. Add a top header navigation with tabs:
   - Заявки
   - Заводи
   - Налаштування
3. Keep sync status and key actions in the header area:
   - sync badge
   - save/sync action
   - new request action
4. Main Requests page should contain:
   - KPI cards
   - filters/search row
   - requests table
5. Settings must be a separate page/tab, not a persistent sidebar block.
6. Request editing must open in a modal or large overlay, not in the main page column.
7. Remove Raw snapshot from the main UI.
   - If needed, keep it as a hidden developer/debug section or omit it entirely for now.
8. Keep the current working sync flow and local persistence behavior.
9. Do not redesign data contracts in this task.
10. Do not implement new business features in this task beyond what is needed to support the new UI structure.

Use as visual/product reference:
- the uploaded/refactored PaintTrack HTML design already discussed in this project
- dark theme
- compact top navigation
- KPI cards
- filters + table
- large structured request modal

Constraints:
- Focus on UI shell/layout refactor only.
- Keep changes incremental enough to review.
- Reuse current modules where possible.
- Do not migrate to React or another framework.

Before coding:
1. List exactly which files you will change.
2. Explain how you will preserve current sync/storage logic.
3. Then implement.

After coding:
1. Summarize the new UI structure.
2. Mention any old starter elements intentionally removed.
3. Mention what remains for the next phase.
