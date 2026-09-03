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

## Rules

- Ask for confirmation before \`delete_task\`, \`delete_status\`, \`delete_property\`, or \`delete_statistic\`.
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
