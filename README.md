# Tasks

A private, configurable Kanban task manager for one person or a small trusted
team. The web application uses one shared password and exposes the same board
through an authenticated MCP server for AI agents.

## Features

- Configurable workflow states with custom names, colors, order, and terminal
  behavior.
- Default states: Blocked, To do, In progress, and Done.
- Compact drag-only Kanban interactions with pointer, touch, and keyboard input.
- Tasks with a title, optional Markdown description, and optional due date.
- Clickable task inspector with rendered Markdown, lifecycle dates, ID, status,
  and every configured property, including empty values.
- Configurable text, number, date, select, and multi-select task properties.
- Status-transition automations with completion-date and typed property-value
  actions.
- One-shot temporal automations that catch up on dashboard/MCP reads and create
  parameterized tasks with `{{date}}`, `{{datetime}}`, due-date offsets, and
  typed properties.
- Terminal states show only their 20 most recently completed tasks.
- Responsive horizontal board with column snapping on mobile.
- Shared password authentication backed by a signed `HttpOnly` session.
- English interface by default, with persistent Spanish selection in Settings.
- Independently authenticated Streamable HTTP MCP endpoint.

## Stack

[Next.js 16](https://nextjs.org/docs), [React 19](https://react.dev/),
[HeroUI v3](https://heroui.com/en/docs/react/components),
[Tailwind CSS 4](https://tailwindcss.com/docs),
[Prisma](https://www.prisma.io/docs/orm), PostgreSQL,
[dnd kit](https://dndkit.com/react/quickstart/),
[react-markdown](https://github.com/remarkjs/react-markdown), Vitest, and
Playwright.

## Local setup

Requirements: Bun 1.x, Node.js 22.22 or newer within the Node 22 LTS line, and
Docker with Compose. Production deployments intentionally pin Node 22 because
the webpack build is validated against that runtime.

1. Install dependencies with `bun install`.
2. Copy `.env.example` to `.env`.
3. Replace every example secret with a long, random value.
4. Run `bun run dev`.
5. Open [http://localhost:3000](http://localhost:3000).

Development PostgreSQL runs in Docker. Migrations and the seed are idempotent;
apply them to an existing deployment with `bun run database:deploy`.

### Environment variables

| Variable       | Purpose                                              |
| -------------- | ---------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection used by Prisma                 |
| `PASSWORD`     | Shared web application password                      |
| `AUTH_SECRET`  | Independent secret used to sign application sessions |
| `MCP_TOKEN`    | Independent bearer token for the MCP endpoint        |

Do not reuse `PASSWORD`, `AUTH_SECRET`, or `MCP_TOKEN`. Serve production only
over HTTPS.

## Using the board

Sign in and choose “New task” to create work in the first non-terminal state.
Drag the task handle to reorder a task or move it between columns. Drag works
with a pointer, touch input, and the keyboard; there is no separate state-change
control. Select a task's edit action to change its content.

Descriptions are stored as Markdown. Rendering rejects raw HTML and remote
images. Click a task card's title or content to inspect its complete record;
choose Edit inside the inspector to modify it. Open “Settings” to add, rename,
color, reorder, or mark workflow states as terminal. A state can be deleted only
when it is empty.

Settings also manages ordered task properties. Select and multi-select
properties have their own option lists. Empty values stay off task cards to keep
the board compact. A property type cannot change, and an option cannot be
removed, while stored task values depend on it.

The Language section in Settings switches the full interface between English
and Spanish, including accessible labels and locale-aware dates and numbers.
The selection is stored for one year in the `simple-tasks-language` `HttpOnly`
cookie; absent or unsupported values safely fall back to English.

Open **Automations** from the board toolbar to manage rules on the dedicated
`/automations` page. Choose **New rule**, give it a name, then configure one
**When** clause and one **Then** clause. Workflow rules take the form “when
status becomes X, do Y”; scheduled rules take the form “on date, create a
task”. Editing an existing rule uses the action on its card, and deletion always
requires confirmation.

The built-in completion action fills `completedAt` with the current date when a
task enters the selected state. The property action uses the selected
property's own type editor, so text, number, date, select, and multi-select
values are validated before saving. Scheduled task templates can use `{{date}}`
and `{{datetime}}` in their title and Markdown description, and set a due-date
offset and typed properties. They are one-shot: the first dashboard load or
`list_board`/`get_task` MCP read after the scheduled date creates the task and
marks the rule completed. Editing the rule re-arms it.

## MCP integration

The Streamable HTTP transport is available at `/api/mcp/mcp`. Every request
requires `Authorization: Bearer <MCP_TOKEN>`.

After signing in, open `/skill` to download:

- `SKILL.md`, containing usage instructions and safety rules for an agent.
- `simple-tasks.mcp.json`, containing the server URL and a reference to the
  local `SIMPLE_TASKS_MCP_TOKEN` variable.

The same protected page shows the server token masked by default, with explicit
reveal and copy actions. Use it to populate `SIMPLE_TASKS_MCP_TOKEN` without
placing the credential in the downloaded files.

Set `SIMPLE_TASKS_MCP_TOKEN` in the MCP client's environment to the same value
as the server's `MCP_TOKEN`. The MCP catalog includes:

| Tool                         | Typical use                                       |
| ---------------------------- | ------------------------------------------------- |
| `list_board`                 | Read ordered states and tasks                     |
| `get_task`                   | Read one task by `id`                             |
| `create_task`                | Create a task and optional typed property values  |
| `update_task`                | Atomically edit, move, or replace property values |
| `move_task`                  | Move by task, target state, and zero-based index  |
| `reorder_tasks`              | Replace the complete order of an active column    |
| `delete_task`                | Delete a user-confirmed task                      |
| `list_statuses`              | Read the configured workflow                      |
| `create_status`              | Create a state with color and terminal behavior   |
| `update_status`              | Edit an existing state                            |
| `reorder_statuses`           | Replace the complete state order                  |
| `delete_status`              | Delete a confirmed empty state                    |
| `list_properties`            | Read ordered property definitions                 |
| `create_property`            | Create a typed property and its options           |
| `update_property`            | Edit without invalidating stored values           |
| `reorder_properties`         | Replace the complete property order               |
| `delete_property`            | Delete a confirmed property and its values        |
| `set_task_property_value`    | Validate and set one typed task value             |
| `delete_task_property_value` | Clear one configured value from a task            |

The web application and MCP tools use the same application services, so their
validation, ordering, transactions, and invariants are identical.

## Quality commands

- `bun run lint-format`: mandatory ESLint, Prisma formatting, and Prettier gate.
- `bun run test:unit`: isolated logic and validation tests.
- `bun run test:integration`: repositories and services against PostgreSQL.
- `bun run test:e2e`: authentication, responsive board, drag, and MCP tests.
- `bun run build`: migrations, seed, and the production Next.js build.
- `bun run heroui:doctor`: validates the HeroUI v3 setup.

The visual language and responsive decisions are documented in
[`design.md`](./design.md).

Production builds use Next.js' documented Webpack fallback because Prisma's
generated local client triggers a known Turbopack dynamic-filesystem trace that
would otherwise include unrelated project files. Development retains the
default Turbopack server.

## Deployment

Deploy as a Node.js Next.js application with persistent PostgreSQL. Configure
the four environment variables above, run `bun run database:deploy` during the
migration phase, and start the application with `bun run start`. Keep the MCP
endpoint behind HTTPS and its bearer token.

Official references: [Next.js authentication](https://nextjs.org/docs/app/guides/authentication),
[cookies](https://nextjs.org/docs/app/api-reference/functions/cookies),
[Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions),
and the [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md).
