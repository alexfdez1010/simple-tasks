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

Preserve task descriptions, configured workflow states, properties, statistics, REST access, MCP access and task webhooks. Migrate existing assignments; Alejandro is the confirmed fallback only for legacy unassigned tasks. Responsible parties have editable names, kind, descriptions/instructions and a selected color. Task nodes use their assignee color with readable foreground text. Dependencies are persisted relationships and cannot form cycles. A task may have an optional independent human or agent reviewer; only approval completes reviewed work and unlocks dependents. Requested changes return work to its original owner with feedback. Edits invalidate old approvals. All UI uses HeroUI v3 and Tailwind CSS 4 on the existing Next.js/React stack. English and Spanish, keyboard interaction and phone layouts remain supported.

## Brand Commitments

The user explicitly replaced the brutalist direction with a minimalist, graph-first interface: actual task nodes and dependency edges, clear assignees, project grouping, and minimal chrome. The user selected the work-routes structure and rejected excessive rules, borders and explanatory copy.

## Product Principles

- Compute readiness in the server, consistently across web, MCP and REST.
- Every task has a responsible party; humans and agents share the same assignment model.
- Expose the dependency or manual reason that prevents work starting.
- Keep configuration dynamic and avoid binding the product to agent names or model providers.
- Preserve user input during background synchronization.

## Open Decisions

The user selected a minimalist dependency graph as the management composition. Responsible names and descriptions will be managed later by the user.
