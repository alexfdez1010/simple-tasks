import { handleApiRequest } from '@/lib/api/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Delegates a versioned REST request after resolving Next.js asynchronous route parameters. */
async function dispatch(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return handleApiRequest(request, `/${path.join('/')}`);
}

export {
  dispatch as GET,
  dispatch as POST,
  dispatch as PATCH,
  dispatch as PUT,
  dispatch as DELETE,
  dispatch as HEAD,
  dispatch as OPTIONS,
};
