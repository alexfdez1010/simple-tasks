import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { reviewService } from '@/lib/coordination/reviews';
import {
  reviewDecisionSchema,
  reviewQuery,
  submitReviewSchema,
} from '@/lib/coordination/schemas';
import { summarizeAgentWork } from '@/lib/mcp/task-summary';
import { runMcpTool } from '@/lib/mcp/shared';

/** Exposes optional independent review using the same dynamic responsible-party IDs as assignment. */
export function registerReviewTools(server: McpServer): void {
  server.registerTool(
    'list_pending_reviews',
    {
      title: 'List pending reviews',
      description:
        'List up to limit tasks awaiting a decision by reviewerId, as compact task summaries. Read get_task for deliverables, owner instructions and prerequisite context.',
      inputSchema: reviewQuery.shape,
      annotations: { readOnlyHint: true },
    },
    async (input) =>
      runMcpTool(async () =>
        (await reviewService.list(input)).map(summarizeAgentWork),
      ),
  );
  server.registerTool(
    'submit_task_for_review',
    {
      title: 'Submit a task for review',
      description:
        'Send the assignee’s task to its optional reviewer after prerequisites are complete. It stays uncompleted and does not unlock dependents.',
      inputSchema: submitReviewSchema.shape,
    },
    async (input) => runMcpTool(() => reviewService.submit(input)),
  );
  server.registerTool(
    'review_task',
    {
      title: 'Decide a pending review',
      description:
        'The assigned reviewer approves the exact expectedUpdatedAt version or requests changes with a required note. Approval completes the task; requested changes return it to READY for its original owner. Shared MCP clients cooperate using explicit IDs; these IDs are not separate authentication credentials.',
      inputSchema: reviewDecisionSchema.innerType().shape,
    },
    async (input) => runMcpTool(() => reviewService.decide(input)),
  );
}
