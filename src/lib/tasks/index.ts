import { db } from '@/lib/db/client';
import { PrismaTaskRepository } from '@/lib/tasks/prisma-repository';
import { TaskService } from '@/lib/tasks/service';

export const taskService = new TaskService(new PrismaTaskRepository(db));

export type * from '@/lib/tasks/types';
