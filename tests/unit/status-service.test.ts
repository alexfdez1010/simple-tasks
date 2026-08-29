import type { Status } from '@/generated/prisma';
import type { StatusRepository } from '@/lib/statuses/repository';
import { StatusService } from '@/lib/statuses/service';
import { describe, expect, it, vi } from 'vitest';

const SAVED_STATUS = {
  color: '#2667FF',
  id: 'status-1',
  isTerminal: false,
  name: 'To do',
  position: 0,
} satisfies Status;

/** Creates an isolated persistence spy for status use cases. */
function createRepository(
  overrides: Partial<StatusRepository> = {},
): StatusRepository {
  return {
    create: vi.fn(async () => SAVED_STATUS),
    delete: vi.fn(async () => undefined),
    list: vi.fn(async () => []),
    reorder: vi.fn(async () => undefined),
    update: vi.fn(async () => SAVED_STATUS),
    ...overrides,
  };
}

describe('StatusService', () => {
  /** Proves status presentation fields are normalized before persistence. */
  it('validates and normalizes a new status', async () => {
    const repository = createRepository();
    const service = new StatusService(repository);

    await service.create({
      color: '#A1b2C3',
      isTerminal: true,
      name: '  Archived  ',
    });

    expect(repository.create).toHaveBeenCalledWith({
      color: '#A1b2C3',
      isTerminal: true,
      name: 'Archived',
    });
  });

  /** Proves colors and names must satisfy the public status contract. */
  it('rejects invalid names and colors before persistence', () => {
    const repository = createRepository();
    const service = new StatusService(repository);

    expect(() =>
      service.create({ color: 'blue', isTerminal: false, name: 'Valid' }),
    ).toThrow();
    expect(() =>
      service.create({ color: '#123456', isTerminal: false, name: '   ' }),
    ).toThrow();
    expect(repository.create).not.toHaveBeenCalled();
  });

  /** Proves terminal behavior can be changed without overwriting omitted fields. */
  it('accepts focused terminal updates', async () => {
    const repository = createRepository();
    const service = new StatusService(repository);

    await service.update({ id: ' status-1 ', isTerminal: true });

    expect(repository.update).toHaveBeenCalledWith({
      id: 'status-1',
      isTerminal: true,
    });
  });

  /** Proves complete status ordering is non-empty and retains caller order. */
  it('validates a complete ordered status list', async () => {
    const repository = createRepository();
    const service = new StatusService(repository);

    await service.reorder({
      statusIds: [' status-3 ', 'status-1', 'status-2'],
    });
    expect(repository.reorder).toHaveBeenCalledWith({
      statusIds: ['status-3', 'status-1', 'status-2'],
    });

    expect(() => service.reorder({ statusIds: [] })).toThrow();
  });
});
