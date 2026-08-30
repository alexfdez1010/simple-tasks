'use client';

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Retains optimistic state until a refreshed server value changes identity.
 *
 * @param serverValue - Latest serializable value delivered by the server tree.
 * @returns Current reconciled value and its optimistic state setter.
 * @remarks Reconciliation occurs during render so descendants never receive a
 * stale snapshot and their independent UI state remains mounted.
 */
export function useServerReconciledState<T>(
  serverValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [previousServerValue, setPreviousServerValue] = useState(serverValue);
  const [value, setValue] = useState(serverValue);

  if (serverValue !== previousServerValue) {
    setPreviousServerValue(serverValue);
    setValue(serverValue);
  }

  return [value, setValue];
}
