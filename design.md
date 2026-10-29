---
name: 'Tasks'
description: 'Minimal dependency workspace with retained editorial integration and statistics surfaces.'
colors:
  workspace-background-light: '#f6f7f8'
  workspace-foreground-light: '#252a30'
  workspace-surface-light: '#ffffff'
  workspace-surface-secondary-light: '#eef0f2'
  workspace-surface-tertiary-light: '#e5e8ec'
  workspace-muted-light: '#626a74'
  workspace-divider-light: '#d9dee4'
  workspace-accent-light: '#35654e'
  workspace-accent-foreground-light: '#ffffff'
  workspace-background-dark: '#191c20'
  workspace-foreground-dark: '#e7e9ed'
  workspace-surface-dark: '#24282e'
  workspace-surface-secondary-dark: '#2d3239'
  workspace-surface-tertiary-dark: '#383f48'
  workspace-muted-dark: '#aab3bf'
  workspace-divider-dark: '#414953'
  workspace-accent-dark: '#9ec5ac'
  workspace-accent-foreground-dark: '#17261d'
  retained-background-light: 'oklch(0.975 0.008 80)'
  retained-foreground-light: 'oklch(0.22 0.012 65)'
  retained-surface-light: 'oklch(0.995 0.004 80)'
  retained-surface-secondary-light: 'oklch(0.955 0.009 78)'
  retained-surface-tertiary-light: 'oklch(0.93 0.012 76)'
  retained-muted-light: 'oklch(0.52 0.018 65)'
  retained-divider-light: 'oklch(0.83 0.014 72)'
  retained-accent-light: 'oklch(0.54 0.11 155)'
  retained-accent-foreground-light: 'oklch(0.99 0.004 80)'
  retained-danger-light: 'oklch(0.55 0.19 28)'
  retained-background-dark: 'oklch(0.17 0.012 70)'
  retained-foreground-dark: 'oklch(0.94 0.008 80)'
  retained-surface-dark: 'oklch(0.22 0.012 70)'
  retained-surface-secondary-dark: 'oklch(0.255 0.013 70)'
  retained-surface-tertiary-dark: 'oklch(0.29 0.014 70)'
  retained-muted-dark: 'oklch(0.72 0.015 75)'
  retained-divider-dark: 'oklch(0.36 0.014 70)'
  retained-accent-dark: 'oklch(0.72 0.11 155)'
  retained-accent-foreground-dark: 'oklch(0.17 0.012 70)'
  retained-danger-dark: 'oklch(0.7 0.16 28)'
  graph-edge-light: '#aab3bf'
  graph-edge-dark: '#596472'
typography:
  workspace-title:
    fontFamily: 'Geist, sans-serif'
    fontSize: '18px'
    fontWeight: 600
    lineHeight: '28px'
    letterSpacing: '-0.025em'
  node-title:
    fontFamily: 'Geist, sans-serif'
    fontSize: '14px'
    fontWeight: 500
    lineHeight: '20px'
  node-meta:
    fontFamily: 'Geist, sans-serif'
    fontSize: '11px'
    lineHeight: 'normal'
  body:
    fontFamily: 'Geist, sans-serif'
    fontSize: '14px'
    lineHeight: '20px'
  page-title:
    fontFamily: 'Geist, sans-serif'
    fontSize: '30px'
    fontWeight: 600
    lineHeight: '36px'
    letterSpacing: '-0.025em'
  statistics-title:
    fontFamily: 'Geist, sans-serif'
    fontSize: 'clamp(2rem, 4vw, 3.5rem)'
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: '-0.065em'
  statistics-value:
    fontFamily: 'Geist, sans-serif'
    fontSize: 'clamp(2rem, 20cqi, 5rem)'
    fontWeight: 550
    lineHeight: 1.05
    letterSpacing: '-0.04em'
  mono:
    fontFamily: 'Geist Mono, monospace'
    fontSize: '12px'
    lineHeight: '24px'
rounded:
  control: '8px'
  node: '12px'
  sheet: '16px'
  api-panel: '20px'
  statistics: '24px'
  avatar: '9999px'
spacing:
  1: '4px'
  '1.5': '6px'
  2: '8px'
  3: '12px'
  4: '16px'
  5: '20px'
  6: '24px'
  7: '28px'
  8: '32px'
components:
  button-primary:
    backgroundColor: '{colors.workspace-accent-light}'
    textColor: '{colors.workspace-accent-foreground-light}'
    rounded: '{rounded.control}'
    height: '44px'
    padding: '0 16px'
    typography: '{typography.body}'
  button-secondary:
    backgroundColor: '{colors.workspace-surface-secondary-light}'
    textColor: 'color-mix(in oklab, #35654e 70%, #252a30 30%)'
    rounded: '{rounded.control}'
    height: '44px'
    padding: '0 16px'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.workspace-foreground-light}'
    rounded: '{rounded.control}'
    height: '44px'
    padding: '0 16px'
  workspace-search:
    backgroundColor: '{colors.workspace-surface-secondary-light}'
    textColor: '{colors.workspace-foreground-light}'
    rounded: '{rounded.node}'
    padding: '8px 12px'
    typography: '{typography.body}'
  workspace-navigation:
    textColor: '{colors.workspace-foreground-light}'
    padding: '12px'
    typography: '{typography.body}'
  graph-node:
    backgroundColor: 'color-mix(in oklab, var(--assignee-color) 13%, var(--surface))'
    textColor: '{colors.workspace-foreground-light}'
    rounded: '{rounded.node}'
    padding: '16px'
    width: '244px'
    height: '128px'
    typography: '{typography.node-title}'
  graph-controls:
    backgroundColor: '{colors.workspace-surface-light}'
    rounded: '{rounded.node}'
    padding: '4px'
  statistics-card:
    backgroundColor: 'color-mix(in oklab, var(--surface) 76%, transparent)'
    textColor: '{colors.retained-foreground-light}'
    rounded: '{rounded.statistics}'
    padding: '24px'
---

# Design System: Tasks

## Overview

**Creative North Star: "Work routes"**

A minimal operating canvas makes real tasks, responsible parties and prerequisites visible together. Cool neutrals, softly elevated nodes and compact Geist typography give the graph room; owner-selected tints identify responsibility without colouring the text. The user rejected brutalism, decorative rules and explanatory dashboard filler.

The workspace theme is local to the graph and its themed editing/management surfaces. Statistics keeps its existing warm mineral-glass presentation; Connections, API access, API documentation and authentication keep the shared warm editorial foundation. This document captures those boundaries rather than prescribing a whole-app reskin.

**Key Characteristics:**

- Actual directed dependencies and project lanes.
- Readable native-scale entry, with an explicit overview control.
- Quiet chrome, dynamic owner colours and full-contrast task text.
- Persistent drafts and graph context during background synchronization.

Authority: [PRODUCT.md](./PRODUCT.md), the [workspace direction contract](./.impeccable/surfaces/src-app-page-tsx.md), and implemented code. This is a scan of the finished world, refreshed on 2026-10-29. It supersedes the previous Kanban composition and stale workspace glass guidance.

## Colors

The normative frontmatter preserves the source formats: workspace hex and retained-surface OKLCH. Keys ending in `light`/`dark` are paired by `prefers-color-scheme`; the palette is not a manual per-page toggle.

- **Primary — forest / sage:** `workspace-accent-*` drives New task, ready text, selected outlines and active dependency edges. Its paired foreground supplies action contrast.
- **Identity:** each persisted HUMAN or AGENT has a selected colour. Node surfaces mix it with the workspace surface in OKLab: 13% at rest, 19% on hover, 20% for related nodes. These are tint ratios, not alpha on the whole node. Names, instructions and colours remain user-managed.
- **Neutral — cool canvas / white node / ink:** `workspace-background-*`, `workspace-surface-*` and `workspace-foreground-*` define the graph. Secondary and tertiary surfaces distinguish fields and hover; muted identifies metadata; divider serves structural form separation where needed.
- **Edges:** `graph-edge-*` is the quiet connector colour; selected incoming/outgoing paths use the workspace accent. Path stroke is 1.4px, increasing to 2px when active.
- **Retained neutrals and forest:** `retained-*` is the current global foundation for Statistics, Connections, API and auth surfaces. Danger remains the inherited global error/destructive colour even inside the workspace. Statistics also retains its six curated widget palettes in `statistics-widget-themes.css`; those are chart choices, not graph owner colours.

**The Context before colour Rule.** Owner tint supplements the written assignee and state; completed tasks keep full-opacity text.

## Typography

Geist is the display, body and control face; Geist Mono serves technical examples and statistics counts. Both load through `next/font`. There is no alternate workspace display font or fixed modular scale: the observed hierarchy uses metadata (11–12px), body/node titles (14px), application/inspector headings (18px), editor headings (20px), retained page headings (30px), and responsive statistics headings/values.

Node titles use medium weight and a two-line clamp; owner and reviewer names truncate within the node. The accessible node name retains title, assignee, state and reviewer. Full descriptions and editing belong in the task panel. Statistics values use tabular numerals and container units; exact localized values can wrap. Editor input/textarea text stays 16px, including phones.

**The Readable entry Rule.** Open the graph at scale 1, including constrained desktops and phones; Fit is the explicit full-graph overview.

## Layout

- **Workspace:** full viewport height (`100dvh`), with a 560px minimum. Header and filter toolbar precede a flexing, overflow-clipped graph (320px minimum). Desktop header uses 20px horizontal padding, expanding to 32px from 640px; vertical padding is 16px. Search caps at 256px, owner selector at 176px, project wrapper at 208px and sync selector at 112px.
- **Graph geometry:** nodes are 244 × 128px (1.90625:1), with 16px padding. Dependency ranks advance 314px horizontally (70px clear gap); rows advance 152px (24px gap). Project lanes begin at y=44px; nodes sit 38px below each label. Lanes use `50 + rowCount × 152px` height and a 36px inter-lane gap. Left inset is 40px. Graph bounds are at least 560 × 340px. Cubic directed edges connect prerequisite right centres to dependent left centres; cross-project relationships are real edges.
- **Framing:** initial and responsive framing keeps native text size, centring if space permits and anchoring the first node otherwise. Fit computes the complete overview, capped at scale 1. Zoom buttons use factors 0.8 and 1.25, centred on the viewport, clamped to 0.2–1.8. Pointer background dragging pans; task controls keep normal activation. Filters and empty/populated transitions establish a new frame; ordinary task membership updates retain the camera. Viewport resizing can reframe at native scale.
- **Inspection:** desktop panel is 360px wide with 24px padding. At 1024px and above, selecting an existing task reserves that width from the graph. Below 640px it becomes a fixed, nonmodal bottom sheet, maximum 78dvh, with 20px padding and 32px bottom padding. Intermediate widths retain the right overlay.
- **Phone header:** below 640px, brand and New task share the first row, full-width project selection occupies the second, named navigation the third. Header padding is 16px horizontal / 12px vertical. Filter controls wrap; labels visually hidden at this breakpoint retain accessible names. The graph stays spatial and pannable rather than stacking nodes into cards.
- **Protected editor:** below 768px, bottom-aligned drawer occupies up to 92dvh, respects visual viewport height and safe-area insets; at 768px it becomes a right drawer (`min(36rem, 70vw)`). Scrollable body and a separate action footer retain reachable Save/Cancel.
- **Retained routes:** Connections caps at 48rem and stacks its two integration paths with structural dividers. API management caps at 72rem, adding a 19rem reference column from 1024px; API docs cap at 56rem. Statistics caps at 92rem; its single phone column becomes twelve columns at 900px. Automatic KPI/chart spans are 4/6; compact/square/wide/full spans are 3/4/6/12. Square uses a 1:1 minimum proportion; content can expand. Donut legends become side-by-side only when their own container reaches 32rem.

## Elevation & Depth

The graph uses opaque tonal layering and small shadows, without a glass backdrop or decorative canvas texture. Node rest shadow is `0 3px 12px #1a25340a, 0 1px 3px #1a253408`; hover is `0 5px 18px #1a253410`. Canvas controls use `0 3px 15px #1a25340b`; the inspector uses `-5px 0 30px #1a253408`. Workspace buttons explicitly remove shadows.

Statistics retains `glass-panel`: an opaque fallback, a one-pixel edge, illuminated inset highlights and `0 8px 32px var(--glass-shadow)`. When supported, its surface is a 76% surface mix with 24px blur / 115% saturation, behind crisp opaque data. Two low-contrast forest radial washes belong only to Statistics. Reduced transparency removes its blur; forced colours replace glass with system surfaces and borders.

**The Scoped materials Rule.** Opaque graph surfaces and retained Statistics glass coexist; do not spread either treatment to unrelated routes.

## Shapes

Workspace controls use compact 8px corners, nodes and canvas-control trays 12px, the phone inspector/editor sheet and management modal 16px. Owner initials occupy a 20px circular avatar. API panels retain 20px corners and Statistics cards/header 24px. Fields inherit HeroUI's 12px field radius. Keep nesting intentional; the graph's blank canvas needs no enclosing frame.

## Components

### Buttons, navigation and fields

HeroUI v3 owns semantics, keyboard behavior and interactive states; use `onPress`, semantic variants and compound APIs. Workspace buttons and select triggers have a 44px minimum height. Primary actions use accent/foreground; secondary uses the default surface and HeroUI's derived accent-soft foreground; ghost stays transparent until hover. Library hover tokens derive from the current semantic palette. Standard button padding is 16px horizontally; frequent navigation remains visibly named, with 12px text on phones and 14px otherwise.

Fields use secondary surfaces, foreground text, muted placeholders, tertiary hover and an accent focus border. Workspace field borders are transparent at rest. Header and toolbar rows align by the visible controls at the bottom; search inputs, selectors and adjacent actions share 44px height, with the completed checkbox centred inside the same line. Keep labels and existing responsive wrapping. All HeroUI select triggers also centre their contents vertically at the shared global style boundary, so enlarged controls, editors and integration selectors retain centred text (SRP/OCP). Verify the text range rather than only the control box. Regression proof reproduced a 4px vertical offset before the fix; all ten localized desktop/phone cases pass after centring, including visible editor selectors. Build, lint-format, screenshots and scoped layout scan also passed. Verified with production build, lint-format, ten desktop/mobile layout cases in English/Spanish and desktop/phone captures; scoped layout scan returned no findings. HeroUI keeps focus, invalid, disabled and pending behavior. Reuse the existing controlled select/listbox composition for project, assignee, status and refresh choices. Management lives behind Organize with separate assignee/project tabs; instructions and selected colours are edited there.

### Task graph and panel

Each task is one HeroUI button with `aria-pressed` selection. Titles, written owner/state and optional reviewer carry the summary; a 2px accent outline with 2px offset marks selection. Related nodes receive the stronger owner tint. Selection emphasizes only real incoming/outgoing edges, and filtering retains prerequisite ancestors, including completed ancestors needed to explain visible work. Completed nodes retain full contrast.

The read-only inspector is an `aside`, preserving graph interaction. It moves focus to the heading; close/Escape returns focus to the node or New task fallback. Prerequisite buttons navigate to the selected task. Full editing uses the modal HeroUI drawer: outside dismissal is disabled, pending submission disables closure, Save/Cancel remain explicit, and failed saves keep the draft. Poll snapshots do not key/remount the open editor. Review feedback persists on rejected requests; stale pending review versions disable decisions with a visible message.

Optional independent review stays in the panel: `NOT_REQUESTED`, `PENDING`, `APPROVED`, `CHANGES_REQUESTED`. The reviewer can approve or request changes with feedback; approval gates completion, edits invalidate approval, and changes retain the original owner. The compact graph reviewer label does not replace the assignee.

### Synchronization and feedback

Default polling is 15 seconds; choices are 15/30/60 seconds or pause, plus manual Refresh. Requests do not overlap, unchanged snapshots deduplicate, hidden tabs suspend network checks, and failures display a recoverable status message. The hook records last successful synchronization internally; the current header does not display a timestamp. This interface does not invoke models or schedule cron work.

### Accessibility and retained components

A visible-on-focus skip link targets the graph landmark. Nodes and canvas controls are keyboard accessible; dependency lists provide textual navigation while SVG paths are decorative to assistive technology. Owner colour never substitutes for names or state text. Workspace reduced-motion rules remove descendant animation/transition durations; library controls also respect reduced motion. Preserve English/Spanish labels, locale-aware content and focus visibility. Do not equate focus availability with an unperformed full WCAG audit.

Statistics retains HeroUI cards, textual chart equivalents, tabular KPI values and user-selected widget definitions; Focus mode changes editing chrome without changing data. Connections provides only MCP and REST setup paths, without fabricated health. Webhooks were retired in commit `3949488`; historical SQL and ignored legacy tables are inert rollback context, not an active component or public integration path. The protected `/design-preview` route remains an isolated synthetic preview and does not mutate live work.

Finish evidence: the independent review resolved native-scale constrained views, completed-node contrast and polling camera resets, with disposition **ship** at that scope. The graph baseline passed 209 unit, 47 integration and 52 E2E tests; finish fixes passed 19 focused E2E checks, lint-format and production build. Six final desktop/phone, detail and dark captures live in `.impeccable/review/final-*.jpg`; sample records are synthetic in an isolated database. The route was deliberately code-first: no image comp was approved and no new raster asset ships. Existing app icon artwork is retained. These are scope-specific finish records, not a claim that every retained route was redesigned or re-audited.

Sources: `src/components/workspace/workspace-theme.css`, `workspace.css`, `graph-layout.ts`, `use-graph-camera.ts`, panel/editor/polling components; `src/app/globals.css`, `glass.css`; retained Statistics and Connections implementations. Sidecar ramps are generated previews only; they are not additional runtime colour tokens. Component snippets expand the actual styling for a framework-free preview; they are not alternate production components.

## Responsible-party deletion through MCP

`delete_assignee` removes an unused configured owner through the shared service;
REST exposes the same operation. Reassign owned or reviewed tasks, including
completed history, before deletion. The default owner remains protected for
legacy clients. Deletion also removes the name from legacy assignment SELECT
options in the same transaction. No new UI pattern or visual token is needed.

## Do's and Don'ts

### Do:

- Do use HeroUI v3 compound primitives and Tailwind CSS 4, with existing Geist fonts.
- Do render stored projects, owners and dependency relationships, retaining prerequisite ancestors when filtering.
- Do preserve camera position, selection and typed drafts through ordinary polling updates.
- Do keep English/Spanish labels, keyboard activation, visible focus and textual state cues.
- Do check native-scale entry and explicit Fit separately at desktop and phone sizes.

### Don't:

- Don't introduce brutalist framing, grid overlays, decorative rules or descriptive dashboard filler.
- Don't reduce completed-node opacity or use owner colour as the only identity signal.
- Don't auto-fit a populated graph when polling adds or removes tasks.
- Don't turn the inspector into a blocking modal or let outside clicks dismiss task editing.
- Don't hard-code agent names, schedule models or restore retired webhook UI.
- Don't describe Statistics or Connections as using the graph's cool palette.
