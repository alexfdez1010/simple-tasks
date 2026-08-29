import type { Status } from '@/generated/prisma';
import type {
  CreateStatusInput,
  ReorderStatusesInput,
  UpdateStatusInput,
} from '@/lib/statuses/types';

/** Focused persistence contract consumed by status business logic. */
export interface StatusRepository {
  /** Returns all statuses in board order. */
  list(): Promise<Status[]>;
  /** Persists a validated status at the end of the board. */
  create(input: CreateStatusInput): Promise<Status>;
  /** Persists validated status presentation and behavior. */
  update(input: UpdateStatusInput): Promise<Status>;
  /** Removes an empty status while preserving board invariants. */
  delete(id: string): Promise<void>;
  /** Applies the exact complete status order. */
  reorder(input: ReorderStatusesInput): Promise<void>;
}
