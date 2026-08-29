# Design system

This document is the source of truth for the product's visual language,
interaction model, accessibility, and responsive behavior. HeroUI v3 provides
the accessible primitives; Tailwind CSS 4 provides layout and product styling.

## 1. Product foundation

- Product name: Tareas
- One-sentence promise: Captura, mueve y termina trabajo sin perder el foco.
- Primary audience: A single person or small trusted team using one shared board.
- Key user needs: See the whole workflow, create or edit quickly, and move tasks
  reliably on pointer, touch, or keyboard.
- Brand personality: Calm, precise, useful, quietly crafted.
- Words and patterns to avoid: Marketing copy, gamification, jargon, decorative
  dashboards, gradients, and controls without an immediate task.

## 2. Visual direction

- Design principles, in priority order: Clarity, speed, restraint, accessibility.
- Reference products or visual inspirations: Editorial index cards and the calm
  density of a well-kept workshop board.
- What makes this product recognisable: Warm paper surfaces, ink typography, and
  a slim configurable colour rail that follows each workflow state.
- Density: Compact; task cards expose only scannable information and expand into
  the edit dialog for detail.
- Shape language: Soft rectangles with restrained 10–16 px radii.

## 3. Foundations

### Color

| Token        | Light value             | Dark value             | Usage            |
| ------------ | ----------------------- | ---------------------- | ---------------- |
| `background` | `oklch(0.975 0.008 80)` | `oklch(0.17 0.012 70)` | App canvas       |
| `foreground` | `oklch(0.22 0.012 65)`  | `oklch(0.94 0.008 80)` | Primary text     |
| `surface`    | `oklch(0.995 0.004 80)` | `oklch(0.22 0.012 70)` | Cards and panels |
| `accent`     | `oklch(0.54 0.11 155)`  | `oklch(0.72 0.11 155)` | Primary action   |
| `muted`      | `oklch(0.52 0.018 65)`  | `oklch(0.72 0.015 75)` | Secondary text   |
| `danger`     | `oklch(0.55 0.19 28)`   | `oklch(0.7 0.16 28)`   | Destructive UI   |

Workflow colours are user-configurable hex values. They are rendered as rails,
dots, and low-opacity tints, never as body-text colour. Text therefore retains
WCAG contrast independently of the chosen workflow colour.

Contrast requirements: WCAG 2.2 AA, at least 4.5:1 for normal text and 3:1 for
large text, component boundaries, and focus indicators.

### Typography

- Display family and weights: Geist Sans 600–700, tight tracking.
- Body family and weights: Geist Sans 400–600.
- Code family: Geist Mono 400–500 for dates and technical identifiers.
- Type scale: 12, 14, 16, 20, 28, 36 px.
- Line-height rules: 1.15 for display, 1.45–1.65 for body and Markdown.
- Maximum readable line length: 68 characters for descriptions.

### Spacing, shape, and elevation

- Base spacing unit: 4 px.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48 px.
- Border radii: 10 px controls, 14 px cards, 16 px panels.
- Border treatment: Use only for input boundaries, dashed empty states, and
  structural separators. Columns and task cards do not receive decorative boxes.
- Shadow/elevation levels: A very soft card shadow replaces card borders; one
  clearer lifted shadow appears while dragging or for modal overlays.
- Focus ring treatment: 2 px accent ring with 2 px canvas offset.

### Motion

- Motion principles: Movement confirms cause and destination; it never decorates.
- Duration scale: 120 ms feedback, 180 ms transitions, 240 ms overlays.
- Easing curves: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Reduced-motion behavior: Remove transforms and animated reordering while
  preserving immediate state changes and focus movement.

## 4. Component system

| Component/pattern | HeroUI primitive            | Approved variants                 | Usage guidance                               |
| ----------------- | --------------------------- | --------------------------------- | -------------------------------------------- |
| Button            | `Button`                    | primary, secondary, ghost, danger | One primary action per surface               |
| Link              | `Link`                      | primary, secondary                | Navigation and documentation only            |
| Card              | `Card` compound API         | secondary, tertiary               | Tasks and focused panels                     |
| Form field        | `TextField`, `TextArea`     | default                           | Visible labels; descriptions for constraints |
| Selection         | `Select`                    | single, multiple                  | Configurable properties only                 |
| Property value    | `TextField`, `Select`       | text, number, date, select, multi | Generated from a focused property definition |
| Overlay           | `Modal` compound API        | default                           | Create, edit, and state settings             |
| Feedback          | `Alert`, inline field error | success, danger                   | Specific, short, actionable                  |

Component rules:

- Composition rule: Prefer HeroUI compound APIs and one wrapper per product
  responsibility; no configurable “god components.”
- Loading and pending states: Disable the submitting control, retain its label,
  and show one adjacent progress cue.
- Empty states: One sentence and one primary creation action.
- Error states: Keep user input, focus the first invalid field, and explain how
  to recover.
- Destructive actions: Require explicit confirmation for task or state deletion.
- Property definitions: Managed in settings as a compact ordered list. Type is
  explicit and immutable after creation when changing it could discard values.
- Property options: Select and multi-select options use short visible labels;
  empty, duplicate, and whitespace-only options are rejected inline.
- Property values: Optional by default. Empty values are omitted from cards so
  configured metadata never overwhelms the task title and due date.
- Task transitions: Dragging is the only state-change control. The drag handle
  supports pointer, touch, and keyboard operation and announces the destination.
- Task cards: Keep title and edit affordance on the first row; clamp long
  descriptions and render property values as a quiet, wrapping metadata line.
- Responsive behavior: Modals become near-full-width sheets on small screens;
  the Kanban remains horizontally scrollable with 84vw columns and snap points.

## 5. Accessibility and content

- Keyboard interaction expectations: Every action is reachable by Tab; tasks can
  be moved and reordered with keyboard drag controls; Escape closes overlays.
- Screen-reader and semantic HTML requirements: Landmarks, named lists/regions,
  task cards as articles, live announcements for moves, and real form labels.
- Minimum contrast target: WCAG 2.2 AA.
- Localization and text expansion rules: Spanish UI; controls tolerate 40% text
  expansion and dates use locale-aware formatting.
- Voice and tone: Direct, human, and brief. Use verbs such as “Crear”, “Mover”,
  “Guardar”, and “Eliminar”.
- Content examples: “Sin tareas”, “Nueva tarea”, “Cambios guardados”.

## 6. Layout and responsive behavior

- Container widths: Full viewport board; header content capped at 1600 px.
- Breakpoints: Tailwind defaults, with the primary mode shift at 768 px.
- Navigation behavior by breakpoint: One compact top bar at all sizes; secondary
  settings actions collapse to icon-labelled controls on mobile.
- Mobile-first exceptions: Kanban columns preserve task context through horizontal
  scrolling rather than stacking every workflow into a very long page.
- Data-density strategy: Active states show all tasks. Terminal states show only
  their 20 most recently updated tasks, with the limit explained in the column.
- Property-density strategy: Task cards show non-empty values in a compact
  two-column metadata list. Multi-select values wrap as quiet chips. Property
  settings and task forms use one column on mobile and two where space permits.

## 7. Decision log

| Date       | Decision                                                         | Reason                                                               | Owner   |
| ---------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| 2026-08-29 | Keep a single shared-password session instead of user accounts   | Matches the requested private, simple board                          | Product |
| 2026-08-29 | Use horizontally scrollable columns on mobile                    | Preserves the spatial workflow and supports touch drag               | Design  |
| 2026-08-29 | Treat workflow colours as accents, not text colours              | User-selected colours cannot guarantee readable contrast             | Design  |
| 2026-08-29 | Limit every terminal state to its 20 most recently updated tasks | Keeps completed work available without overwhelming the board        | Product |
| 2026-08-29 | Model custom properties as definitions plus typed task values    | Keeps the board extensible without adding permanent task fields      | Product |
| 2026-08-29 | Support text, number, date, select, and multi-select initially   | Covers useful metadata while preserving the deliberately small scope | Product |
| 2026-08-29 | Remove decorative borders and the per-card state selector        | Makes the board lighter and keeps state changes spatial through drag | Design  |
| 2026-08-29 | Reduce card height and metadata density                          | More tasks remain scannable without turning cards into mini forms    | Design  |

## 8. Review checklist

- [x] All placeholders are resolved.
- [x] Tokens are semantic and have light/dark values where needed.
- [x] Keyboard, focus, contrast, and reduced-motion behavior are defined.
- [x] Approved HeroUI primitives and variants are listed.
- [ ] A representative page has been checked at mobile and desktop widths.
- [x] The design system is approved as the implementation baseline.
