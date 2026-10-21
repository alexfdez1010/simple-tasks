# REST API v1

The public guide is at `/api-docs`; download the OpenAPI 3.0.3 contract from
`/api/openapi` and import it into Postman, Insomnia, or a compatible client
code generator. Owner-only token management is at `/api-access`, linked from
the board. Statistics are intentionally excluded. All tokens access the same
single-instance board, with either read-only or read/write permission.

## Connect

Sign in, create a named token, select permissions, and copy it once. Tokens
never expire. Store each in a secret manager, then send it over HTTPS:

```sh
export SIMPLE_TASKS_API_TOKEN='your-token-from-the-web-interface'
curl 'https://your-domain/api/v1/tasks?limit=50&scope=active' \
  -H "Authorization: Bearer $SIMPLE_TASKS_API_TOKEN"
```

Do not embed tokens in frontend code, query strings, source control, or logs.
The database stores a SHA-256 hash of a 256-bit random secret and a short hint.
The raw token is returned only in the authenticated creation response and is
not recoverable. Revocation rejects subsequent calls immediately; an already
running request may finish. There may be at most 25 active tokens. Rotate by
creating a replacement, updating your integration, then revoking the old one.
API credentials cannot create or revoke tokens; management requires a web session.
MCP credentials and browser cookies do not authenticate REST calls.

## Endpoints

Every path below is relative to `/api/v1`. GET needs either permission; all
other methods require read/write. POST creation returns 201; moving returns
200; GET/PATCH/value PUT return 200. Deletes and reorders return 204 with no body.
JSON successes use `{ "data": ... }` except task pages, which also have
`pagination`. Unknown routes return 404; unsupported methods return 405 with Allow.

| Method             | Path                                | Purpose / request                                                      |
| ------------------ | ----------------------------------- | ---------------------------------------------------------------------- |
| GET                | /tasks                              | Paginated full history                                                 |
| POST               | /tasks                              | Create: title, optional description, dueDate, statusId, propertyValues |
| GET                | /tasks/{id}                         | Task, status, typed propertyValues                                     |
| PATCH              | /tasks/{id}                         | Edit fields; statusId and index together optionally move               |
| DELETE             | /tasks/{id}                         | Permanently delete                                                     |
| POST               | /tasks/{id}/move                    | statusId, zero-based index                                             |
| PUT                | /statuses/{id}/tasks/order          | taskIds: every task id exactly once                                    |
| PUT                | /tasks/{id}/properties/{propertyId} | value: string, number, or string array                                 |
| DELETE             | /tasks/{id}/properties/{propertyId} | Clear a value                                                          |
| GET, POST          | /statuses                           | List / create (name, color, optional isTerminal)                       |
| GET, PATCH, DELETE | /statuses/{id}                      | Get / edit / delete an empty status                                    |
| PUT                | /statuses/order                     | statusIds: complete exact order                                        |
| GET, POST          | /properties                         | List / create (name, type, optional options)                           |
| GET, PATCH, DELETE | /properties/{id}                    | Get / safely edit / permanently delete                                 |
| PUT                | /properties/order                   | propertyIds: complete exact order                                      |

Create a task:

```sh
curl 'https://your-domain/api/v1/tasks' \
  -H "Authorization: Bearer $SIMPLE_TASKS_API_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"title":"Prepare release","description":"**Review** the changes"}'
```

## Pagination and filters

`GET /tasks` accepts `limit` (integer 1–100, default 50), `cursor` (opaque),
`statusId`, `scope` (`all`, `active`, `completed`; default all), and `search`
(case-insensitive title/description). Unknown or repeated parameters fail with 422. Tasks are ordered by ascending immutable id; all completed history is
available, without the web board's 20-completions cap. The response includes
`pagination: { limit, hasMore, nextCursor }`. Repeat with `cursor=nextCursor`
and the same filters until `hasMore` is false. The cursor continues even if
the preceding task was deleted. Pages reflect concurrent changes, not a snapshot.

## Requests and behavior

JSON mutations require `Content-Type: application/json`; maximum body is
65,536 bytes, enforced while streaming, even without Content-Length. Unknown
fields fail. Dates must be ISO 8601 timestamps with a timezone or null; naive
or invalid dates fail with 422. Titles are trimmed, required and at most 160
characters; descriptions at most 20,000. See OpenAPI for each field's bounds.

Moving into a terminal status records completedAt, moving out clears it, and
moving between terminal statuses retains it. Setting propertyValues replaces
the full set atomically; use the individual-value route to change one value.
Properties support TEXT, NUMBER, DATE, SELECT, MULTI_SELECT. Selection options
must be nonempty and unique. Stored values must match the definition. A property
change cannot invalidate existing values. Deleting a property also deletes its
values and dependent statistics. States must be empty to delete, and at least
one must remain. Terminal states follow completion-date order; reordering them
is rejected. Orders must include every id exactly once. Active UI columns
continue to prioritize due dates over saved positions.

## Rate limits and errors

PostgreSQL atomically enforces fixed UTC-minute budgets across all instances:
120 requests/token/minute, of which at most 30 may be mutations, and 600
requests/minute for the entire instance, including unauthorized calls. There is
one shared instance row and one row per known token, never rows per attacker
credential or IP. Failed authorized calls consume the token budget, including
forbidden write attempts. Denied calls do not inflate counters. Reads remain
available after a token exhausts only its write allowance.

Authenticated responses include X-RateLimit-Limit, X-RateLimit-Remaining,
X-RateLimit-Write-Limit, X-RateLimit-Write-Remaining, and X-RateLimit-Reset (Unix
seconds). The instance-wide budget can reject sooner. A 429 always includes
Retry-After seconds (conservatively up to 60). Fixed windows allow bursts across
a minute boundary. For volumetric attacks add infrastructure/WAF rate limiting;
application limits require a database request and are not a network DDoS shield.

Errors use `{ "error": { "code", "message", "requestId", "details"? } }`.
X-Request-Id is returned on every API response; all API responses use no-store.
400: malformed JSON; 401: invalid/missing/revoked token; 403: insufficient access;
404: resource/route missing; 405: method; 409: data conflict; 413: body too large;
415: media type; 422: validation; 429: rate limit; 500: unexpected failure.
Validation details contain field paths and messages, never credentials or DB
connection details. 401 includes WWW-Authenticate: Bearer.

Wait Retry-After on 429. On a timeout, check the result before retrying POST:
there is no idempotency-key support. CORS is not enabled for browser clients on
other origins; prefer server-to-server integration. Statistics and authentication
preferences are not exposed as REST resources.

## Deployment and maintenance

Apply the additive migration with `bun run database:deploy`. Production builds
already do this automatically. No new environment variables or external rate
limiter services are required. Existing task data and MCP behavior are preserved.
Removing the REST routes is a code rollback; retain the new tables until tokens
and usage metadata are no longer needed. Never roll back by resetting the database.

The route registry owns request validation and dispatch; OpenAPI uses those same
validators and explicit response schemas. Tests verify authorization, persisted
hashes/revocation, pagination, concurrency, and UI creation/revocation.

Official references: [Next Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers),
[HeroUI TextField](https://heroui.com/en/docs/react/components/text-field),
[Node crypto](https://nodejs.org/api/crypto.html),
[PostgreSQL atomic INSERT/ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html),
[OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3.html).
