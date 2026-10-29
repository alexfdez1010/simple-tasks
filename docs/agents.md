# Tasks, responsible parties and dependencies

The main workspace is a minimal dependency graph. Nodes show the task, its
responsible party and current availability. Arrows run from prerequisites to
the work they unlock. Node backgrounds use a soft tint of the responsible
party's selected color; text, state labels and selection remain readable.

Choose a project or responsible party, search by title, pan the canvas and use
Fit or zoom. Filters retain prerequisite ancestors, including completed and
cross-project tasks, so a blocked task never loses its explanation. The graph
includes all active work, the latest 20 completed tasks and any older ancestors
needed by that active/completed preview. Show completed reveals the completed
preview, not an unlimited archive; use search_tasks or REST for full history.

Open a node for its nonmodal description/prerequisite inspector; Edit opens the
protected assigned task form. Every newly entered task requires a responsible party and project. Task
drafts survive snapshot updates. If a task changes while being edited, reopen
it before saving. The server can enforce the same check with expectedUpdatedAt.

Organize manages persisted humans, agents and projects. A responsible party has
a stable id, name, HUMAN/AGENT kind, instructions and a #RRGGBB node color.
Renaming it preserves task assignments. Instructions describe its working role;
the task description contains the actual assignment and expected deliverable.
Project descriptions provide shared context. Neither names nor model providers
are fixed in application code. Configuration does not create user accounts,
credentials, external agents or schedules.

Delete a project from Organize or call `delete_project` with its `id`. An empty
project needs no destination. If it contains tasks, pass `destinationProjectId`
for a different existing project; every task, including completed history, moves
within the same transaction before deletion. Task descriptions, ownership,
workflow states, completion dates, properties and dependency edges are preserved.
The legacy default project and last remaining project cannot be deleted. Tasks
with pending or approved reviews must first be moved through the task editor,
which applies the existing review-invalidation flow; bulk deletion never silently
changes review or completion state. Task versions update so stale editors must
reload. Obtain user confirmation unless the deletion was already explicitly requested.

For example, after explicit user authorization, call
`delete_project({"id":"SOURCE_ID","destinationProjectId":"DESTINATION_ID"})`.
Use `list_projects` to resolve both IDs; no project name is hard-coded. For
an empty project, call `delete_project({"id":"EMPTY_PROJECT_ID"})` instead.

## Periodic synchronization

The authenticated panel polls /api/workspace every 15 seconds by default. Choose
30 or 60 seconds, pause periodic refresh, or refresh manually. Hidden tabs and
offline clients skip requests; becoming visible/online refreshes the snapshot.
Requests do not overlap. A 15-second request timeout prevents a stalled poll
blocking future attempts. An unchanged ETag returns 304 and does not replace
client data. Errors retain the last successful graph and display a retryable
status. Editing forms are keyed by task id, never by updatedAt.

GET /api/workspace is browser-session authenticated, contains private data and
must not be cached publicly. It is an internal UI read endpoint; external
integrations use authenticated MCP or REST.

## Workflow and dependencies

A workflow state has isTerminal and workType (READY, WORKING, BLOCKED or REVIEW).
Terminal states represent successful completion and satisfy prerequisites.
Do not configure failed/cancelled outcomes as terminal completion states if
they must not unlock dependents. BLOCKED is manual blocking, independent of
computed prerequisite blocking. State names and colors remain editable.

Dependency IDs must be unique, exist and differ from the task itself. A
serializable transaction rejects indirect cycles, including concurrent inverse
changes. Starting or completing a task requires all prerequisites completed.
Deleting a referenced prerequisite is rejected until dependent links are removed.
Reopening a prerequisite makes downstream READY tasks unavailable again.
A prerequisite reopened after work already started does not cancel that work;
its blocked dependencies remain visible, and completing it is rejected until
the prerequisites are satisfied again.

## Optional review

Set reviewerId to another configured human or agent, or null for no review.
The responsible party remains assigned to the task. A reviewer cannot be the
same responsible party. A reviewable task cannot complete until approved.

Call submit_task_for_review with id and assigneeId after the deliverable and
prerequisites are ready. The task enters a REVIEW workflow state; dependencies
remain blocked. list_pending_reviews with reviewerId returns that agent or
person's review queue as compact summaries. Read get_task for its complete context. review_task accepts id, reviewerId, expectedUpdatedAt,
decision (APPROVE or REQUEST_CHANGES) and an optional note. REQUEST_CHANGES
requires a note and returns the task to READY work for its original owner.
Approval moves to a terminal state and unlocks downstream work.

Changing the reviewed task's content, assignment or prerequisites invalidates
pending/approved review. The server checks the reviewer's expected version;
stale or concurrent decisions cannot approve another version. Database guards
also invalidate old approvals for legacy content/property writers. Color changes
are presentation metadata and do not change the reviewed deliverable.

MCP uses the existing shared deployment credential. Explicit owner/reviewer IDs
coordinate trusted clients; they do not prove individual identity or introduce
per-agent authorization. The authenticated human interface can manage the shared
workspace and record a decision for the selected reviewer.

REST equivalents are GET /tasks/reviews?reviewerId=ID,
POST /tasks/{id}/submit-review with assigneeId, and POST /tasks/{id}/review with
reviewerId, expectedUpdatedAt, decision and note. All mutation responses are 200.

## MCP examples

Discover exact schemas through tools/list. Existing task, workflow, property,
statistics and deletion tools remain available.

1. Call create_assignee with name "Research agent", kind "AGENT", description
   "Use the task's acceptance criteria; report sources and unresolved issues."
   and color "#7297CA". Keep its returned id. list_assignees reads all owners;
   update_assignee edits selected fields by id.
   To remove it later, call delete_assignee with {"id":"RETURNED_ID"} after
   the user requests or confirms deletion. Reassign every owned task and review,
   including completed history, first; otherwise deletion returns a conflict.
   The default owner is protected. Legacy Responsable/Assignee SELECT choices
   remove the deleted name atomically, retaining the default owner's name if
   the list would become empty. Other properties and tasks are preserved.
2. Call create_project with name "Documentation" and a description containing
   the shared scope. list_projects and update_project read/edit these definitions.
3. Call create_task with title, description, assigneeId, projectId and optional
   dependencyIds (the prerequisite task ids). update_task supports the same
   references; dependencyIds replaces the complete prerequisite set atomically.
4. Call list_ready_tasks with assigneeId, optional projectId and limit (1–100,
   default 20). It returns assigned READY work whose prerequisites are complete.
   MCP discovery queues return compact summaries to keep periodic checks small.
   start_task and get_task return the full task context.
5. Call start_task with id and assigneeId before executing. It atomically checks
   ownership, readiness and prerequisites and moves to the first WORKING state.
   Concurrent/repeated starts return a conflict; select another ready task.
6. Read get_task for responsible-party instructions, project context and
   prerequisite descriptions/results. Use search_tasks with search, assigneeId,
   projectId, scope, statusId, limit and cursor for complete task history.
7. Record the result using update_task and move into a terminal state after the
   deliverable is complete. Send expectedUpdatedAt from the most recent get_task
   to reject stale edits. Preserve existing Markdown when appending a result.

start_task is a durable workflow transition, not an expiring execution lease.
An interrupted task stays WORKING until explicitly moved/reassigned. This first
version does not invoke models, run a cron, retry agents or claim that an agent
is connected. The external MCP client owns execution and scheduling.

## REST equivalents

All paths below are relative to /api/v1 and use existing bearer-token scopes and
rate limits. Creation returns 201; reads/edits/start return 200. Requests and
responses are documented in /api/openapi.

| Operation                | Endpoint               | Body or query                                                            |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------ |
| List responsible parties | GET /assignees         | None                                                                     |
| Create responsible party | POST /assignees        | name, kind, description, color                                           |
| Edit responsible party   | PATCH /assignees/{id}  | Selected fields                                                          |
| Delete unused party      | DELETE /assignees/{id} | None; returns 204, 404 if missing, 409 if in use or default              |
| List projects            | GET /projects          | None                                                                     |
| Create project           | POST /projects         | name, description                                                        |
| Edit project             | PATCH /projects/{id}   | Selected fields                                                          |
| Delete project           | DELETE /projects/{id}  | Optional JSON destinationProjectId; required if tasks exist; returns 204 |
| Read available work      | GET /tasks/ready       | assigneeId, optional projectId, limit                                    |
| Start task               | POST /tasks/{id}/start | assigneeId                                                               |
| Edit relationships       | PATCH /tasks/{id}      | assigneeId, projectId, dependencyIds                                     |
| Search history           | GET /tasks             | Existing filters plus assigneeId, projectId                              |

For example, an authenticated script can GET /api/v1/tasks/ready?assigneeId=ID,
then POST /api/v1/tasks/TASK_ID/start with {"assigneeId":"ID"}. A read-only token
can query but cannot start work or configure owners/projects. No model call is
needed to select available work. Clients must still handle a conflict between
listing and starting; listing is not a reservation.

## Migration and compatibility

20261029120000_task_coordination expands with Assignee, Project and
TaskDependency, and adds non-null owner/project references to Task. Existing
Responsable/Assignee property values and options are imported without deleting
tasks, descriptions, dates, properties or statistics. Imported parties initially
use HUMAN and neutral color; the user can set the intended kind/color later.
Existing unassigned tasks use Alejandro; existing tasks enter General.

New graph forms select an owner explicitly. For old clients, a legacy assignment
property still selects the canonical responsible party; otherwise omitted owner
on creation defaults to Alejandro. Omitted fields on update retain existing
references. Canonical owner edits mirror existing configurable assignment
properties so their statistics keep working. A database trigger also accepts
legacy property writes by overlapping older deployments. The canonical relation
remains assigned when an old client clears that optional property.

Deploy with the existing migration command, without resetting the database.
A code rollback can retain all added tables, columns and the legacy-write bridge;
older code ignores the new relations, and new work is available again after
redeploying. Do not drop these tables or reset data as a rollback. Referenced
prerequisite deletion remains restricted at the database boundary.

References: [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route),
[MCP tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools),
[Prisma 6 transactions](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions),
[React effects](https://react.dev/reference/react/useEffect),
[HeroUI Select](https://heroui.com/en/docs/react/components/select),
[PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

The additive 20261029130000_task_reviews migration adds optional reviewer fields,
a review workflow state for existing instances, and database safeguards against
unapproved completion or retaining approval after content changes. Fresh instances
receive all five default states through the seed. Code rollback retains this
schema and its guards; it must not remove review data or disable approval checks.
