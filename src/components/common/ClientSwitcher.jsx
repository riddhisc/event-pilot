import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTenants } from '../../services/platformService';
import { useUiStore } from '../../stores/uiStore';
import { Avatar, Badge } from '../ui/kit';

const ClientSwitcher = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const clientId = useUiStore((state) => state.clientId);
  const setClientId = useUiStore((state) => state.setClientId);
  const tenants = useQuery({ queryKey: ['tenants'], queryFn: fetchTenants });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);
  const selected = (tenants.data || []).find((tenant) => tenant.id === clientId);

  useEffect(() => {
    const slug = new URLSearchParams(location.search).get('client');
    const match = (tenants.data || []).find((tenant) => tenant.slug === slug);
    if (match && match.id !== clientId) setClientId(match.id);
    if (!slug && selected && location.pathname.startsWith('/fde')) {
      const params = new URLSearchParams(location.search);
      params.set('client', selected.slug);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [clientId, location.pathname, location.search, navigate, selected, setClientId, tenants.data]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    searchRef.current?.focus();
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const filtered = useMemo(() => (tenants.data || []).filter((tenant) => (
    !query.trim() || `${tenant.name} ${tenant.slug}`.toLowerCase().includes(query.trim().toLowerCase())
  )), [query, tenants.data]);

  const choose = (tenant) => {
    setClientId(tenant.id);
    const params = new URLSearchParams(location.search);
    params.set('client', tenant.slug);
    navigate(`${location.pathname}?${params.toString()}`);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="client-switcher" ref={ref}>
      <button type="button" className="client-switcher-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Avatar name={selected?.name || 'Client'} />
        <span className="client-switcher-copy"><strong>{selected?.name || 'Select a client'}</strong>{selected && <span><i className="health-dot" aria-hidden="true" /> Health {selected.health}%</span>}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="client-switcher-menu" role="listbox" aria-label="Choose client">
          <div className="client-switcher-search"><Search size={16} aria-hidden="true" /><input ref={searchRef} aria-label="Search clients" placeholder="Search clients" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          {filtered.length === 0 ? <p className="muted">No clients found.</p> : filtered.map((tenant) => (
            <button type="button" role="option" aria-selected={tenant.id === clientId} className="client-option" key={tenant.id} onClick={() => choose(tenant)}>
              <Avatar name={tenant.name} />
              <span className="client-switcher-copy"><strong>{tenant.name}</strong><span><i className="health-dot" aria-hidden="true" /> {tenant.health}% health · <Badge status={tenant.plan}>{tenant.plan}</Badge></span></span>
              {tenant.id === clientId && <Check size={16} aria-label="Selected" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientSwitcher;
