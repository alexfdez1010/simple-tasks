'use client';
import { useSyncExternalStore } from 'react';

/** Subscribes only to private fragment changes; no secret is sent to the server. */
function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** Reads the invitation from the browser fragment, excluding all public query parameters. */
function getSnapshot(): string {
  return new URLSearchParams(window.location.hash.slice(1)).get('invite') ?? '';
}

/** Supplies a stable empty server snapshot without embedding the invitation in rendered HTML. */
function getServerSnapshot(): null {
  return null;
}

/** Reads the private signup capability with hydration-safe browser synchronization. */
export function useOwnerInvitation(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
