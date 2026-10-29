import { PrismaClient } from '@/generated/prisma';
import { expect, type Page, type Locator } from '@playwright/test';

/** Explicit disposable datasource prevents browser fixtures from touching the user's deployment. */
export const workspaceDb = new PrismaClient({
  datasourceUrl:
    process.env.TEST_DATABASE_URL ??
    `postgresql://postgres:postgres@localhost:${process.env.TEST_DATABASE_PORT ?? '55433'}/simple_tasks_test?schema=public`,
});
export const WORKSPACE_PREFIX = 'E2E workspace ';

/** Authenticates through the visible gateway using the disposable server password. */
export async function loginWorkspace(page: Page): Promise<void> {
  await page.goto('/login');
  await page
    .getByLabel('Password')
    .fill(process.env.PASSWORD ?? 'test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Tasks', exact: true }),
  ).toBeVisible();
}

/** Selects a labelled HeroUI field by its visible option text. */
export async function selectWorkspaceOption(
  scope: Page | Locator,
  label: string,
  value: string,
) {
  await scope.getByRole('button', { name: new RegExp(label) }).click();
  const page = 'page' in scope ? scope.page() : scope;
  await page.getByRole('option', { name: value, exact: true }).click();
}

/** Seeds a human-to-agent dependency chain only in the isolated test database. */
export async function seedWorkspace() {
  await clearWorkspace();
  const person = await workspaceDb.assignee.create({
    data: { name: WORKSPACE_PREFIX + 'human', kind: 'HUMAN', color: '#C3986A' },
  });
  const agent = await workspaceDb.assignee.create({
    data: {
      name: WORKSPACE_PREFIX + 'agent',
      kind: 'AGENT',
      description: 'Check all acceptance criteria.',
      color: '#7297CA',
    },
  });
  const project = await workspaceDb.project.create({
    data: {
      name: WORKSPACE_PREFIX + 'project',
      description: 'Shared project context',
    },
  });
  const a = await workspaceDb.task.create({
    data: {
      title: WORKSPACE_PREFIX + 'requirements',
      description: '**Acceptance criteria**',
      assigneeId: person.id,
      projectId: project.id,
      statusId: 'todo',
      position: 0,
    },
  });
  const b = await workspaceDb.task.create({
    data: {
      title: WORKSPACE_PREFIX + 'implementation',
      description: 'Implement the agreed requirements.',
      assigneeId: agent.id,
      projectId: project.id,
      statusId: 'todo',
      position: 1,
      dependencies: { create: { dependsOnId: a.id } },
    },
  });
  return { person, agent, project, a, b };
}

/** Removes only this suite's graph and related entities, clearing prerequisite edges first. */
export async function clearWorkspace() {
  const tasks = await workspaceDb.task.findMany({
    where: {
      OR: [
        { title: { startsWith: WORKSPACE_PREFIX } },
        { project: { name: { startsWith: WORKSPACE_PREFIX } } },
      ],
    },
    select: { id: true },
  });
  const ids = tasks.map((task) => task.id);
  await workspaceDb.taskDependency.deleteMany({
    where: { OR: [{ taskId: { in: ids } }, { dependsOnId: { in: ids } }] },
  });
  await workspaceDb.task.deleteMany({ where: { id: { in: ids } } });
  await workspaceDb.project.deleteMany({
    where: { name: { startsWith: WORKSPACE_PREFIX } },
  });
  await workspaceDb.assignee.deleteMany({
    where: { name: { startsWith: WORKSPACE_PREFIX } },
  });
}
