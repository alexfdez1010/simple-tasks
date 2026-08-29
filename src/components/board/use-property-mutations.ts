'use client';

import type { Dispatch, SetStateAction } from 'react';

import type {
  BoardStatus,
  MutationResult,
  PropertyDefinition,
  PropertyValues,
} from '@/components/board/types';
import {
  createPropertyAction,
  deletePropertyAction,
  reorderPropertiesAction,
  updatePropertyAction,
} from '@/lib/properties/actions';

interface PropertyMutationOptions {
  statuses: BoardStatus[];
  properties: PropertyDefinition[];
  setStatuses: Dispatch<SetStateAction<BoardStatus[]>>;
  setProperties: Dispatch<SetStateAction<PropertyDefinition[]>>;
  refresh: () => void;
}

/**
 * Provides optimistic property-definition mutations with rollback.
 *
 * @param options - Current definitions, state setter, and refresh callback.
 * @returns Create, update, delete, and reorder operations.
 */
export function usePropertyMutations({
  statuses,
  properties,
  setStatuses,
  setProperties,
  refresh,
}: PropertyMutationOptions) {
  /** Creates an optimistic property at the end of the configured order. */
  async function create(values: PropertyValues): Promise<MutationResult> {
    const snapshot = structuredClone(properties);
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    const optimistic: PropertyDefinition = {
      id: optimisticId,
      ...values,
      position: snapshot.length,
    };
    setProperties([...snapshot, optimistic]);
    const result = await createPropertyAction(values);
    if (!result.success) setProperties(snapshot);
    else {
      const saved = result.data;
      if (saved) {
        setProperties((current) =>
          current.map((property) =>
            property.id === optimisticId ? saved : property,
          ),
        );
      }
      refresh();
    }
    return result;
  }

  /** Updates a definition optimistically while retaining its position. */
  async function update(
    propertyId: string,
    values: PropertyValues,
  ): Promise<MutationResult> {
    const snapshot = structuredClone(properties);
    setProperties(
      snapshot.map((property) =>
        property.id === propertyId ? { ...property, ...values } : property,
      ),
    );
    const result = await updatePropertyAction({ id: propertyId, ...values });
    if (!result.success) setProperties(snapshot);
    else {
      const saved = result.data;
      if (saved) {
        setProperties((current) =>
          current.map((property) =>
            property.id === propertyId ? saved : property,
          ),
        );
      }
      refresh();
    }
    return result;
  }

  /** Deletes a property optimistically and restores it on failure. */
  async function remove(propertyId: string): Promise<MutationResult> {
    const propertySnapshot = structuredClone(properties);
    const statusSnapshot = structuredClone(statuses);
    setProperties(
      propertySnapshot.filter((property) => property.id !== propertyId),
    );
    setStatuses(
      statusSnapshot.map((status) => ({
        ...status,
        tasks: status.tasks.map((task) => ({
          ...task,
          propertyValues: task.propertyValues.filter(
            (value) => value.propertyId !== propertyId,
          ),
        })),
      })),
    );
    const result = await deletePropertyAction(propertyId);
    if (!result.success) {
      setProperties(propertySnapshot);
      setStatuses(statusSnapshot);
    } else refresh();
    return result;
  }

  /** Moves one definition and persists the complete property ordering. */
  async function reorder(
    propertyId: string,
    direction: -1 | 1,
  ): Promise<MutationResult> {
    const snapshot = structuredClone(properties);
    const from = snapshot.findIndex((property) => property.id === propertyId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= snapshot.length) return { success: true };
    const next = [...snapshot];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const positioned = next.map((property, position) => ({
      ...property,
      position,
    }));
    setProperties(positioned);
    const result = await reorderPropertiesAction({
      propertyIds: positioned.map((property) => property.id),
    });
    if (!result.success) setProperties(snapshot);
    return result;
  }

  return { create, update, remove, reorder };
}
