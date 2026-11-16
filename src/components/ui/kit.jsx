import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button type="button" className={`icon-button ${className}`} aria-label={label} {...props}>
      {children}
    </button>
  );
}

export function PageHeader({ title, eyebrow, actions, crumbs = [] }) {
  useEffect(() => {
    document.title = title ? `${title} · EventBuddy` : 'EventBuddy';
  }, [title]);

  return (
    <header className="page-header">
      <div>
        {crumbs.length > 0 && (
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={crumb.label}>
                {index > 0 && <span aria-hidden="true"> / </span>}
                {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      {actions && <div className="form-actions">{actions}</div>}
    </header>
  );
}

export function StatCard({ icon, label, value, trend }) {
  return (
    <article className="stat-card">
      <div className="stat-icon" aria-hidden="true">{icon}</div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {trend && <p className="stat-trend">{trend}</p>}
    </article>
  );
}

const BADGE_TONE = {
  published: 'info',
  draft: 'neutral',
  cancelled: 'danger',
  completed: 'success',
  going: 'success',
  maybe: 'warning',
  declined: 'danger',
  active: 'success',
  invited: 'info',
  disabled: 'neutral',
  error: 'danger',
  pending: 'warning',
  success: 'success',
  team: 'info',
  enterprise: 'neutral',
  admin: 'info',
  staff: 'neutral',
};

export function Badge({ children, tone, status }) {
  const resolved = tone || BADGE_TONE[String(status || children || '').toLowerCase()] || 'neutral';
  return <span className={`badge badge-${resolved}`}>{children}</span>;
}

export function Avatar({ name = '', src }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  if (src) return <img className="avatar" src={src} alt="" />;
  return <span className="avatar" aria-hidden="true">{initials || '?'}</span>;
}

export function Progress({ value = 0, max = 100, label }) {
  const percent = max ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'Progress'}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ rows = 4 }) {
  return (
    <div className="skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }, (_, index) => <div key={index} className="skeleton-line" />)}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label = 'Sections' }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={value === tab.id ? 'tab active' : 'tab'}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Tooltip({ label, children }) {
  return (
    <span className="tooltip">
      {children}
      <span className="tooltip-bubble" role="tooltip">{label}</span>
    </span>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const node = ref.current;
    const focusable = () => [...node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
    focusable()[0]?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={ref}
        className={`modal ${wide ? 'wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel = 'Confirm', tone = 'primary', busy, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p>{body}</p>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className={tone === 'danger' ? 'btn btn-danger' : 'btn'} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function DataTable({ columns, rows, searchKeys = [], filters = [], pageSize = 6, empty = 'Nothing to show.', rowActions }) {
  const [query, setQuery] = useState('');
  const [filterState, setFilterState] = useState({});
  const [sort, setSort] = useState({ key: '', direction: 'asc' });
  const [page, setPage] = useState(0);
  const [menu, setMenu] = useState(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery = !needle || searchKeys.some((key) => String(row[key] || '').toLowerCase().includes(needle));
      const matchesFilters = filters.every((filter) => !filterState[filter.key] || String(row[filter.key]) === filterState[filter.key]);
      return matchesQuery && matchesFilters;
    });
  }, [rows, query, searchKeys, filters, filterState]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const column = columns.find((item) => item.key === sort.key);
    const copy = [...filtered];
    copy.sort((a, b) => {
      const left = column?.sortValue ? column.sortValue(a) : a[sort.key];
      const right = column?.sortValue ? column.sortValue(b) : b[sort.key];
      return String(left).localeCompare(String(right), undefined, { numeric: true }) * (sort.direction === 'asc' ? 1 : -1);
    });
    return copy;
  }, [filtered, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const visible = sorted.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="data-table-wrap">
      <div className="table-toolbar">
        {searchKeys.length > 0 && (
          <input aria-label="Search" placeholder="Search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} />
        )}
        {filters.map((filter) => (
          <select key={filter.key} aria-label={filter.label} value={filterState[filter.key] || ''} onChange={(event) => { setFilterState({ ...filterState, [filter.key]: event.target.value }); setPage(0); }}>
            <option value="">{filter.label}</option>
            {filter.options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ))}
      </div>
      {visible.length === 0 ? <EmptyState title={empty} /> : (
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  <button type="button" className="sort-button" onClick={() => setSort({ key: column.key, direction: sort.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc' })}>
                    {column.header}
                  </button>
                </th>
              ))}
              {rowActions && <th><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} onClick={row.onOpen} className={row.onOpen ? 'clickable' : ''}>
                {columns.map((column) => (
                  <td key={column.key} data-label={column.header}>{column.render ? column.render(row) : row[column.key]}</td>
                ))}
                {rowActions && (
                  <td data-label="Actions">
                    <button type="button" className="btn btn-ghost" aria-label={`Actions for ${row.name || row.title || 'row'}`} onClick={(event) => { event.stopPropagation(); setMenu(menu === row.id ? null : row.id); }}>…</button>
                    {menu === row.id && (
                      <div className="row-menu" role="menu">
                        {rowActions(row).map((action) => (
                          <button key={action.label} type="button" role="menuitem" className={action.danger ? 'danger' : ''} onClick={(event) => { event.stopPropagation(); setMenu(null); action.onClick(); }}>
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {sorted.length > pageSize && (
        <div className="pager">
          <button type="button" className="btn btn-ghost" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Previous</button>
          <span>{page + 1} / {pages}</span>
          <button type="button" className="btn btn-ghost" disabled={page + 1 >= pages} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
