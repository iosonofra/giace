export const APP_TAB_PATHS = Object.freeze({
  dashboard: '/dashboard',
  stock: '/stock',
  orders: '/orders',
  picking: '/picking',
  anomalies: '/anomalies',
  associations: '/associations',
  settings: '/settings',
});

const PATH_TABS = Object.freeze(
  Object.fromEntries(Object.entries(APP_TAB_PATHS).map(([tab, path]) => [path, tab])),
);

function normalizePathname(pathname = '/') {
  if (!pathname || pathname === '/') return '/';
  return `/${pathname.split('/').filter(Boolean).join('/')}`;
}

export function readAppTab(location = window.location) {
  const searchParams = new URLSearchParams(location.search || '');
  if (searchParams.has('settings')) return 'settings';

  const pathname = normalizePathname(location.pathname);
  return PATH_TABS[pathname] || 'stock';
}

export function createAppTabUrl(tab, location = window.location) {
  const pathname = APP_TAB_PATHS[tab];
  if (!pathname) return null;

  const url = new URL(location.href);
  url.pathname = pathname;
  if (tab !== 'settings') url.searchParams.delete('settings');
  return `${url.pathname}${url.search}${url.hash}`;
}
