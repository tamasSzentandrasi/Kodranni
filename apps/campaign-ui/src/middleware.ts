import { defineMiddleware } from 'astro:middleware';
import { withArchiveScope } from './data/load';
import { isDeskPath, isLocalDeskRequest } from './lib/loopback';

export const onRequest = defineMiddleware((context, next) => {
  const archive = context.request.headers.get('x-kodranni-archive') === '1';
  const path = new URL(context.request.url).pathname;
  if (isDeskPath(path) && !isLocalDeskRequest(context.request)) {
    return new Response('Not found', { status: 404 });
  }
  if (archive && path.startsWith('/api/') && !path.startsWith('/api/snapshot')) {
    return new Response(JSON.stringify({ error: 'Archive is read-only' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (archive) return withArchiveScope(() => next());
  return next();
});
