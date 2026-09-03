# Simple Tasks

> A beautifully simple, deeply customizable task board that you can run
> yourself — and hand over to AI whenever you want.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Falexfdez1010%2Fsimple-tasks&project-name=simple-tasks&repository-name=simple-tasks&env=PASSWORD,AUTH_SECRET,MCP_TOKEN&envDescription=Choose%20a%20shared%20login%20password%20and%20two%20independent%20random%20secrets.%20Keep%20all%20three%20private.&envLink=https%3A%2F%2Fgithub.com%2Falexfdez1010%2Fsimple-tasks%23environment-variables&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%2C%22allowConnectExistingProduct%22%3Atrue%7D%5D)

Simple Tasks gives one person or a small trusted team a calm Kanban workspace
without turning task management into another project. Start with four useful
states, then shape the board around the way you actually work.

Create any workflow states. Add typed properties. Build the exact statistics
you care about. Use everything from the responsive web interface, or delegate
the same operations to an AI agent through the built-in MCP server.

Your deployment, database, credentials, and task data stay under your control.

## ✨ Why Simple Tasks

|                          |                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **Simple by default**    | Open the board, add a task, and move it. No workspace ceremony or feature maze.      |
| **Yours to shape**       | Create any states, colors, terminal stages, and typed custom properties you need.    |
| **Useful analytics**     | Compose KPIs, breakdowns, and timelines instead of accepting a fixed dashboard.      |
| **Built for AI**         | A complete MCP API lets an agent manage tasks, workflow, properties, and statistics. |
| **Private by design**    | One protected deployment for you or a small trusted team, backed by your Postgres.   |
| **Great on every input** | Drag with a pointer, touch, or keyboard on a responsive desktop and mobile board.    |

## 🧭 A board that adapts to you

- Create, rename, color, reorder, and remove workflow states.
- Mark any state as terminal. Entering it automatically records completion time.
- Add `TEXT`, `NUMBER`, `DATE`, `SELECT`, and `MULTI_SELECT` properties.
- Write task descriptions in Markdown and inspect every field in one focused view.
- Reorder and move tasks with accessible pointer, touch, and keyboard drag controls.
- Keep active work ordered by deadline and finished work ordered by completion date.
- Switch the complete interface between English and Spanish.

The default workflow — **Blocked**, **To do**, **In progress**, and **Done** — is
ready immediately, but none of those labels has to define your process.

## 📊 Statistics that answer your questions

The statistics canvas is configurable, persistent, and calculated from the
complete task history. Add only the signals that matter to you:

- **Views:** KPI, bar chart, donut chart, or timeline.
- **Appearance:** six curated color palettes and automatic, compact, square,
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
and screen-reader users.

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

### MCP capabilities

| Area            | Read tools                          | Mutation tools                                                                   |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| Tasks           | `list_board`, `get_task`            | `create_task`, `update_task`, `move_task`, `reorder_tasks`, `delete_task`        |
| Workflow        | `list_statuses`                     | `create_status`, `update_status`, `reorder_statuses`, `delete_status`            |
| Properties      | `list_properties`                   | `create_property`, `update_property`, `reorder_properties`, `delete_property`    |
| Property values | —                                   | `set_task_property_value`, `delete_task_property_value`                          |
| Statistics      | `get_statistics`, `list_statistics` | `create_statistic`, `update_statistic`, `reorder_statistics`, `delete_statistic` |

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
Prisma migrations run before Next.js compiles.

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
- [dnd kit](https://dndkit.com/react/quickstart/) for accessible drag and drop
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
