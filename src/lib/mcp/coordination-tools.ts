import 'server-only';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { coordinationService } from '@/lib/coordination';
import {
  assigneeFields,
  deleteAssigneeSchema,
  projectFields,
  readyQuery,
  startTaskSchema,
  updateAssigneeSchema,
  updateProjectSchema,
} from '@/lib/coordination/schemas';
import { summarizeAgentWork } from '@/lib/mcp/task-summary';
import { runMcpTool } from '@/lib/mcp/shared';
import { listTaskPage } from '@/lib/api/pagination';
import { taskQuery } from '@/lib/api/schemas';
import { db } from '@/lib/db/client';

/** Exposes dynamic ownership, projects and deterministic ready-work selection to any authenticated MCP client. */
export function registerCoordinationTools(server: McpServer): void {
  server.registerTool(
    'list_assignees',
    {
      title: 'List responsible parties',
      description:
        'List database-configured humans and agents, including instructions and node colors.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => runMcpTool(() => coordinationService.listAssignees()),
  );
  server.registerTool(
    'create_assignee',
    {
      title: 'Create a responsible party',
      description:
        'Create a human or agent with name, kind, instructions and a #RRGGBB color. No agent names are hard-coded.',
      inputSchema: assigneeFields.shape,
    },
    async (input) =>
      runMcpTool(() => coordinationService.createAssignee(input)),
  );
  server.registerTool(
    'update_assignee',
    {
      title: 'Update a responsible party',
      description:
        'Edit an owner’s name, kind, instructions or node color. Existing task assignments retain the same identifier.',
      inputSchema: updateAssigneeSchema.shape,
    },
    async (input) =>
      runMcpTool(() => coordinationService.updateAssignee(input)),
  );
  server.registerTool(
    'delete_assignee',
    {
      title: 'Delete a responsible party',
      description:
        'Delete an unused human or agent by id. Reassign all owned tasks and reviews first, including completed history. The default responsible party is protected. Confirm with the user before calling.',
      inputSchema: deleteAssigneeSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (input) =>
      runMcpTool(async () => {
        await coordinationService.deleteAssignee(input);
        return { deleted: input.id };
      }),
  );
  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description: 'List persisted project names and shared instructions.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => runMcpTool(() => coordinationService.listProjects()),
  );
  server.registerTool(
    'create_project',
    {
      title: 'Create a project',
      description:
        'Create a project for grouping task graphs, with optional shared instructions.',
      inputSchema: projectFields.shape,
    },
    async (input) => runMcpTool(() => coordinationService.createProject(input)),
  );
  server.registerTool(
    'update_project',
    {
      title: 'Update a project',
      description:
        'Edit project name and shared instructions while preserving tasks.',
      inputSchema: updateProjectSchema.shape,
    },
    async (input) => runMcpTool(() => coordinationService.updateProject(input)),
  );
  server.registerTool(
    'list_ready_tasks',
    {
      title: 'List available work',
      description:
        'Return up to limit tasks assigned to assigneeId in a READY non-terminal state with every prerequisite completed. This query does not reserve work; call start_task before executing.',
      inputSchema: readyQuery.shape,
      annotations: { readOnlyHint: true },
    },
    async (input) =>
      runMcpTool(async () =>
        (await coordinationService.ready(input)).map(summarizeAgentWork),
      ),
  );
  server.registerTool(
    'start_task',
    {
      title: 'Start an assigned task',
      description:
        'Atomically recheck ownership and prerequisites and move one available task to a WORKING state. Concurrent or repeated starts return a conflict. Never starts a model or creates a schedule.',
      inputSchema: startTaskSchema.shape,
    },
    async (input) => runMcpTool(() => coordinationService.start(input)),
  );
  server.registerTool(
    'search_tasks',
    {
      title: 'Search task history',
      description:
        'Search and paginate the complete task history, including completed prerequisites older than the board preview. Filter by assigneeId, projectId, statusId or scope.',
      inputSchema: taskQuery.shape,
      annotations: { readOnlyHint: true },
    },
    async (input) => runMcpTool(() => listTaskPage(db, input)),
  );
}
