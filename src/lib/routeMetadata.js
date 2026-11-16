const ROUTE_CRUMBS = [
  { test: /^\/staff\/networking/, crumbs: [{ label: 'Dashboard', to: '/staff/dashboard' }, { label: 'Networking' }] },
  { test: /^\/staff\/my-events/, crumbs: [{ label: 'Dashboard', to: '/staff/dashboard' }, { label: 'My events' }] },
  { test: /^\/fde\/integrations/, crumbs: [{ label: 'Clients', to: '/fde' }, { label: 'Integrations' }] },
  { test: /^\/fde\/config/, crumbs: [{ label: 'Clients', to: '/fde' }, { label: 'Config' }] },
  { test: /^\/fde\/support/, crumbs: [{ label: 'Clients', to: '/fde' }, { label: 'Support' }] },
  { test: /^\/fde\/adoption/, crumbs: [{ label: 'Clients', to: '/fde' }, { label: 'Adoption' }] },
  { test: /^\/fde\/onboarding/, crumbs: [{ label: 'Clients', to: '/fde' }, { label: 'Onboarding' }] },
];

export function getRouteCrumbs(pathname) { return ROUTE_CRUMBS.find((route) => route.test.test(pathname))?.crumbs || []; }
