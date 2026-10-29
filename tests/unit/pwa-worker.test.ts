import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(
  new URL('../../public/sw.js', import.meta.url),
  'utf8',
);
const origin = 'https://tasks.example';
type WorkerEvent = {
  request?: Request;
  waitUntil?: (promise: Promise<unknown>) => void;
  respondWith?: (response: Promise<Response>) => void;
};

/** Executes the shipped worker with isolated browser boundaries and observable cache operations. */
function worker() {
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const cache = {
    addAll: vi.fn<(requests: Request[]) => Promise<void>>(
      async () => undefined,
    ),
    match: vi.fn(async (path: string) =>
      path === '/offline.html'
        ? new Response('Public offline fallback')
        : undefined,
    ),
  };
  const caches = {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => [
      'simple-tasks-public-v0',
      'another-app',
      'simple-tasks-public-v1',
    ]),
    delete: vi.fn<(name: string) => Promise<boolean>>(async () => true),
  };
  const fetch = vi.fn<(request: Request) => Promise<Response>>(
    async () => new Response('Private task data'),
  );
  const claim = vi.fn(async () => undefined);
  const skipWaiting = vi.fn();
  vm.runInNewContext(source, {
    URL,
    Request,
    Response,
    caches,
    fetch,
    self: {
      location: { origin },
      clients: { claim },
      skipWaiting,
      addEventListener: (name: string, handler: (event: WorkerEvent) => void) =>
        handlers.set(name, handler),
    },
  });
  /** Dispatches a document or fetch request; undefined means the browser keeps its normal network path. */
  function request(
    path: string,
    options: { mode?: RequestMode; method?: string; rsc?: boolean } = {},
  ) {
    let response: Promise<Response> | undefined;
    handlers.get('fetch')!({
      request: {
        url: new URL(path, origin).href,
        mode: options.mode ?? 'navigate',
        method: options.method ?? 'GET',
        headers: new Headers(options.rsc ? { RSC: '1' } : {}),
      } as Request,
      respondWith: (value) => {
        response = value;
      },
    });
    return response;
  }
  /** Runs an install/activate lifecycle event and waits for its declared asynchronous work. */
  async function lifecycle(name: 'install' | 'activate') {
    let completion: Promise<unknown> | undefined;
    handlers.get(name)!({
      waitUntil: (value) => {
        completion = value;
      },
    });
    await completion;
  }
  return { cache, caches, fetch, claim, skipWaiting, request, lifecycle };
}

describe('private-data-safe PWA worker', () => {
  it('precaches only public fallback assets without credentials', async () => {
    const harness = worker();
    await harness.lifecycle('install');
    const requests = harness.cache.addAll.mock.calls[0][0];
    expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
      '/offline.html',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/icon-maskable-512.png',
      '/icons/apple-touch-icon.png',
    ]);
    expect(requests.every((request) => request.credentials === 'omit')).toBe(
      true,
    );
    expect(harness.skipWaiting).not.toHaveBeenCalled();
  });

  it('returns private documents directly without caching their responses', async () => {
    const harness = worker();
    expect(await (await harness.request('/'))!.text()).toBe(
      'Private task data',
    );
    expect(harness.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ url: `${origin}/` }),
      { cache: 'no-store' },
    );
    expect(harness.cache.match).not.toHaveBeenCalled();
    expect(harness.cache.addAll).not.toHaveBeenCalled();
  });

  it('uses the static fallback only when navigation fails at the network boundary', async () => {
    const harness = worker();
    harness.fetch.mockRejectedValue(new TypeError('Offline'));
    expect(await (await harness.request('/statistics'))!.text()).toBe(
      'Public offline fallback',
    );
    expect(harness.cache.match).toHaveBeenCalledWith('/offline.html');
  });

  it('preserves authentication errors and redirects from the server', async () => {
    const harness = worker();
    for (const response of [
      new Response('Unauthorized', { status: 401 }),
      Response.redirect(`${origin}/login`),
    ]) {
      harness.fetch.mockResolvedValueOnce(response);
      expect(await harness.request('/')).toBe(response);
    }
    expect(harness.cache.match).not.toHaveBeenCalled();
  });

  it('returns a public failure response if offline assets were evicted', async () => {
    const harness = worker();
    harness.fetch.mockRejectedValue(new TypeError('Offline'));
    harness.cache.match.mockResolvedValue(undefined);
    const response = await harness.request('/statistics');
    expect(response!.status).toBe(503);
    expect(response!.headers.get('Content-Type')).toBe(
      'text/plain; charset=utf-8',
    );
    expect(await response!.text()).toBe('Offline');
  });

  it('leaves API, RSC, mutations and external origins on the normal network path', () => {
    const harness = worker();
    expect(harness.request('/api/workspace')).toBeUndefined();
    expect(harness.request('/api/v1/tasks', { mode: 'cors' })).toBeUndefined();
    expect(harness.request('/statistics', { rsc: true })).toBeUndefined();
    expect(harness.request('/', { method: 'POST' })).toBeUndefined();
    expect(harness.request('https://other.example/')).toBeUndefined();
    expect(harness.fetch).not.toHaveBeenCalled();
    expect(harness.caches.open).not.toHaveBeenCalled();
  });

  it('cleans only obsolete app caches and never forces an active page to update', async () => {
    const harness = worker();
    await harness.lifecycle('activate');
    expect(harness.caches.delete).toHaveBeenCalledExactlyOnceWith(
      'simple-tasks-public-v0',
    );
    expect(harness.claim).toHaveBeenCalledOnce();
    expect(harness.skipWaiting).not.toHaveBeenCalled();
  });
});
