import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

const DEFAULT_STATUSES = [
  {
    id: 'blocked',
    name: 'Bloqueado',
    color: '#ef4444',
    position: 0,
    isTerminal: false,
  },
  {
    id: 'todo',
    name: 'Por hacer',
    color: '#64748b',
    position: 1,
    isTerminal: false,
  },
  {
    id: 'in-progress',
    name: 'En progreso',
    color: '#3b82f6',
    position: 2,
    isTerminal: false,
  },
  {
    id: 'done',
    name: 'Terminado',
    color: '#22c55e',
    position: 3,
    isTerminal: true,
  },
] as const;

/** Creates the default workflow only when the board has never been initialized. */
async function seed(): Promise<void> {
  if ((await prisma.status.count()) > 0) return;
  await prisma.status.createMany({
    data: [...DEFAULT_STATUSES],
    skipDuplicates: true,
  });
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
