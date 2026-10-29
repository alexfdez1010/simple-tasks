import { describe, expect, it } from 'vitest';
import { readJsonBody, MAX_BODY_BYTES } from '@/lib/api/body';
import { ApiError, apiErrorResponse } from '@/lib/api/errors';
import { taskCreate } from '@/lib/api/schemas';
import { DomainError } from '@/lib/validation/errors';

/** Exercises malformed and oversized bodies before they reach application services. */
describe('REST body boundary', () => {
  it('accepts JSON with a charset and rejects unsupported or malformed payloads', async () => {
    await expect(
      readJsonBody(
        new Request('http://localhost', {
          method: 'POST',
          body: '{"title":"ok"}',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }),
      ),
    ).resolves.toEqual({ title: 'ok' });
    await expect(
      readJsonBody(
        new Request('http://localhost', { method: 'POST', body: '{}' }),
      ),
    ).rejects.toMatchObject({ status: 415 });
    await expect(
      readJsonBody(
        new Request('http://localhost', {
          method: 'POST',
          body: '{',
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
  it('enforces byte limits without trusting Content-Length, including unicode', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ title: 'é'.repeat(MAX_BODY_BYTES) }),
      headers: { 'Content-Type': 'application/json' },
    });
    await expect(readJsonBody(request)).rejects.toMatchObject({ status: 413 });
    await expect(
      readJsonBody(
        new Request('http://localhost', {
          method: 'POST',
          body: '{}',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': String(MAX_BODY_BYTES + 1),
          },
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
  it('accepts absent and empty streamed DELETE bodies only in optional mode', async () => {
    const empty = new Request('http://localhost', {
      method: 'DELETE',
      body: new Blob([]),
    });
    expect(empty.body).not.toBeNull();
    expect(empty.headers.get('Content-Type')).toBeNull();
    await expect(readJsonBody(empty, { allowEmpty: true })).resolves.toEqual(
      {},
    );
    await expect(
      readJsonBody(new Request('http://localhost', { method: 'DELETE' }), {
        allowEmpty: true,
      }),
    ).resolves.toEqual({});
    await expect(
      readJsonBody(
        new Request('http://localhost', {
          method: 'DELETE',
          body: new Blob([]),
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
  it('keeps JSON validation and byte limits for nonempty optional DELETE bodies', async () => {
    for (const [body, headers, status] of [
      ['{}', {}, 415],
      ['{', { 'Content-Type': 'application/json' }, 400],
      [
        'x'.repeat(MAX_BODY_BYTES + 1),
        { 'Content-Type': 'application/json', 'Content-Length': '0' },
        413,
      ],
    ] as const) {
      await expect(
        readJsonBody(
          new Request('http://localhost', { method: 'DELETE', body, headers }),
          { allowEmpty: true },
        ),
      ).rejects.toMatchObject({ status });
    }
    await expect(
      readJsonBody(
        new Request('http://localhost', {
          method: 'DELETE',
          body: '{"destinationProjectId":"target"}',
          headers: { 'Content-Type': 'application/json' },
        }),
        { allowEmpty: true },
      ),
    ).resolves.toEqual({ destinationProjectId: 'target' });
  });
  it('redacts unexpected failures and emits field-level validation errors', async () => {
    const internal = apiErrorResponse(
      new Error('postgres://private-password'),
      'id-1',
    );
    expect(internal.status).toBe(500);
    expect(await internal.text()).not.toContain('private-password');
    const invalid = taskCreate.safeParse({ title: '' });
    const validation = apiErrorResponse(
      invalid.success ? null : invalid.error,
      'id-2',
    );
    expect(validation.status).toBe(422);
    expect(await validation.json()).toMatchObject({
      error: { requestId: 'id-2', details: [{ path: 'title' }] },
    });
    expect(
      apiErrorResponse(new DomainError('missing', 'NOT_FOUND'), 'id').status,
    ).toBe(404);
    expect(
      apiErrorResponse(new ApiError(429, 'RATE_LIMITED', 'Retry later'), 'id')
        .status,
    ).toBe(429);
  });
});
