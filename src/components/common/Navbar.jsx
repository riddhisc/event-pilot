import { useEffect, useRef, useState } from 'react';
import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { homeFor } from '../../lib/roles';
import { fetchTenants } from '../../services/platformService';
import { useUiStore } from '../../stores/uiStore';
import RelativeTime from './RelativeTime';
import { Avatar, IconButton } from '../ui/kit';

function remaining(expires) {
  const diff = Math.max(0, new Date(expires).getTime() - Date.now());
  const minutes = String(Math.floor(diff / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

const Navbar = () => {
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const menuRef = useRef(null);
  const [tick, setTick] = useState(0);
  const { currentUser, logout, impersonation, stopImpersonation } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const clientId = useUiStore((state) => state.clientId);
  const setClientId = useUiStore((state) => state.setClientId);
  const tenants = useQuery({ queryKey: ['tenants'], queryFn: fetchTenants, enabled: currentUser?.role === 'fde' || Boolean(currentUser?.tenant_id) });
  const company = (tenants.data || []).find((tenant) => tenant.id === currentUser?.tenant_id);
  const impersonatedTenant = (tenants.data || []).find((tenant) => tenant.id === currentUser?.tenant_id);

  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setMenu(false);
    };
    const onPointer = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenu(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menu]);

  useEffect(() => {
    if (!impersonation?.expires_at) return undefined;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [impersonation]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header>
      {impersonation && (
        <div className="impersonation-banner" role="status">
          <span>Impersonating {impersonation.name} as {impersonatedTenant?.name || 'client'} · expires in {remaining(impersonation.expires_at)} · <button type="button" className="btn btn-ghost" onClick={stopImpersonation}>End session</button></span>
          <span className="sr-only">{tick}</span>
        </div>
      )}
      <nav className="navbar" aria-label="Main">
        <IconButton className="nav-toggle" label="Open navigation" onClick={toggleSidebar}><Menu size={18} /></IconButton>
        <Link to={homeFor(currentUser)} className="navbar-logo">
          <img src="/logo.svg" alt="" width="32" height="32" />
          <span>EventBuddy</span>
        </Link>
        {currentUser?.role === 'fde' ? (
          <label className="client-switcher">
            <span className="sr-only">Client</span>
            <select aria-label="Client" value={clientId} onChange={(event) => setClientId(event.target.value)}>
              {(tenants.data || []).map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
            </select>
          </label>
        ) : <strong>{company?.name || ''}</strong>}
        {currentUser && (
          <div className="navbar-actions">
            <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
            <div className="bell-wrap">
              <IconButton label={`Notifications, ${unreadCount} unread`} onClick={() => setBell((open) => !open)}>
                <Bell size={18} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </IconButton>
              {bell && (
                <div className="popover">
                  <strong>Notifications</strong>
                  {notifications.length === 0 ? <p>No notifications.</p> : notifications.slice(0, 5).map((item) => (
                    <div key={item.id}>
                      <p>{item.message}</p>
                      <RelativeTime value={item.createdAt} />
                      {!item.read && <button type="button" className="btn btn-ghost" onClick={() => markAsRead(item.id)}>Mark read</button>}
                    </div>
                  ))}
                  <Link to="/notifications" onClick={() => setBell(false)}>View all</Link>
                </div>
              )}
            </div>
            <div className="user-profile" ref={menuRef}>
              <button type="button" className="profile-button" aria-expanded={menu} aria-haspopup="menu" onClick={() => setMenu((open) => !open)}>
                <Avatar name={currentUser.name || currentUser.email} />
                <span className="profile-name">{currentUser.name || 'Account'}</span>
              </button>
              {menu && (
                <div className="account-menu" role="menu">
                  <Link role="menuitem" to="/profile" onClick={() => setMenu(false)}>Profile</Link>
                  <button type="button" role="menuitem" onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMenu(false); }}>Switch theme</button>
                  <button type="button" role="menuitem" onClick={handleLogout}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
