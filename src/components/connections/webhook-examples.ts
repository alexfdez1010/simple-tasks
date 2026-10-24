/** Illustrative contract examples, never real task data or credentials. */
export const webhookPayloadExample = JSON.stringify(
  {
    schemaVersion: 1,
    id: '00000000-0000-4000-8000-000000000001',
    type: 'task.moved',
    occurredAt: '2026-10-24T10:00:00.000Z',
    data: {
      task: {
        id: 'example-task',
        title: 'Review the mobile flow',
        description: 'Check the task drawer.',
        dueDate: null,
        statusId: 'in-progress',
        position: 0,
        completedAt: null,
        createdAt: '2026-10-24T09:00:00.000Z',
        updatedAt: '2026-10-24T10:00:00.000Z',
        status: { id: 'in-progress', name: 'In progress', isTerminal: false },
        propertyValues: [
          {
            propertyId: 'example-owner',
            name: 'Responsable',
            type: 'SELECT',
            value: 'Codex',
          },
        ],
      },
      previousStatusId: 'todo',
    },
  },
  null,
  2,
);

export const webhookVerificationExample = `import { createHmac, timingSafeEqual } from 'node:crypto';

// rawBody is the original UTF-8 body, before JSON parsing.
// secret is the signing secret shown in Connections.
function verify(rawBody, timestamp, signature, secret) {
  if (!/^\\d+$/.test(timestamp ?? '')) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  if (!/^v1=[a-f0-9]{64}$/.test(signature ?? '')) return false;
  const expected = createHmac('sha256', secret)
    .update(timestamp + '.' + rawBody).digest();
  const received = Buffer.from(signature.slice(3), 'hex');
  return timingSafeEqual(expected, received);
}`;

export const webhookDispatchExample = `curl -X POST 'https://tasks.alejandrofernandezcamello.me/api/webhooks/dispatch' \\
  -H 'Authorization: Bearer YOUR_TOKEN'`;
