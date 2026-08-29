/** Paths the Worker may reverse-proxy to a live origin. Setup/operator stay loopback. */

export function livePathAllowed(method: string, pathname: string): boolean {
  const m = method.toUpperCase();
  const p = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  if (p.startsWith('/internal')) return false;
  if (p === '/operator' || p.startsWith('/operator/')) return false;
  if (p === '/emissary' || p.startsWith('/emissary/')) return false;
  if (p === '/community/setup' || p.startsWith('/community/setup/')) return false;
  if (p.startsWith('/setup')) return false;

  if (p.startsWith('/api/community/')) {
    return (m === 'GET' || m === 'HEAD') && p === '/api/community/rev';
  }

  if (p === '/api/snapshot' || p.startsWith('/api/snapshot/')) return m === 'GET' || m === 'HEAD';
  if (p.startsWith('/api/avatar/')) return m === 'GET' || m === 'HEAD';
  if (p.startsWith('/api/character/')) return m === 'GET' || m === 'HEAD' || m === 'POST';

  if (m !== 'GET' && m !== 'HEAD' && m !== 'POST') return false;

  if (p === '/community' || p.startsWith('/community/')) return m === 'GET' || m === 'HEAD';
  if (p === '/characters' || p.startsWith('/characters/')) return m === 'GET' || m === 'HEAD';
  if (p.startsWith('/design/') || p.startsWith('/brand/') || p.startsWith('/_astro/')) {
    return m === 'GET' || m === 'HEAD';
  }
  if (p === '/hall-client.js' || p.startsWith('/favicon') || p === '/apple-touch-icon.png') {
    return m === 'GET' || m === 'HEAD';
  }
  return false;
}
