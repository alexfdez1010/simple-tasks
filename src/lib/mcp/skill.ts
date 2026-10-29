import 'server-only';

export const MCP_CLIENT_TOKEN_ENV = 'SIMPLE_TASKS_MCP_TOKEN';
export const SKILL_FILENAME = 'SKILL.md';
export const MCP_CONFIG_FILENAME = 'simple-tasks.mcp.json';

/** Builds the downloadable agent skill instructions for this deployment. */
export function buildSkillMarkdown(serverUrl: string): string {
  return `---
name: simple-tasks
description: Manage the user's private Kanban board and configurable analytics through its Simple Tasks MCP server. Use for tasks, workflow statuses, task properties, and statistics.
---

# Simple Tasks

Use the MCP server at \`${serverUrl}\`. Discover exact input schemas with \`tools/list\`.

| Tool | Purpose |
|---|---|
| \`list_board\` | Read ordered statuses and tasks; active tasks sort by due date and terminal statuses contain only the 20 latest completions. |
| \`get_task\` | Read one task and its current status. |
| \`create_task\` | Create a task with optional Markdown, due date, and configured property values. |
| \`update_task\` | Atomically edit fields, replace configured values, and optionally move a task. |
| \`move_task\` | Move a task to a status and zero-based index. |
| \`reorder_tasks\` | Replace the complete order of a non-terminal column. |
| \`delete_task\` | Permanently delete a task. |
| \`list_statuses\` | Read configured statuses. |
| \`create_status\` | Add a status with name, hex color, and terminal behavior. |
| \`update_status\` | Customize a status. |
| \`reorder_statuses\` | Replace the complete status order. |
| \`delete_status\` | Delete an empty status. |
| \`list_properties\` | Read ordered configurable property definitions. |
| \`create_property\` | Add a TEXT, NUMBER, DATE, SELECT, or MULTI_SELECT definition. |
| \`update_property\` | Edit a definition without invalidating stored values. |
| \`reorder_properties\` | Replace the complete property order. |
| \`delete_property\` | Delete a definition and all of its values. |
| \`set_task_property_value\` | Validate and set one configured task value. |
| \`delete_task_property_value\` | Clear one configured value from a task. |
| \`get_statistics\` | Calculate every configured statistic against the complete task history. |
| \`list_statistics\` | Read ordered statistic widget definitions. |
| \`create_statistic\` | Add a styled KPI, bar, donut, or line widget; name alone creates an all-task count KPI. |
| \`update_statistic\` | Edit one statistic definition, including its colour and size. |
| \`reorder_statistics\` | Replace the complete statistic order. |
| \`delete_statistic\` | Delete one statistic definition. |

## Coordination

- Every task has a database-backed responsible party and project. Use \`list_assignees\` and \`list_projects\` for IDs; do not hard-code agent names.
- Use \`create_assignee\` / \`update_assignee\` with name, HUMAN or AGENT kind, description/instructions and a #RRGGBB color. Use \`create_project\` / \`update_project\` for shared project context.
- Use \`delete_assignee\` with id to remove an unused responsible party. Reassign all owned tasks and reviews first, including completed history. The default responsible party is protected. Legacy assignment SELECT options are cleaned atomically; an emptied list retains the default owner.
- Set \`assigneeId\`, \`projectId\` and \`dependencyIds\` in \`create_task\` / \`update_task\`. Dependencies are prerequisite task IDs; cycles and self-reference are rejected.
- For compatibility, omitted ownership uses a supplied legacy Responsable/Assignee property, otherwise Alejandro for creation; updates retain the current owner. New integrations should always send assigneeId explicitly.
- Call \`list_ready_tasks\` with your assigneeId and optional projectId/limit. It returns READY tasks with all prerequisites completed; it does not reserve them.
- Call \`start_task\` with id and assigneeId before working. It rechecks readiness atomically and moves to a WORKING status. A competing start returns a conflict; choose another task. This is durable workflow ownership, without an automatic lease timeout. If interrupted, leave context and explicitly move/reassign the task when appropriate.
- Read \`get_task\` for owner instructions, project context and prerequisite results. Use \`search_tasks\` for filtered, cursor-paginated full history.
- Finish through \`update_task\` or \`move_task\` only after prerequisites are complete. Record the result in the description while preserving existing content. Status workType is READY, WORKING or BLOCKED; isTerminal determines completion. Clients invoke agents and scheduling externally; this server does not start models.
- Send expectedUpdatedAt from the latest get_task in update_task to reject stale edits.

## Optional review

- Set reviewerId to a different configured human or agent, or null for no review. The original responsible party stays assigned.
- Call submit_task_for_review with id and assigneeId when the deliverable is ready. It enters REVIEW and does not unlock dependents yet.
- Check list_pending_reviews with your reviewerId as well as list_ready_tasks with your assigneeId.
- Call review_task with id, reviewerId, expectedUpdatedAt from the version inspected, and APPROVE or REQUEST_CHANGES. Requested changes require a note and return the work to its owner; approval completes it.
- Content/assignment/dependency changes invalidate pending or approved review. Re-read stale tasks instead of approving a newer version blindly. Responsible-party IDs coordinate trusted clients using the existing shared MCP credential; they are not separate authentication identities.

## Rules

- Ask for confirmation before \`delete_task\`, \`delete_status\`, \`delete_property\`, \`delete_statistic\`, or \`delete_assignee\`, unless the user has already explicitly requested that deletion.
- Preserve Markdown exactly in task descriptions unless the user requests edits.
- Send due dates as ISO 8601 strings.
- In \`update_task\`, send \`statusId\` and \`index\` together; \`propertyValues\` replaces the complete value set.
- Use \`set_task_property_value\` to change one configured value without clearing the others.
- Reorder calls require every id in the affected collection exactly once.
- Non-terminal statuses are ordered by due date ascending; terminal statuses are ordered by completion date descending, so do not call \`reorder_tasks\` on terminal statuses.
- Moving a task into a terminal status fills its completion date automatically; moving it back to an active status clears the date.
- Statistic numeric measures (SUM, AVERAGE, MINIMUM, MAXIMUM) require a NUMBER property. Line charts require a DATE dimension, which may use CREATED_AT, UPDATED_AT, DUE_DATE, COMPLETED_AT, or a custom DATE property.
- Set dateRange to ALL_TIME, TODAY, LAST_7_DAYS, LAST_30_DAYS, LAST_90_DAYS, THIS_WEEK, THIS_MONTH, THIS_QUARTER, THIS_YEAR, NEXT_7_DAYS, or NEXT_30_DAYS. Every non-ALL_TIME range requires dateField and is recalculated when statistics are requested; use datePropertyId when dateField is PROPERTY.
- Use statusIds to filter a statistic. An empty statusIds list means every status.
- Set color to FOREST, OCEAN, IRIS, AMBER, CORAL, or GRAPHITE. Set size to AUTO, COMPACT, SQUARE, WIDE, or FULL. Both fields can be changed later with \`update_statistic\`.
`;
}

/** Builds a remote HTTP MCP config that reads its bearer token from the client environment. */
export function buildMcpConfig(serverUrl: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        'simple-tasks': {
          type: 'http',
          url: serverUrl,
          headers: { Authorization: `Bearer \${${MCP_CLIENT_TOKEN_ENV}}` },
        },
      },
    },
    null,
    2,
  );
}
