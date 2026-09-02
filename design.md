# Design system

This document is the source of truth for the product's visual language,
interaction model, accessibility, and responsive behavior. HeroUI v3 provides
the accessible primitives; Tailwind CSS 4 provides layout and product styling.

## 1. Product foundation

- Product name: Tasks
- One-sentence promise: Capture, move, and finish work without losing focus.
- Primary audience: A single person or small trusted team using one shared board.
- Key user needs: See the whole workflow, create or edit quickly, and move tasks
  reliably on pointer, touch, or keyboard.
- Brand personality: Calm, precise, tactile, quietly confident.
- Words and patterns to avoid: Marketing copy, gamification, jargon, decorative
  dashboards, and controls without an immediate task.

## 2. Visual direction

- Design principles, in priority order: Clarity, speed, restraint, accessibility.
- Reference products or visual inspirations: Editorial index cards and the calm
  density of a well-kept workshop board.
- What makes this product recognisable: A warm workflow-studio canvas, ink
  typography, softly recessed columns, and configurable colour signals that
  follow each workflow state.
- Density: Compact; task cards expose only scannable information and expand into
  the edit dialog for detail.
- Shape language: Soft rectangles with nested 10–20 px radii; outer workspace
  surfaces are softer than the controls and cards within them.

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

The canvas uses a low-contrast radial wash and a sparse dot grid to create depth
without competing with content. These textures are CSS-only, remain below 5%
contrast, and disappear in forced-colours mode. The primary accent stays green;
workflow colours are local wayfinding signals rather than additional brand
accents.

Workflow colours are user-configurable hex values. They are rendered as rails,
dots, and restrained card-to-surface gradients, never as body-text colour. Text
therefore retains WCAG contrast independently of the chosen workflow colour.

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
- Border radii: 10 px controls, 14 px cards, 18 px columns, 20 px workspace
  panels.
- Border treatment: Use only for input boundaries, dashed empty states, and
  structural separators. Columns and task cards do not receive decorative boxes.
- Shadow/elevation levels: A recessed inner shadow defines each column well; a
  tinted two-layer shadow lifts task cards; a clearer lifted shadow appears
  while dragging or for modal overlays. All shadows share a top-left light
  source.
- Focus ring treatment: 2 px accent ring with 2 px canvas offset.

### Motion

- Motion principles: Movement confirms cause and destination; it never decorates.
- Duration scale: 120 ms feedback, 180 ms transitions, 240 ms overlays.
- Easing curves: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Reduced-motion behavior: Remove transforms and animated reordering while
  preserving immediate state changes and focus movement.

## 4. Component system

| Component/pattern | HeroUI primitive                                   | Approved variants                 | Usage guidance                               |
| ----------------- | -------------------------------------------------- | --------------------------------- | -------------------------------------------- |
| Button            | `Button`                                           | primary, secondary, ghost, danger | One primary action per surface               |
| Link              | `Link`                                             | primary, secondary                | Navigation and documentation only            |
| Card              | `Card` compound API                                | secondary, tertiary               | Tasks and focused panels                     |
| Form field        | `TextField`, `TextArea`                            | default                           | Visible labels; descriptions for constraints |
| Selection         | `Select`                                           | single, multiple                  | Configurable properties only                 |
| Language choice   | `RadioGroup`, `Radio`                              | secondary                         | English and Spanish in settings              |
| Property value    | `TextField`, `NumberField`, `DatePicker`, `Select` | typed values                      | Generated from a focused property definition |
| Colour control    | `ColorPicker` compound API                         | controlled                        | Workflow colour configuration                |
| Overlay           | `Modal`, `AlertDialog`                             | default, danger                   | Editing, settings, and confirmations         |
| Feedback          | `Alert`, inline field error                        | success, danger                   | Specific, short, actionable                  |

Component rules:

- Composition rule: Prefer HeroUI compound APIs and one wrapper per product
  responsibility; no configurable “god components.”
- Loading and pending states: Disable the submitting control, retain its label,
  and show one adjacent progress cue.
- Empty states: One sentence and one primary creation action.
- Error states: Keep user input, focus the first invalid field, and explain how
  to recover.
- Destructive actions: Require explicit confirmation for task or state deletion.
- Native browser confirmation and date-picker UI is not used; HeroUI owns these
  experiences for consistent styling, focus management, and mobile behavior.
- MCP credentials: The protected AI setup page may reveal the configured token
  on explicit request and offer a copy action. It is masked by default and the
  page renders dynamically so secrets never enter static build output.
- Property definitions: Managed in settings as a compact ordered list. Type is
  explicit and immutable after creation when changing it could discard values.
- Property options: Select and multi-select options use short visible labels;
  empty, duplicate, and whitespace-only options are rejected inline.
- Property values: Optional by default. Empty values are omitted from cards so
  configured metadata never overwhelms the task title and due date.
- Task transitions: Dragging is the only state-change control. The drag handle
  supports pointer, touch, and keyboard operation and announces the destination.
- Terminal completion: Entering a terminal state fills the completion date with
  the transition time automatically. Leaving terminal workflow clears it;
  moving between terminal states preserves the original completion time.
- Task ordering: Non-terminal columns are ordered by due date ascending and
  terminal columns by completion date descending. Tasks without the primary
  ordering date come last. A drag within one terminal column returns to the
  persisted order and explains why; dragging out to another column remains
  available.
- Task creation: Every workflow column exposes an Add action. It opens the shared
  task dialog with that column preselected; the state remains implicit and cannot
  be changed from the form.
- Task cards: Keep title and edit affordance on the first row; use a narrow
  workflow-colour cap, clamp long descriptions with a visible fade rather than
  cutting content abruptly, render property values as a quiet wrapping metadata
  line, and group dates in compact footer chips. Show the completion date only
  when `completedAt` exists; active tasks must not reserve space or display an
  empty completion field.
- Board header: Use one floating utility bar with the product mark, total and
  active task context, a compact completion meter, and existing AI/settings/
  sign-out actions. Metrics are descriptive, never gamified. Do not add an
  eyebrow or category label when the page title already communicates the
  product context.
- Brand icon: Use the supplied green-and-ivory checkmark artwork as the single
  source for both the in-product mark and browser app icon. Do not redraw or
  substitute it with a different workflow symbol.
- Settings continuity: Successful create, update, delete, and reorder actions
  reconcile board data without dismissing the settings modal. Only the close
  trigger, Done action, Escape, or backdrop dismissal closes it.
- Column wells: Give each workflow a stable surface, a status-colour top edge,
  a named header, a tabular count, and a purposeful empty state. The well must
  remain visually legible during drag-over without relying on colour alone.
- Responsive behavior: Modals become near-full-width sheets on small screens;
  the Kanban remains horizontally scrollable with 88vw columns and snap points.
- Mobile touch behavior: Primary toolbar, column, drag, and card actions expose a
  minimum 44 px touch target. Their visual glyphs may remain compact, but the
  interactive area must not shrink below the target.
- Mobile overlays: Task and settings modals dock to the bottom edge as rounded
  sheets, respect device safe areas, and keep their action footer visible while
  the body scrolls. Desktop overlays remain centred.

## 5. Accessibility and content

- Keyboard interaction expectations: Every action is reachable by Tab; tasks can
  be moved and reordered with keyboard drag controls; Escape closes overlays.
- Screen-reader and semantic HTML requirements: Landmarks, named lists/regions,
  task cards as articles, live announcements for moves, and real form labels.
- Drag alternatives: The keyboard drag contract remains available and terminal
  ordering constraints are announced through the same polite live region.
- Minimum contrast target: WCAG 2.2 AA.
- Localization and text expansion rules: English is the default UI language;
  Spanish is available from Settings and persists in a functional, app-wide
  cookie. Controls tolerate 40% text expansion, accessible names change with
  the selected language, and dates and numbers use locale-aware formatting.
- Voice and tone: Direct, human, and brief. Use verbs such as “Create”, “Move”,
  “Save”, and “Delete”.
- Content examples: “No tasks”, “New task”, “Changes saved”.

## 6. Layout and responsive behavior

- Container widths: Full viewport board; workspace content capped at 1800 px so
  columns retain readable widths on very large displays.
- Breakpoints: Tailwind defaults, with the primary mode shift at 768 px.
- Navigation behavior by breakpoint: One compact top bar at all sizes; secondary
  settings actions collapse to icon-labelled controls on mobile.
- Mobile-first exceptions: Kanban columns preserve task context through horizontal
  scrolling rather than stacking every workflow into a very long page. Columns
  occupy 88vw with 16 px gutters and scroll snapping; the utility bar wraps
  metrics beneath the brand/actions row without hiding task controls. The bar is
  sticky on small screens so navigation and board context remain reachable in
  long columns, and its outer spacing includes display-cutout safe areas.
- Data-density strategy: Active states show all tasks. Terminal states show only
  their 20 latest completed tasks, with the limit explained in the column.
- Property-density strategy: Task cards show non-empty values in a compact
  two-column metadata list. Multi-select values wrap as quiet chips. Property
  settings and task forms use one column on mobile and two where space permits.

## 7. Decision log

| Date       | Decision                                                                 | Reason                                                                                              | Owner    |
| ---------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------- |
| 2026-08-29 | Keep a single shared-password session instead of user accounts           | Matches the requested private, simple board                                                         | Product  |
| 2026-08-29 | Use horizontally scrollable columns on mobile                            | Preserves the spatial workflow and supports touch drag                                              | Design   |
| 2026-08-29 | Treat workflow colours as accents, not text colours                      | User-selected colours cannot guarantee readable contrast                                            | Design   |
| 2026-08-29 | Limit every terminal state to 20 visible tasks                           | Keeps completed work available without overwhelming the board                                       | Product  |
| 2026-08-29 | Model custom properties as definitions plus typed task values            | Keeps the board extensible without adding permanent task fields                                     | Product  |
| 2026-08-29 | Support text, number, date, select, and multi-select initially           | Covers useful metadata while preserving the deliberately small scope                                | Product  |
| 2026-08-29 | Remove decorative borders and the per-card state selector                | Makes the board lighter and keeps state changes spatial through drag                                | Design   |
| 2026-08-29 | Reduce card height and metadata density                                  | More tasks remain scannable without turning cards into mini forms                                   | Design   |
| 2026-08-29 | Add per-column creation and status-tinted card gradients                 | Makes placement faster and workflow ownership visually memorable                                    | Design   |
| 2026-08-29 | Replace native date, colour, number, and confirmation controls           | Keeps interaction styling and accessibility consistent through HeroUI                               | Design   |
| 2026-08-29 | Reveal and copy the MCP token only from the protected setup page         | Makes agent setup easier without placing the secret in static output                                | Security |
| 2026-08-30 | Treat the board as a tactile workflow studio with recessed wells         | Adds hierarchy and depth while keeping task content primary                                         | Design   |
| 2026-08-30 | Show active/finished context and a restrained completion meter           | Makes board state scannable without introducing dashboard clutter                                   | Product  |
| 2026-08-30 | Sort tasks by due date per status type                                   | Makes upcoming and terminal work easy to scan                                                       | Product  |
| 2026-08-30 | Keep settings mounted while refreshed snapshots reconcile                | Prevents successful mutations from unexpectedly dismissing the dialog                               | Product  |
| 2026-08-30 | Use the supplied green checkmark as the shared app and tab icon          | Preserves the intended identity with one artwork source                                             | Design   |
| 2026-08-30 | Make the mobile toolbar sticky and overlays bottom-aligned               | Keeps frequent controls reachable and forms comfortable on touch                                    | Design   |
| 2026-08-30 | Standardise frequent mobile actions on 44 px touch targets               | Reduces accidental activation and exceeds WCAG 2.2 target minimum                                   | Design   |
| 2026-08-30 | Default to English with Spanish selectable in Settings                   | Keeps current behavior stable while adding a persistent language choice                             | Product  |
| 2026-08-31 | Open task details from the card and keep editing as a secondary action   | Makes Markdown, dates, status, and every property discoverable without crowding cards               | Product  |
| 2026-09-01 | Sort terminal work by completion date and reveal that date conditionally | Makes recent completions scannable without exposing empty metadata on active tasks                  | Product  |
| 2026-09-02 | Make terminal completion an invariant and remove configurable automation | Keeps core task completion predictable while returning the product to its intentionally small scope | Product  |

## 8. Review checklist

- [x] All placeholders are resolved.
- [x] Tokens are semantic and have light/dark values where needed.
- [x] Keyboard, focus, contrast, and reduced-motion behavior are defined.
- [x] Approved HeroUI primitives and variants are listed.
- [x] A representative page has been checked at mobile and desktop widths.
- [x] The design system is approved as the implementation baseline.
