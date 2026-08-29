import 'server-only';

export const MCP_CLIENT_TOKEN_ENV = 'SIMPLE_TASKS_MCP_TOKEN';
export const SKILL_FILENAME = 'SKILL.md';
export const MCP_CONFIG_FILENAME = 'simple-tasks.mcp.json';

/** Builds the downloadable agent skill instructions for this deployment. */
export function buildSkillMarkdown(serverUrl: string): string {
  return `---
name: simple-tasks
description: Manage the user's private Kanban board through its Simple Tasks MCP server. Use for listing, creating, editing, moving, ordering, or deleting tasks and statuses.
---

# Simple Tasks

Use the MCP server at \`${serverUrl}\`. Discover exact input schemas with \`tools/list\`.

| Tool | Purpose |
|---|---|
| \`list_board\` | Read ordered statuses and tasks; terminal statuses contain only 20 recent completions. |
| \`get_task\` | Read one task and its current status. |
| \`create_task\` | Create a task with optional Markdown description and due date. |
| \`update_task\` | Edit title, Markdown description, or due date. |
| \`move_task\` | Move a task to a status and zero-based index. |
| \`reorder_tasks\` | Replace the complete order of a non-terminal column. |
| \`delete_task\` | Permanently delete a task. |
| \`list_statuses\` | Read configured statuses. |
| \`create_status\` | Add a status with name, hex color, and terminal behavior. |
| \`update_status\` | Customize a status. |
| \`reorder_statuses\` | Replace the complete status order. |
| \`delete_status\` | Delete an empty status. |

## Rules

- Ask for confirmation before \`delete_task\` or \`delete_status\`.
- Preserve Markdown exactly in task descriptions unless the user requests edits.
- Send due dates as ISO 8601 strings.
- Reorder calls require every id in the affected collection exactly once.
- Terminal statuses are ordered by completion time, so do not call \`reorder_tasks\` on them.
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
