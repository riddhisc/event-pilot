import { useEffect } from 'react';
import {
  BarChart3, CalendarDays, Headset, LayoutDashboard, Plug, Settings, Users, Workflow,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '../../stores/uiStore';

const ICONS = {
  dashboard: LayoutDashboard,
  events: CalendarDays,
  staff: Users,
  reports: BarChart3,
  clients: Users,
  onboarding: Workflow,
  integrations: Plug,
  config: Settings,
  support: Headset,
  adoption: BarChart3,
  mine: CalendarDays,
  networking: Users,
};

const LINKS = {
  admin: [
    { to: '/admin/dashboard', text: 'Dashboard', icon: 'dashboard' },
    { to: '/admin/events', text: 'Events', icon: 'events' },
    { to: '/admin/staff', text: 'Staff', icon: 'staff' },
    { to: '/admin/reports', text: 'Reports', icon: 'reports' },
  ],
  staff: [
    { to: '/staff/dashboard', text: 'Dashboard', icon: 'dashboard' },
    { to: '/staff/my-events', text: 'My events', icon: 'mine' },
    { to: '/staff/networking', text: 'Networking', icon: 'networking' },
  ],
  fde: [
    { to: '/fde', text: 'Clients', icon: 'clients' },
    { to: '/fde/onboarding', text: 'Onboarding', icon: 'onboarding' },
    { to: '/fde/integrations', text: 'Integrations', icon: 'integrations' },
    { to: '/fde/config', text: 'Config', icon: 'config' },
    { to: '/fde/support', text: 'Support', icon: 'support' },
    { to: '/fde/adoption', text: 'Adoption', icon: 'adoption' },
  ],
};

const Sidebar = ({ type = 'staff' }) => {
  const open = useUiStore((state) => state.sidebarOpen);
  const clientId = useUiStore((state) => state.clientId);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  useEffect(() => {
    if (window.innerWidth < 801) setSidebarOpen(false);
  }, [setSidebarOpen]);
  const links = (LINKS[type] || LINKS.staff).map((link) => (
    link.to === '/fde/onboarding' ? { ...link, to: `/fde/onboarding/${clientId}` } : link
  ));

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <nav className="sidebar-nav" aria-label={`${type} navigation`}>
        <ul>
          {links.map((link) => {
            const Icon = ICONS[link.icon] || LayoutDashboard;
            return (
              <li key={link.text}>
                <NavLink
                  to={link.to}
                  end={link.to === '/fde'}
                  className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
                  onClick={() => {
                    if (window.innerWidth < 801) setSidebarOpen(false);
                  }}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span className="link-label">{link.text}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
