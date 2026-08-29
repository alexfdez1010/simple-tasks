import type { Status } from '@/generated/prisma';

export type CreateStatusInput = Pick<Status, 'name' | 'color' | 'isTerminal'>;
export type UpdateStatusInput = {
  id: string;
  name?: string;
  color?: string;
  isTerminal?: boolean;
};
export type ReorderStatusesInput = { statusIds: string[] };
