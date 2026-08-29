import type { Status } from '@/generated/prisma';
import type { StatusRepository } from '@/lib/statuses/repository';
import type {
  CreateStatusInput,
  ReorderStatusesInput,
  UpdateStatusInput,
} from '@/lib/statuses/types';
import { idSchema } from '@/lib/validation/common';
import {
  createStatusSchema,
  reorderStatusesSchema,
  updateStatusSchema,
} from '@/lib/validation/statuses';

/** Status use cases shared by UI actions and the MCP transport. */
export class StatusService {
  /** Injects the persistence abstraction used by status operations. */
  constructor(private readonly repository: StatusRepository) {}

  /** Lists all statuses in board order. */
  list(): Promise<Status[]> {
    return this.repository.list();
  }

  /** Validates and appends a customizable status. */
  create(input: CreateStatusInput): Promise<Status> {
    return this.repository.create(createStatusSchema.parse(input));
  }

  /** Validates and updates status presentation or terminal behavior. */
  update(input: UpdateStatusInput): Promise<Status> {
    return this.repository.update(updateStatusSchema.parse(input));
  }

  /** Removes an empty status while preserving at least one board column. */
  delete(id: string): Promise<void> {
    return this.repository.delete(idSchema.parse(id));
  }

  /** Validates and applies a complete status order. */
  reorder(input: ReorderStatusesInput): Promise<void> {
    return this.repository.reorder(reorderStatusesSchema.parse(input));
  }
}
