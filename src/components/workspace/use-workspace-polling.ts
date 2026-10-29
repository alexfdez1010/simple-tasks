'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkspaceSnapshot } from '@/lib/coordination/snapshot';

/** Polls authenticated snapshots without overlap, hidden-tab requests, stale responses or draft remounts. */
export function useWorkspacePolling(initial: WorkspaceSnapshot) {
  const [snapshot, setSnapshot] = useState(initial);
  const [seconds, setSeconds] = useState(15);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const etag = useRef<string | null>(null);
  const serialized = useRef(JSON.stringify(initial));
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const generation = useRef(0);
  /** Fetches at most one response and publishes only changed snapshots from the current request. */
  const refresh = useCallback(async (force = false) => {
    if (force && active.current) {
      generation.current++;
      active.current.abort();
      active.current = null;
    }
    if (active.current || document.hidden) return;
    if (!navigator.onLine) {
      setFailed(true);
      return;
    }
    const controller = new AbortController();
    const current = ++generation.current;
    active.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch('/api/workspace', {
        headers: etag.current ? { 'If-None-Match': etag.current } : {},
        signal: controller.signal,
        cache: 'no-cache',
      });
      if (!mounted.current || current !== generation.current) return;
      if (response.status !== 304) {
        if (
          !response.ok ||
          !response.headers.get('content-type')?.includes('application/json')
        )
          throw new Error('Snapshot unavailable');
        const value = (await response.json()) as WorkspaceSnapshot;
        const text = JSON.stringify(value);
        if (!mounted.current || current !== generation.current) return;
        etag.current = response.headers.get('etag');
        if (text !== serialized.current) {
          serialized.current = text;
          setSnapshot(value);
        }
      }
      setLastSynced(Date.now());
      setFailed(false);
    } catch {
      if (mounted.current && current === generation.current) setFailed(true);
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) active.current = null;
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    /** Schedules after completion, so a slow server never accumulates overlapping requests. */
    async function tick() {
      await refresh();
      if (!cancelled && seconds > 0) timer = setTimeout(tick, seconds * 1000);
    }
    /** Refreshes promptly when the tab returns without creating a second polling loop. */
    function visible() {
      if (!document.hidden) void refresh();
    }
    if (seconds > 0) timer = setTimeout(tick, seconds * 1000);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('online', visible);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('online', visible);
    };
  }, [refresh, seconds]);
  useEffect(
    () => () => {
      mounted.current = false;
      generation.current++;
      active.current?.abort();
    },
    [],
  );
  return { snapshot, seconds, setSeconds, lastSynced, failed, refresh };
}
