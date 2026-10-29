---
name: 'Tasks — connected work'
description: 'A calm, precise workspace for people, agents and the work between them'
colors:
  background-light: '#f5f6f5'
  foreground-light: '#202724'
  surface-light: '#ffffff'
  secondary-light: '#edf0ed'
  tertiary-light: '#e3e9e4'
  muted-light: '#65716a'
  divider-light: '#dce3dd'
  graph-edge-light: '#7b8a80'
  accent-light: '#32654b'
  accent-foreground-light: '#ffffff'
  background-dark: '#151a17'
  foreground-dark: '#edf2ee'
  surface-dark: '#202823'
  secondary-dark: '#29332c'
  tertiary-dark: '#344237'
  muted-dark: '#a5b3a9'
  divider-dark: '#37473c'
  graph-edge-dark: '#73857a'
  accent-dark: '#afd4b6'
  accent-foreground-dark: '#151a17'
  offline-accent-foreground-dark: '#183321'
  danger-light: 'oklch(0.55 0.19 28)'
  danger-dark: 'oklch(0.7 0.16 28)'
  chart-forest-light: 'oklch(0.56 0.12 155)'
  chart-amber-light: 'oklch(0.62 0.12 70)'
  chart-ocean-light: 'oklch(0.57 0.12 235)'
  chart-coral-light: 'oklch(0.61 0.13 25)'
  chart-iris-light: 'oklch(0.55 0.1 315)'
  chart-forest-dark: 'oklch(0.74 0.11 155)'
  chart-amber-dark: 'oklch(0.78 0.11 75)'
  chart-ocean-dark: 'oklch(0.74 0.1 235)'
  chart-coral-dark: 'oklch(0.73 0.12 30)'
  chart-iris-dark: 'oklch(0.72 0.1 315)'
typography:
  title:
    fontFamily: 'Geist, sans-serif'
    fontSize: '32px'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '-0.035em'
  page-headline:
    fontFamily: 'Geist, sans-serif'
    fontSize: 'clamp(2rem, 3.6vw, 3rem)'
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: '-0.035em'
  body:
    fontFamily: 'Geist, sans-serif'
    fontSize: '14px'
    lineHeight: '20px'
  metadata:
    fontFamily: 'Geist, sans-serif'
    fontSize: '12px'
    lineHeight: '16px'
  node-title:
    fontFamily: 'Geist, sans-serif'
    fontSize: '14px'
    fontWeight: 500
    lineHeight: '20px'
    letterSpacing: '-0.01em'
  metric:
    fontFamily: 'Geist, sans-serif'
    fontSize: 'clamp(2rem, 20cqi, 5rem)'
    fontWeight: 550
    lineHeight: 1.05
    letterSpacing: '-0.04em'
  avatar:
    fontFamily: 'Geist, sans-serif'
    fontSize: '10px'
    fontWeight: 600
  fineprint:
    fontFamily: 'Geist, sans-serif'
    fontSize: '11px'
  chart-metadata:
    fontFamily: 'Geist, sans-serif'
    fontSize: '0.6875rem'
  wordmark:
    fontFamily: 'Geist, sans-serif'
    fontSize: '20px'
    letterSpacing: '-0.035em'
  wordmark-compact:
    fontFamily: 'Geist, sans-serif'
    fontSize: '18px'
    letterSpacing: '-0.035em'
  wordmark-phone:
    fontFamily: 'Geist, sans-serif'
    fontSize: '17px'
    letterSpacing: '-0.035em'
  title-mobile:
    fontFamily: 'Geist, sans-serif'
    fontSize: '28px'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '-0.035em'
  utility-headline:
    fontFamily: 'Geist, sans-serif'
    fontSize: '30px'
    fontWeight: 600
    lineHeight: '36px'
    letterSpacing: '-0.025em'
  offline-headline:
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    fontSize: '30px'
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: '-0.035em'
  connections-headline:
    fontFamily: 'Geist, sans-serif'
    fontSize: '2.75rem'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '-0.035em'
  metric-wide:
    fontFamily: 'Geist, sans-serif'
    fontSize: 'clamp(2.75rem, 16cqi, 6rem)'
    fontWeight: 550
    lineHeight: 1.05
    letterSpacing: '-0.04em'
  metric-empty:
    fontFamily: 'Geist, sans-serif'
    fontSize: 'clamp(2rem, 14cqi, 3.25rem)'
    fontWeight: 550
    lineHeight: 1.05
    letterSpacing: '-0.04em'
rounded:
  control: '10px'
  nested: '12px'
  node: '16px'
  canvas: '20px'
  mobile-sheet: '24px'
  color-swatch: '0.35rem'
  miniature: '0.2rem'
  chart-detail: '0.875rem'
spacing:
  unit: '4px'
  control-gap: '8px'
  group-gap: '12px'
  mobile-gutter: '16px'
  panel-padding: '24px'
  desktop-gutter: '32px'
components:
  button-primary:
    backgroundColor: '{colors.accent-light}'
    textColor: '{colors.accent-foreground-light}'
    rounded: '{rounded.control}'
    padding: '0 16px'
    height: '44px'
  button-secondary:
    backgroundColor: '{colors.secondary-light}'
    rounded: '{rounded.control}'
    padding: '0 16px'
    height: '44px'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.foreground-light}'
    rounded: '{rounded.control}'
    padding: '0 16px'
    height: '44px'
  workspace-search:
    backgroundColor: '{colors.secondary-light}'
    textColor: '{colors.foreground-light}'
    rounded: '{rounded.control}'
    padding: '8px 12px 8px 40px'
    height: '44px'
  workspace-navigation:
    textColor: '{colors.muted-light}'
    rounded: '{rounded.control}'
    padding: '0 12px'
    height: '44px'
  task-state:
    textColor: '{colors.accent-light}'
  graph-node:
    textColor: '{colors.foreground-light}'
    rounded: '{rounded.node}'
    padding: '14px 16px'
    width: '244px'
    height: '128px'
    typography: '{typography.node-title}'
  graph-controls:
    backgroundColor: '{colors.surface-light}'
    rounded: '{rounded.node}'
    padding: '6px'
  statistics-card:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.foreground-light}'
    rounded: '{rounded.node}'
    padding: '24px'
---

# Tasks — connected work

## Overview

**Creative North Star: "Work routes"**

The interface is a quiet working instrument for real tasks, responsible parties and prerequisites. A persistent navigation rail frames a spacious dependency map. Mineral green neutrals, forest accents, precise Geist typography and soft physical depth make relationships easier to follow without turning the workspace into a dashboard of decorative information.

Tasks, statistics, connections and authentication share the same light and dark palette. Stored owner colors remain identity signals inside that system. The original PNG artwork in `src/app/icon.png` remains the app identity and appears through `AppLogo`; preserve its artwork and proportions. Titles, subtitles and brand marks never contain periods or decorative dot separators.

**Key Characteristics:**

- Real dependency paths, project context and explicit responsibility
- A calm navigation frame around an expressive, readable map
- Soft surface depth and brief, purposeful spatial feedback
- Continuous graph context and preserved drafts during synchronization

## Colors

Forest accents give the interface one clear action voice; green mineral neutrals carry most of the screen. The frontmatter is normative and follows `src/app/globals.css`; preserve its hex and OKLCH source formats.

### Primary

Use the accent for the primary action, selected-node outlines, active relationship paths, ready states and visible keyboard focus. Dark mode changes the accent to pale sage and uses the dark background color for its text. Shared HeroUI semantic variants provide hover and disabled states. The self-contained public offline page retains its separately declared dark action-text token, `offline-accent-foreground-dark`; it does not inherit the authenticated application stylesheet.

### Secondary

The five chart colors distinguish data series. Configurable statistic widgets retain their stored Forest, Ocean, Iris, Amber, Coral or Graphite palette and format; these are data presentation choices, not competing application themes. Owner colors are also database-backed, never hard-coded to agent names.

### Neutral

The background frames opaque surfaces, secondary surfaces hold quiet controls and tertiary surfaces give hover feedback. Foreground text carries content; muted text carries context. Dividers support fields and settings where structure needs a boundary, without adding ornamental rules to the workspace. The offline card has no visible border in standard color modes; forced colors adds system-color boundaries. A computed default border color with zero border width is not a visible palette choice.

Dependency paths use the dedicated opaque graph-edge token in each theme. They convey actual task relationships and need stronger contrast than decorative dividers. Preserve at least 3:1 contrast against the map base; selected paths use the accent and retain textual dependency navigation as an equivalent way to follow relationships.

**The Context before color Rule** Owner tint supplements the written assignee and state; completed tasks retain full-opacity text. Danger colors identify errors and destructive actions.

## Typography

Geist is the interface face, loaded through Next.js font variables with a sans-serif fallback. Geist Mono remains available for technical examples. Page headlines use a tighter editorial rhythm, while task titles stay compact and readable at native graph scale. Statistics values use tabular numerals and container-relative sizing.

The frontmatter records the desktop task title, secondary page headline, body, metadata, node title and KPI roles. The task title reduces to 28px below the phone breakpoint. Fields retain 16px text on phones; compact 14px field text begins at 640px. Labels and dynamic counts never become substitutes for accessible names.

Compact type roles are intentional and local. The avatar token is reserved for graph initials. Fineprint covers 11px node states, project counts, inspector timestamps, footer context and compact phone controls; chart metadata preserves the equivalent `0.6875rem` source spelling for chart labels and shares. Do not use these roles for descriptions, forms or primary task text.

The wordmark has desktop, compact-navigation and phone roles. Utility headlines cover the 30px API and skill headings, while the offline page uses its explicit 30px system-font headline. Connections uses its larger headline role from 640px and the existing 2rem size below that breakpoint. Wide and Full KPI cards use `metric-wide` from the statistics desktop breakpoint; an empty KPI uses `metric-empty`, caps its line length at 12ch and wraps long text. These semantic variants preserve the implemented endpoints rather than introducing a second general-purpose type scale.

**The Readable entry Rule** Enter a populated graph at scale 1; Fit is the explicit overview action. Keep project, responsible-party and refresh selectors labelled even when their labels are visually hidden.

## Layout

Desktop uses a 224px navigation rail and an inset surface that fills the viewport. The workspace has a 12px outer inset and 32px header and toolbar gutters. The map takes the remaining height, with small independent gutters so controls do not compete with the graph. Actual project links and task counts live in navigation.

Below 1100px, navigation becomes a compact top row. At intermediate widths it wraps into a dedicated named navigation row. Below 640px, the workspace uses 16px horizontal gutters, filters form useful rows and the project selector takes a full row. Support 320px screens without clipping actions or shrinking task geometry.

Task nodes remain 244 × 128px, arranged by dependency rank and project lane. The camera supports panning, explicit zoom and Fit. Ordinary polling retains the camera, selection and typed drafts. Filtering keeps prerequisite ancestors so the visible work remains explainable.

The read-only inspector is a 360px right surface. At 1024px and above the map reserves 376px for it; on phones the inspector rises as a bottom sheet with at most 78dvh height and safe-area padding. Editing uses the protected HeroUI drawer with explicit save and cancel actions.

Statistics uses a centered container of at most 92rem. Below 900px widgets stack; from 900px a 12-column grid supports the stored Compact, Square, Wide and Full footprints. Keep real widget configuration, ordering and data.

## Elevation & Depth

Opaque surfaces and diffuse shadows provide depth across routes. Task nodes lift slightly under a pointer, while the inspector and camera tray sit above the map. Statistics cards share the mineral surfaces; do not restore the former warm glass treatment. Forced colors replaces shadows with visible system-color boundaries.

The sidecar records exact shadows from `workspace.css`, `workspace-graph.css`, `workspace-detail.css`, `glass.css` and `interaction.css`. It also owns motion and breakpoint extensions that the frontmatter schema cannot represent.

**The Purposeful motion Rule** Motion explains arrival, selection and spatial relationships. Use the shared `cubic-bezier(0.16, 1, 0.3, 1)` easing, short state transitions and one-shot entrances. Node arrival takes 600ms with a bounded 24ms stagger; relationship emphasis takes 700ms; the inspector takes 360ms. Polling must not replay arrivals. Reduced motion removes workspace animation and transforms and reduces global durations; surfaces remain opaque.

## Shapes

Gently rounded controls use the control token. Nodes, statistic cards and the inspector share the node radius; the outer workspace and graph use the canvas radius. Nested dependency buttons and camera buttons use the nested radius. Phone sheets use the larger top-corner radius with square lower edges. Avatars and semantic status indicators may be round; they are information, not decorative punctuation. Smaller radii are reserved for small graphics: `color-swatch` shapes statistic palette samples, `miniature` shapes size previews and chart legend markers, and `chart-detail` shapes chart empty-state containers. They do not replace the main control and surface radii.

SVG controls share a rounded 1.6px line system. The original PNG remains the brand artwork, with an empty alternative because the adjacent wordmark or link supplies the accessible name.

## Components

Use HeroUI v3 and Tailwind CSS 4. Import components directly, compose `Card.Header` and `Card.Content`, use semantic variants and handle activation with `onPress`. Shared primitives require no additional HeroUI provider.

### Buttons

Primary buttons use the forest accent; secondary buttons use quiet surfaces; ghost buttons let navigation and supporting actions recede. Controls are at least 44px high. Hover changes color or depth, focus has a visible two-pixel outline with a three-pixel offset, and press feedback uses a small scale change. Preserve pending and disabled semantics.

### Fields

Search and selects use secondary surfaces and the shared control radius. Search reserves room for its leading SVG. Workspace fields begin with a transparent border, reveal a subtle boundary on hover and use the accent for focus. Keep readable placeholders, written error feedback and phone text sizing.

### Navigation

Named Tasks, Statistics and Connections links remain visible. The active route uses a surface and stronger text; selected project buttons use a secondary surface and `aria-pressed`. Keep navigation semantics separate from the task inspector. The wordmark uses the original `AppLogo` artwork and has no decorative dot. The same original artwork appears in login, statistics, API access, API documentation and skill headers. If a selected project disappears after synchronization, navigation returns to all projects. New tasks created in that view prefer the existing Miscelánea project, with the legacy default as fallback.

### Task nodes and states

Owner, task title and state occupy distinct rows. Owner tint is mixed into the node surface rather than applied to its text. Selection outlines the node and highlights actual related paths; readiness and completion remain written states. Node hover, press and arrow feedback follow the shared motion grammar. A graph skip link and textual dependency buttons preserve keyboard access.

### Cards and inspectors

Statistics widgets compose HeroUI cards with compact titles, actual values and exact textual chart equivalents. One labelled 44px overflow trigger opens the HeroUI action menu; move earlier, move later, edit and delete remain explicit named items with line SVGs. Boundary positions disable unavailable moves, pending changes disable action entry and the destructive item uses the semantic danger variant. Keep the menu separate from KPI content so titles retain room on narrow cards. Read-only task inspection stays nonmodal so the map remains available. Task editing protects unsaved drafts and preserves them through errors and background snapshots.

### Project management

Organize keeps project removal separate from editing project context. On phones, each project name wraps across a full row and its edit and delete actions occupy the row below; from the small breakpoint they share the desktop row. Preserve full names rather than forcing them into the remaining width between actions. The delete action opens a HeroUI alert dialog with a labelled destination selector and explicit cancel and danger actions. It prefers an existing Miscelánea destination, excludes the source and prevents removal of the protected default or last project. All active tasks and completed history transfer atomically; pending or approved reviews require an explicit move through the task editor first. Keep errors inside the dialog, preserve the chosen destination after failure and refresh after confirmed success without optimistic removal.

### Integration examples

`AppLink` is the focused HeroUI client boundary for links composed inside server-rendered pages. Import it from `@/components/app-link` and use `<AppLink href="/connections" className="connections-back">Connections</AppLink>` in a server page. It accepts a string `href`, optional classes and renderable children; keep page data loading and metadata in the server page rather than widening the client boundary.

`AppLogo` renders the preserved artwork and accepts an optional class string; use `<AppLogo className="workspace-logo" />` next to an accessible brand name. `WorkspaceIcon` renders a decorative SVG from its named path catalog; use `<WorkspaceIcon name="plus" />` inside a labelled control. Neither component owns product state.

`WorkspaceHeader` receives filtered project context, counts and creation callbacks; compose it as `<WorkspaceHeader projectId={projectId} projects={projects} count={count} ready={ready} onProjectChange={setProjectId} onCreate={openEditor} />`. `WorkspaceNavigation` receives projects, tasks, the active project and its change callback; compose `<WorkspaceNavigation projects={projects} tasks={tasks} projectId={projectId} onProjectChange={setProjectId}>{managementActions}</WorkspaceNavigation>` to add management actions without coupling navigation to their state.

`GraphNode` receives one graph record, its world position, selected and related flags, activation and optional bounded entrance order; compose `<GraphNode task={task} position={position} selected={selected} related={related} onSelect={selectTask} order={index} />`. It reports the selected identifier through its callback and does not mutate the task. These focused interfaces and composition keep navigation, graph layout, camera state, polling and editing separate responsibilities, while preserving existing snapshot and action contracts.

`StatisticActions` receives a widget name, move availability, pending state and action callbacks. Compose `<StatisticActions name={definition.name} canMoveEarlier={canMoveEarlier} canMoveLater={canMoveLater} isPending={isPending} onMove={moveWidget} onEdit={editWidget} onDelete={confirmDelete} />` in `Card.Header`. The component owns menu presentation and dispatches the selected callback; the dashboard retains persistence, ordering and delete confirmation.

`ProjectDelete` owns the confirmation state and destination choice for one project; compose `<ProjectDelete project={project} projects={projects} onSaved={refreshWorkspace} />` in the project management row. Each project supplies its stable identifier and display name. The callback refreshes the persisted snapshot after success; the shared server action owns authentication and delegates the atomic operation to the coordination service. Preserve this boundary instead of duplicating deletion rules in the UI. See [agent usage](docs/agents.md) and [REST usage](docs/api.md) for the equivalent public operations and invocation examples.

The optional installation action is the same quiet HeroUI ghost button as other supporting navigation actions. It appears only when installation is available and opens the browser prompt after an explicit press. Mount `<PwaRegistration />` once in `AppProviders` and `<PwaInstallButton className="justify-start" />` in a localized workspace surface. The static offline fallback keeps the original artwork, mineral palette, readable system-font fallback and one retry action; it contains no private task data. See [PWA integration](docs/pwa.md) for registration, launcher assets and privacy boundaries.

Use the official [HeroUI component documentation](https://heroui.com/en/docs/react/components) and [theming guide](https://heroui.com/en/docs/react/getting-started/theming), [Next.js CSS guide](https://nextjs.org/docs/app/getting-started/css), [Tailwind animation guide](https://tailwindcss.com/docs/animation) and [reduced-motion reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) when extending the system.

## Do's and Don'ts

### Do

- Do use HeroUI v3 compound primitives, Tailwind CSS 4 and the existing Geist fonts
- Do preserve the original PNG identity and its proportions
- Do render stored projects, owners, workflow states and real dependency relationships
- Do preserve camera position, selection and typed drafts through ordinary polling updates
- Do keep English and Spanish labels, keyboard activation, visible focus and textual state cues
- Do verify light and dark themes, narrow screens, reduced motion, editing and secondary navigation

### Don't

- Don't add periods or decorative dot separators to titles, subtitles or brand marks
- Don't restore brutalist framing, decorative rules or explanatory dashboard filler
- Don't use owner color as the only identity signal or fade completed task text
- Don't auto-fit the graph when polling adds or removes tasks
- Don't make inspection modal or allow outside clicks to discard an editing draft
- Don't hard-code agent names, invoke models or cache private task data for offline use
