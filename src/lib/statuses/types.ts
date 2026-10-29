import type { Status } from '@/generated/prisma';

export type CreateStatusInput = Pick<
  Status,
  'name' | 'color' | 'isTerminal'
> & { workType?: Status['workType'] };
export type UpdateStatusInput = {
  id: string;
  workType?: 'READY' | 'WORKING' | 'BLOCKED' | 'REVIEW';
  name?: string;
  color?: string;
  isTerminal?: boolean;
};
export type ReorderStatusesInput = { statusIds: string[] };
