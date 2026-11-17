import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import QRCodeGenerator from '../../components/common/QRCodeGenerator';
import { Avatar, EmptyState, PageHeader, Skeleton } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { connectWith, fetchNetworkingSuggestions } from '../../services/eventService';
import { filterAndRankSuggestions } from '../../utils/suggestions';
import { useSearchParams } from 'react-router-dom';

const Networking = () => {
  const { currentUser } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const suggestions = useQuery({ queryKey: ['networking'], queryFn: fetchNetworkingSuggestions });
  const [query, setQuery] = useState(params.get('q') || '');
  const [department, setDepartment] = useState(params.get('department') || '');
  const [interest, setInterest] = useState(params.get('interest') || '');
  const [sameEvent, setSameEvent] = useState(params.get('sameEvent') === '1');
  const [sort, setSort] = useState(params.get('sort') || 'score');
  const [busy, setBusy] = useState('');
  const rows = useMemo(() => suggestions.data || [], [suggestions.data]);
  const departments = useMemo(() => [...new Set(rows.map((row) => row.department).filter(Boolean))], [rows]);
  const interests = useMemo(() => [...new Set(rows.flatMap((row) => row.commonInterests || []))], [rows]);
  const visible = useMemo(() => filterAndRankSuggestions(rows, { query, department, interests: interest ? [interest] : [], attendedSameEvent: sameEvent, sort }), [rows, query, department, interest, sameEvent, sort]);
  const update = (key, value) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next); };

  const connect = async (person) => {
    setBusy(person.id);
    try {
      const result = await connectWith(person.id);
      await queryClient.invalidateQueries({ queryKey: ['networking'] });
      push({ title: result.status === 'connected' ? `Connected with ${person.name}` : `Request sent to ${person.name}` });
    } finally {
      setBusy('');
    }
  };

  return (
    <AppLayout role="staff">
      <PageHeader
        title="Networking"
      />
      <section className="networking-hero">
        <div className="networking-intro">
          <p className="eyebrow">Build your circle</p>
          <h2>Meet people who share your interests.</h2>
          <p>Discover colleagues across your workspace, compare shared interests, and start a conversation.</p>
        </div>
        {currentUser && (
          <div className="networking-qr-card">
            <div>
              <p className="eyebrow">Share your profile</p>
              <h3>Connect in person</h3>
              <p className="muted">Let someone scan your QR code to exchange contact details.</p>
            </div>
            <QRCodeGenerator data={currentUser} label="My QR code" />
          </div>
        )}
      </section>
      <section className="networking-panel" aria-label="Find connections">
        <div className="networking-panel-header">
          <div><h2>Find connections</h2><p className="muted">Filter suggestions by team, interests, or shared events.</p></div>
          <span className="badge">{visible.length} {visible.length === 1 ? 'match' : 'matches'}</span>
        </div>
        <div className="table-toolbar networking-filters">
          <input aria-label="Search people" placeholder="Search by name or role" value={query} onChange={(event) => { setQuery(event.target.value); update('q', event.target.value); }} />
          <select aria-label="Department" value={department} onChange={(event) => { setDepartment(event.target.value); update('department', event.target.value); }}>
            <option value="">All departments</option>
            {departments.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Shared interest" value={interest} onChange={(event) => { setInterest(event.target.value); update('interest', event.target.value); }}>
            <option value="">All interests</option>
            {interests.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Sort" value={sort} onChange={(event) => { setSort(event.target.value); update('sort', event.target.value); }}><option value="score">Best match</option><option value="name">Name</option></select>
          <label className="chip"><input type="checkbox" checked={sameEvent} onChange={(event) => { setSameEvent(event.target.checked); update('sameEvent', event.target.checked ? '1' : ''); }} /> Attended same event</label>
          {(query || department || interest || sameEvent) && <button type="button" className="btn btn-ghost" onClick={() => { setQuery(''); setDepartment(''); setInterest(''); setSameEvent(false); setParams({}); }}>Clear filters</button>}
        </div>
      </section>
      {suggestions.isLoading ? <Skeleton /> : visible.length === 0 ? <EmptyState title="No suggestions match" /> : (
        <div className="networking-results">
          {visible.map((person) => (
            <article key={person.id} className="card networking-person-card">
              <div className="networking-person-heading"><Avatar name={person.name} /><div><h2>{person.name}</h2><p>{person.title}</p></div><span className="match-score">{person.score}%</span></div>
              <p className="muted">{person.department}</p>
              <div className="chip-row">
                {(person.reasons || []).map((reason) => <span key={reason} className="chip">{reason}</span>)}
              </div>
              <button type="button" className="btn networking-connect" disabled={busy === person.id || person.connection === 'connected'} onClick={() => connect(person)}>
                {busy === person.id ? 'Sending...' : person.connection === 'connected' ? 'Connected' : person.connection === 'requested' ? 'Requested' : 'Connect'}
              </button>
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Networking;
