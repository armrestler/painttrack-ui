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
[replace this block with your task]

Before coding:
1. briefly summarize the relevant existing structure
2. mention which files you plan to touch
3. keep the change small and reviewable
