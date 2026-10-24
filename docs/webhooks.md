# Task webhooks

Configure **Connections → Task webhook** with one public HTTPS URL and save.
The destination receives every task event from the web interface, REST API and
MCP. The in-app guide at
[Webhook documentation](https://tasks.alejandrofernandezcamello.me/webhook-docs)
includes the full payload and an executable Node.js signature verifier.

## Receiver contract

Accept JSON `POST` requests and return any `2xx` status within five seconds after
accepting the event durably. Redirects and other statuses count as failures;
response bodies are ignored and never saved or displayed. Task mutations do not
wait for the receiver: the event is persisted with the task transaction and sent
after the response. Failed task transactions produce no event.

| Event          | Trigger                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| `task.created` | A task is created, including directly in a terminal state.                      |
| `task.updated` | Edit, explicit positional reorder, or individual custom property value change.  |
| `task.moved`   | A change of workflow state, including via an edit; supplies `previousStatusId`. |
| `task.deleted` | Deletion; carries the last complete snapshot.                                   |
| `webhook.test` | Owner-requested test; `data.task` is `null`, no task is modified.               |

Envelope: `schemaVersion: 1`, `id` (UUID), `type`, `occurredAt` (ISO 8601),
`data: { task, previousStatusId }`. Task snapshots include the task's fields,
status `{ id, name, isTerminal }`, and `propertyValues` entries with
`propertyId`, `name`, `type`, and typed `value`. Dates are ISO 8601 strings or
null. `previousStatusId` is null except for state changes. Completed tasks retain
the server's completion metadata. The same event id and payload survive retries.

Configuration changes to statuses, property definitions and statistics do not
emit task events; automatic position compaction of neighboring rows is not an
explicit task edit. Enabling the webhook does not replay previous task history.

## Verify requests

Read these headers:

- `X-Simple-Tasks-Id`: stable event UUID; deduplicate by this id.
- `X-Simple-Tasks-Event`: event type.
- `X-Simple-Tasks-Timestamp`: attempt time as Unix seconds.
- `X-Simple-Tasks-Signature`: `v1=` plus the hexadecimal HMAC-SHA256 of
  `timestamp + "." + rawBody`, using the signing secret from Connections.

Verify the original UTF-8 body before parsing JSON; reserializing JSON changes
its signature. Use constant-time comparison and a timestamp tolerance, e.g.
five minutes. Signatures and timestamps are refreshed for each attempt. Events
can arrive out of order; use `task.updatedAt` where applicable. Delivery is at
least once: a receiver may accept a request before a network interruption makes
its acknowledgment unavailable, so consumers must handle duplicate ids.

The signing secret is generated automatically and encrypted in PostgreSQL using
a key derived from the existing `AUTH_SECRET`. It is revealed only on explicit
owner request; no new environment variable is required. Keep `AUTH_SECRET`
stable. Existing REST API tokens and their storage are unchanged.

## Retry processing

There are five automatic attempts total. After failures, events become eligible
again after 1 minute, 5 minutes, 30 minutes and 2 hours. These are minimum delays,
not promises about arrival time. Expiring leases prevent concurrent workers from
sending the same active event and allow recovery after interruption.

Normal board/Connections visits and UI/REST/MCP requests process ready events in
bounded batches of five after responding. For retries **while the app is idle**,
configure your scheduler to call the following endpoint periodically with an
existing read/write API token:

```sh
curl -X POST 'https://tasks.alejandrofernandezcamello.me/api/webhooks/dispatch' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

`GET` is also supported. Each request processes at most five ready events and
returns `{ "data": { "processed": 0 } }` with the actual count. Missing/revoked
tokens receive `401`; read-only tokens receive `403`. Existing API instance and
token request/write limits apply (`429` with `Retry-After`). A one-minute
scheduler interval is a useful starting point; call more often or repeatedly
for a larger backlog, within those limits. No scheduler is created implicitly.

After-response delivery requires a host supporting Next.js `after`. The drain
endpoint is also available on hosts where after-response execution is limited.

In Connections, **Send test** sends a clearly marked test and refreshes history.
**Retry** keeps the event id/payload and restarts its attempt budget. **Refresh
results** reads the latest delivery state. The owner sees ten recent results,
including HTTP status, attempts, next eligible time and safe error categories;
response bodies, credentials and task payloads are omitted. Terminal results
are retained for 14 days and cleaned during active delivery processing.

## Pause and destination changes

Saving a changed URL or enabled state cancels the previous configuration's queued
events. An already-running request may still reach its old destination. Paused
webhooks do not queue new task events. The signing secret is retained across
changes; **Test** and **Retry** always use saved settings.

Only public HTTPS on port 443 is accepted, without URL credentials or fragments.
Every resolved address is checked; loopback, private, reserved and link-local
addresses are blocked, including IPv4-mapped IPv6. The HTTPS connection pins a
validated address, verifies the certificate, and does not follow redirects.
Task descriptions and populated properties leave the instance in the payload:
configure a receiver you trust.

## Deployment and rollback

The additive migration `20261024105000_task_webhooks` creates only the singleton
configuration and delivery tables, plus indexes/check constraints. It does not
rewrite existing task rows. Prisma reads the multi-file schema from `prisma/`.
Run the normal migration/deployment commands; do not reset the database.

Rollback can deploy the previous application while retaining the new tables;
the old application neither reads nor writes them. Pending deliveries can be
processed when the new application returns. No destructive down migration is
needed or performed. Stop the external scheduler when rolling the application
back to a version without the dispatch endpoint.
