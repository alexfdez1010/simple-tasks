import { expect, test } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  clearWorkspace,
  loginWorkspace,
  seedWorkspace,
  workspaceDb,
} from './workspace-fixtures';
let fixtures: Awaited<ReturnType<typeof seedWorkspace>>;
test.beforeEach(async () => {
  fixtures = await seedWorkspace();
  await workspaceDb.task.update({
    where: { id: fixtures.a.id },
    data: { reviewerId: fixtures.agent.id },
  });
});
test.afterEach(async () => {
  await clearWorkspace();
});
test.afterAll(async () => {
  await workspaceDb.$disconnect();
});

/** Connects the real MCP transport and decodes its standard text response. */
async function reviewClient() {
  const client = new Client({ name: 'review-e2e', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL(
      '/api/mcp/mcp',
      process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    ),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${process.env.MCP_TOKEN ?? 'test-mcp-token-at-least-thirty-two-characters'}`,
        },
      },
    },
  );
  await client.connect(transport);
  return { client, transport };
}

/** Proves humans can send work to a configured reviewer and request actionable changes. */
test('submits optional review and returns feedback to the original owner', async ({
  page,
}) => {
  await loginWorkspace(page);
  await page
    .getByRole('button', { name: new RegExp(fixtures.a.title) })
    .click();
  const dialog = page.getByTestId('task-panel');
  await expect(
    dialog.getByText(fixtures.agent.name, { exact: false }),
  ).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Send for review', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole('button', { name: new RegExp(fixtures.a.title) })
    .click();
  const review = page.getByTestId('task-panel');
  await expect(
    review.getByRole('button', { name: 'Request changes', exact: true }),
  ).toBeDisabled();
  await review
    .getByRole('textbox', { name: 'Review feedback', exact: true })
    .fill('Add the edge cases.');
  await review
    .getByRole('button', { name: 'Request changes', exact: true })
    .click();
  await expect(review).toHaveCount(0);
  expect(
    await workspaceDb.task.findUnique({ where: { id: fixtures.a.id } }),
  ).toMatchObject({
    assigneeId: fixtures.person.id,
    reviewState: 'CHANGES_REQUESTED',
    reviewNote: 'Add the edge cases.',
    completedAt: null,
  });
});

/** Proves an agent can query its review queue and approve through MCP, unlocking downstream work. */
test('reviews through MCP and exposes downstream readiness after approval', async () => {
  const { client, transport } = await reviewClient();
  try {
    const submit = await client.callTool({
      name: 'submit_task_for_review',
      arguments: { id: fixtures.a.id, assigneeId: fixtures.person.id },
    });
    expect(submit.isError).not.toBe(true);
    const listed = await client.callTool({
      name: 'list_pending_reviews',
      arguments: { reviewerId: fixtures.agent.id },
    });
    expect(listed.isError).not.toBe(true);
    const task = await workspaceDb.task.findUniqueOrThrow({
      where: { id: fixtures.a.id },
    });
    const result = await client.callTool({
      name: 'review_task',
      arguments: {
        id: task.id,
        reviewerId: fixtures.agent.id,
        expectedUpdatedAt: task.updatedAt.toISOString(),
        decision: 'APPROVE',
      },
    });
    expect(result.isError).not.toBe(true);
    expect(
      await workspaceDb.task.findUnique({ where: { id: task.id } }),
    ).toMatchObject({ reviewState: 'APPROVED', statusId: 'done' });
    const ready = await client.callTool({
      name: 'list_ready_tasks',
      arguments: { assigneeId: fixtures.agent.id },
    });
    expect(ready.isError).not.toBe(true);
    expect(JSON.stringify(ready)).toContain(fixtures.b.id);
  } finally {
    await transport.close();
  }
});
