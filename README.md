# Simple Tasks

> A private task workspace for humans and agents, connected by clear dependencies.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Falexfdez1010%2Fsimple-tasks&project-name=simple-tasks&repository-name=simple-tasks&env=PASSWORD,AUTH_SECRET,MCP_TOKEN&envDescription=Choose%20a%20shared%20login%20password%20and%20two%20independent%20random%20secrets.%20Keep%20all%20three%20private.&envLink=https%3A%2F%2Fgithub.com%2Falexfdez1010%2Fsimple-tasks%23environment-variables&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%2C%22allowConnectExistingProduct%22%3Atrue%7D%5D)

Simple Tasks gives one person or a small trusted team a shared view of work:
who owns each task, what it needs first, and what can start now. Group work by
project, choose responsible humans or agents, and inspect actual dependencies.

Use the responsive web interface or the built-in MCP server. Your deployment,
database, credentials and task data stay under your control.

## Human and agent coordination

The main workspace now uses a minimal dependency graph grouped by project.
Every task belongs to a responsible human or agent. Configure their names,
instructions and node colors dynamically in Organize or through MCP. The panel
refreshes every 15 seconds, with pause/30/60-second options, while preserving drafts.

MCP clients can create responsible parties/projects, set task prerequisites,
query assigned ready work and start it atomically. Read the
[agent coordination guide](docs/agents.md) for tools, REST equivalents,
dependency rules, synchronization and the data-preserving migration.

## A workspace that explains the work

- See tasks as nodes and prerequisites as directed edges, grouped by project.
- Filter by project or responsible party, search titles, pan, zoom and fit the graph.
- Give every task one responsible human or agent, with shared instructions and a chosen node color.
- Add an optional independent reviewer. Approval completes reviewed work; requested changes return it to its original owner with feedback.
- Write task descriptions in Markdown, preserve custom properties and set due dates.
- Inspect prerequisites and edit task ownership, project, workflow or dependencies in one focused drawer.
- Keep drafts while background polling updates the graph; reject conflicting edits rather than overwrite newer work.
- Create workflow states and configure their READY, WORKING, BLOCKED or REVIEW behavior; terminal states represent successful completion.
- Add TEXT, NUMBER, DATE, SELECT and MULTI_SELECT properties for additional metadata.
- Use the complete interface in English or Spanish, including touch and keyboard controls.

Organize manages responsible parties and projects. Settings retains workflow,
properties and language. Connections provides agent/MCP and REST setup.
The graph includes active work, a preview of the latest 20 completions and the
older prerequisite ancestors needed to explain those tasks. Search through MCP
or REST provides access to the complete history.

## 📊 Statistics that answer your questions

The statistics canvas is configurable, persistent, and calculated from the
complete task history. Add only the signals that matter to you:

- **Views:** KPI, bar chart, donut chart, or timeline.
- **Focus view:** hide editing controls while reading the canvas; toggle again
  to restore them. This view does not change saved statistics.
- **Appearance:** frosted glass surfaces, six curated color palettes, and automatic, compact, square,
  wide, or full-width card formats.
- **Measures:** task count, overdue work, completion rate, on-time rate, average
  resolution time, and sum/average/minimum/maximum of any numeric property.
- **Dimensions:** workflow state, any compatible custom property, or a system or
  custom date.
- **Date sources:** creation, last update, deadline, completion, or any `DATE`
  property.
- **Relative periods:** today, last 7/30/90 days, this
  week/month/quarter/year, next 7/30 days, or all time.
- **Filters:** all, active, or completed work, narrowed to any set of states.

Every period moves with the calendar, so a “Last 30 days” card stays useful
without being edited. Every chart also has an exact text equivalent for keyboard
and screen-reader users. Category legends include proportion bars for the share
of filtered tasks; these remain task shares when plotting numeric properties.
Donut legends sit beside the chart when the card has room, and timelines use a
light area fill with straight segments between observed buckets.

## Connect your own tools through REST

Open **Connections → Manage API access** from the board to create a named read-only or read/write token,
copy its secret once, view its identifying hint and last use, or revoke it.
Tokens never expire. Only credential hashes are stored in PostgreSQL.

The versioned API at `/api/v1` covers tasks, statuses, typed properties and
property values, with cursor pagination over the complete task history.
Statistics are excluded. Shared database limits enforce 120 requests and
30 writes per token per minute, plus 600 requests per instance per minute.

Read the guide at `/api-docs`, download `/api/openapi`, or see the
[repository API documentation](docs/api.md) for examples and error handling.

## 🤖 Delegate the busywork through MCP

Simple Tasks exposes the board as an authenticated
[Model Context Protocol](https://modelcontextprotocol.io/) server. An AI agent
can capture work, update properties, move tasks, maintain your workflow, and
create or refine statistics without receiving database access.

After deployment, sign in and open `/skill`. The setup page lets you:

1. download a ready-to-use `SKILL.md`;
2. download the MCP client configuration;
3. reveal and copy the MCP token only when you choose to.

The Streamable HTTP endpoint is `/api/mcp/mcp` and requires
`Authorization: Bearer <MCP_TOKEN>`. The generated client configuration reads
that value from `SIMPLE_TASKS_MCP_TOKEN`, so the credential is not written into
the downloaded file.

Authenticated `HEAD` probes return an empty `405 Method Not Allowed` response
immediately, with `Allow: POST`. For example, probe with
`curl --head --max-time 5 -H "Authorization: Bearer $SIMPLE_TASKS_MCP_TOKEN" https://tasks.alejandrofernandezcamello.me/api/mcp/mcp`.
Missing or invalid credentials still receive `401`. The route exports a
60-second Vercel execution limit; the adapter's own `maxDuration` option does
not configure that platform limit. See the
[Vercel duration documentation](https://vercel.com/docs/functions/configuring-functions/duration).

### MCP capabilities

| Area                | Read tools                          | Mutation tools                                                                   |
| ------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| Tasks               | `list_board`, `get_task`            | `create_task`, `update_task`, `move_task`, `reorder_tasks`, `delete_task`        |
| Responsible parties | `list_assignees`                    | `create_assignee`, `update_assignee`, `delete_assignee`                          |
| Workflow            | `list_statuses`                     | `create_status`, `update_status`, `reorder_statuses`, `delete_status`            |
| Properties          | `list_properties`                   | `create_property`, `update_property`, `reorder_properties`, `delete_property`    |
| Property values     | —                                   | `set_task_property_value`, `delete_task_property_value`                          |
| Statistics          | `get_statistics`, `list_statistics` | `create_statistic`, `update_statistic`, `reorder_statistics`, `delete_statistic` |

For example, an agent can create a rolling completion KPI with
`create_statistic`:

```json
{
  "name": "Completed in the last 30 days",
  "color": "OCEAN",
  "size": "WIDE",
  "visualization": "KPI",
  "measure": "COUNT",
  "scope": "COMPLETED",
  "groupBy": "NONE",
  "dateRange": "LAST_30_DAYS",
  "dateField": "COMPLETED_AT"
}
```

Use `tools/list` for the complete schemas. Numeric measures require a `NUMBER`
property. A line chart requires a date dimension and time bucket. Reorder calls
replace the complete order, and destructive tools tell agents to ask for user
confirmation first. The web UI and MCP use the same application services, so
validation and behavior stay consistent. `create_statistic` and
`update_statistic` accept `color` (`FOREST`, `OCEAN`, `IRIS`, `AMBER`, `CORAL`,
or `GRAPHITE`) and `size` (`AUTO`, `COMPACT`, `SQUARE`, `WIDE`, or `FULL`).

`delete_assignee` accepts `{"id":"ASSIGNEE_ID"}` and returns
`{"deleted":"ASSIGNEE_ID"}`. It removes an unused human or agent after the user
requests or confirms deletion. Reassign all tasks and reviews first, including
completed history; the default owner cannot be deleted. The equivalent REST
operation is `DELETE /api/v1/assignees/ASSIGNEE_ID`. See [agent coordination](docs/agents.md)
for conflict behavior and legacy assignment compatibility.

## 🚀 Deploy your private instance

The Deploy Button follows Vercel's official project-creation flow: it clones
this repository into your Git provider, provisions a Neon Postgres database,
and asks for the three private values the application needs.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Falexfdez1010%2Fsimple-tasks&project-name=simple-tasks&repository-name=simple-tasks&env=PASSWORD,AUTH_SECRET,MCP_TOKEN&envDescription=Choose%20a%20shared%20login%20password%20and%20two%20independent%20random%20secrets.%20Keep%20all%20three%20private.&envLink=https%3A%2F%2Fgithub.com%2Falexfdez1010%2Fsimple-tasks%23environment-variables&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%2C%22allowConnectExistingProduct%22%3Atrue%7D%5D)

1. Click **Deploy with Vercel** and choose your Git account.
2. Create a new Neon database or connect an existing Neon product.
3. Enter `PASSWORD`, `AUTH_SECRET`, and `MCP_TOKEN` with independent values.
4. Deploy. The build applies migrations and creates the starter workflow.

Neon injects `DATABASE_URL` automatically. Vercel never receives secret values
through the button URL; it asks you for them inside the deployment flow. See the
[Vercel Deploy Button documentation](https://vercel.com/docs/deploy-button) and
[Postgres on Vercel](https://vercel.com/docs/postgres) for details.

### Environment variables

| Variable       | Purpose                                                      |
| -------------- | ------------------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string; supplied automatically by Neon |
| `PASSWORD`     | Shared sign-in password for the web application              |
| `AUTH_SECRET`  | Independent random secret used to sign `HttpOnly` sessions   |
| `MCP_TOKEN`    | Independent bearer token protecting the MCP endpoint         |

Use a strong passphrase for `PASSWORD`. Generate each of the other secrets
separately, for example with `openssl rand -base64 32`. Do not reuse values.
Production should always run over HTTPS.

If you bring another PostgreSQL provider, omit the Neon store and set
`DATABASE_URL` yourself. It must be reachable during the Vercel build because
Prisma migrations run before Next.js compiles. When your provider supplies `DATABASE_URL_UNPOOLED`, Prisma CLI uses that direct connection for migrations; otherwise it uses `DATABASE_URL`. Runtime requests continue to use `DATABASE_URL`. This avoids migration advisory locks being retained by a transaction pool. See [Prisma’s pooler guidance](https://www.prisma.io/docs/orm/v6/prisma-client/setup-and-configuration/databases-connections/pgbouncer).

## 🛠 Run locally

Requirements: [Bun](https://bun.sh/) 1.x, Node.js 22.22 or newer within the Node
22 LTS line, and Docker with Compose.

```bash
git clone https://github.com/alexfdez1010/simple-tasks.git
cd simple-tasks
bun install
cp .env.example .env
bun run dev
```

Replace every example credential in `.env`, then open
[http://localhost:3000](http://localhost:3000). Local PostgreSQL runs in Docker;
migrations and starter data are applied automatically.

Useful database commands:

```bash
bun run database
bun run database:deploy
bun run database:studio
bun run database:down
```

## 🧱 Technology

- [Next.js 16](https://nextjs.org/docs) and [React 19](https://react.dev/)
- [HeroUI v3](https://heroui.com/en/docs/react/components) and
  [Tailwind CSS 4](https://tailwindcss.com/docs)
- [Prisma](https://www.prisma.io/docs/orm) and PostgreSQL
- [Recharts](https://recharts.github.io/) for the statistics canvas
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Vitest and Playwright

## ✅ Quality gates

```bash
bun run test:unit
bun run test:integration
bun run test:e2e
bun run lint-format
bun run heroui:doctor
bun run build
```

The E2E suite exercises authentication, desktop and mobile interactions,
properties, statistics, and the live MCP endpoint against an isolated
PostgreSQL database. Visual tokens, responsive rules, and accessibility choices
are documented in [`design.md`](./design.md).

Production uses Next.js' documented Webpack fallback because Prisma's generated
local client currently triggers an overly broad Turbopack filesystem trace.
Development retains the default Turbopack server.

## Security model

Simple Tasks is intentionally designed for one person or a small trusted team,
not public multi-tenant signup. The web session is signed and stored in an
`HttpOnly` cookie. MCP uses a separate bearer token. Raw HTML and remote images
are rejected in rendered task Markdown.

Tasks live in the PostgreSQL database connected to your own deployment. As with
any self-managed application, keep dependencies updated, protect the Vercel and
database accounts, rotate exposed credentials, and review your providers'
privacy and backup settings.
