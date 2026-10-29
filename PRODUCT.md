# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Alejandro coordinates work assigned to humans and AI agents. Agents connect through MCP; their names and instructions are configured dynamically in the database.

## Product Purpose

Make it clear who owns every task, what it depends on, and what can start now. A task always has one responsible human or agent.

## Operating Context

The authenticated web interface manages work and dependencies. MCP clients create and update responsible parties and tasks. External clients may periodically check for available work; this application does not schedule or invoke models. The management panel polls the server at a controlled interval while retaining active forms.

## Capabilities and Constraints

Preserve task descriptions, configured workflow states, properties, statistics, REST access, MCP access. Migrate existing assignments; Alejandro is the confirmed fallback only for legacy unassigned tasks. Responsible parties have editable names, kind, descriptions/instructions and a selected color. Task nodes use their assignee color with readable foreground text. Dependencies are persisted relationships and cannot form cycles. A task may have an optional independent human or agent reviewer; only approval completes reviewed work and unlocks dependents. Requested changes return work to its original owner with feedback. Edits invalidate old approvals. All UI uses HeroUI v3 and Tailwind CSS 4 on the existing Next.js/React stack. English and Spanish, keyboard interaction and phone layouts remain supported. Preserve task camera position, selection and typed drafts during ordinary background synchronization. Read-only inspection remains nonmodal; editing protects unsaved input.

Projects can be removed through Organize, MCP or REST. A populated project requires a different existing destination; its active tasks and completed history move atomically before the project is removed. Task content, ownership, workflow states, completion dates, properties and dependency edges are preserved. The legacy default project and last remaining project are protected. Pending or approved reviews require an explicit move through the task editor and its review-invalidation flow before removal. The UI asks for a destination and confirmation, retains the selected destination on error and refreshes only after success. If the selected project disappears, the workspace returns to all projects. New tasks created from all projects prefer the existing Miscelánea project, with the legacy default as fallback.

The app supports optional standalone installation using launcher icons derived from the original PNG. Installation is offered only after a real browser prompt becomes available and an explicit user action. The service worker caches only the static offline document and public launcher icons, fetched without session credentials. Task data, tokens, authenticated HTML, API responses and RSC payloads never enter Cache Storage. Offline task viewing and editing are unsupported; failed document navigation shows a bilingual public fallback. Updates wait for existing windows to close and never reload an active draft. Integration and lifecycle details are documented in `docs/pwa.md`.

## Brand Commitments

The user explicitly replaced the brutalist direction with a minimalist, graph-first interface: actual task nodes and dependency edges, clear assignees, project grouping, and minimal chrome. The user selected the work-routes structure and rejected excessive rules, borders and explanatory copy. The subsequent whole-app redesign retains that composition with mineral green neutrals, forest accents, Geist typography, soft depth and purposeful spatial motion. Tasks, statistics, connections and authentication share coherent light and dark palettes.

The original artwork in `src/app/icon.png` is the permanent app identity and appears through the shared `AppLogo` component in workspace navigation, login, statistics, API access, API documentation and skill headers. Preserve its artwork and proportions. Never place periods in titles, subtitles or brand marks, including decorative dot separators. This preference is global and permanent.

## Product Principles

- Compute readiness in the server, consistently across web, MCP and REST.
- Every task has a responsible party; humans and agents share the same assignment model.
- Assign recorded work to existing projects by content; use Miscelánea when none of the other projects fits.
- Simple Tasks, Simple Finance and Book Recorder work belongs in Miscelánea on the current board. Do not create projects with those names or a new project merely to track a chat unless the user explicitly requests it.
- Expose the dependency or manual reason that prevents work starting.
- Keep configuration dynamic and avoid binding the product to agent names or model providers.
- Preserve user input during background synchronization.
- Keep task ownership and written workflow states legible without relying on color.
- Give dependency paths dedicated opaque contrast tokens because they communicate relationships, while quiet divider tokens frame supporting structure.
- Keep statistic actions in one named menu with accessible 44px targets so titles and values retain room on narrow cards.
- Let project names wrap to their own row on phones; place edit and delete actions below the name.
- Use a focused HeroUI client link boundary inside server-rendered pages, retaining page data loading and metadata on the server.
- Respect reduced motion and maintain accessible named navigation on phones and tablets.
- Keep visual tokens and reusable component guidance in `design.md`, with unsupported token extensions in `.impeccable/design.json`.
- Separate navigation, graph layout, camera state, polling and editing through focused interfaces and composition; retain existing server contracts.

## Open Decisions

The user selected a minimalist dependency graph as the management composition. Responsible names and descriptions will be managed later by the user.
