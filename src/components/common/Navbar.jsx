import { useEffect, useRef, useState } from 'react';
import { Bell, Check, Menu, Moon, Sun } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { homeFor } from '../../lib/roles';
import { fetchTenants } from '../../services/platformService';
import ClientSwitcher from './ClientSwitcher';
import { useUiStore } from '../../stores/uiStore';
import RelativeTime from './RelativeTime';
import { Avatar, EmptyState, IconButton } from '../ui/kit';
import { useToast } from '../ui/Toast';

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
  const bellRef = useRef(null);
  const bellTriggerRef = useRef(null);
  const [tick, setTick] = useState(0);
  const { currentUser, logout, impersonation, stopImpersonation } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { push } = useToast();
  const navigate = useNavigate();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
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
    if (!bell) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') { setBell(false); bellTriggerRef.current?.focus(); return; }
      if (event.key !== 'Tab' || !bellRef.current) return;
      const items = [...bellRef.current.querySelectorAll('button, a')];
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    const onPointer = (event) => { if (!bellRef.current?.contains(event.target)) { setBell(false); bellTriggerRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    bellRef.current?.querySelector('button, a')?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer); };
  }, [bell]);

  useEffect(() => {
    if (!impersonation?.expires_at) return undefined;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [impersonation]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    push({ title: 'Notifications marked as read' });
  };

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    push({ title: 'Notification marked as read' });
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
        {currentUser?.role === 'fde' ? <ClientSwitcher /> : <strong>{company?.name || ''}</strong>}
        {currentUser && (
          <div className="navbar-actions">
            <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
            <div className="bell-wrap">
              <IconButton ref={bellTriggerRef} label={`Notifications, ${unreadCount} unread`} aria-expanded={bell} aria-haspopup="dialog" onClick={() => setBell((open) => !open)}>
                <Bell size={18} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </IconButton>
              {bell && (
                <div className="popover notification-popover" ref={bellRef} role="dialog" aria-label="Notifications">
                  <div className="notification-header"><strong>Notifications</strong><button type="button" className="btn btn-ghost" onClick={handleMarkAllRead}>Mark all read</button></div>
                  {notifications.length === 0 ? <EmptyState title="No notifications" /> : notifications.slice(0, 8).map((item) => (
                    <div className={`notification-item ${item.read ? '' : 'unread'}`} key={item.id}>
                      <span className="notification-icon" aria-hidden="true">{item.type === 'error' ? '!' : '•'}</span>
                      <div><p>{item.message}</p><RelativeTime value={item.createdAt} /></div>
                      {!item.read && <IconButton className="small" label={`Mark notification read: ${item.message}`} onClick={() => handleMarkRead(item.id)}><Check size={14} /></IconButton>}
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
