import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import QRCodeGenerator from '../../components/common/QRCodeGenerator';
import { Avatar, EmptyState, PageHeader, Skeleton } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { connectWith, fetchNetworkingSuggestions } from '../../services/eventService';

const Networking = () => {
  const { currentUser } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const suggestions = useQuery({ queryKey: ['networking'], queryFn: fetchNetworkingSuggestions });
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [interest, setInterest] = useState('');
  const [busy, setBusy] = useState('');
  const rows = useMemo(() => suggestions.data || [], [suggestions.data]);
  const departments = useMemo(() => [...new Set(rows.map((row) => row.department).filter(Boolean))], [rows]);
  const interests = useMemo(() => [...new Set(rows.flatMap((row) => row.commonInterests || []))], [rows]);
  const visible = useMemo(() => rows.filter((row) => {
    const haystack = `${row.name} ${row.title} ${row.department}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (department && row.department !== department) return false;
    if (interest && !(row.commonInterests || []).includes(interest)) return false;
    return true;
  }), [rows, query, department, interest]);

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
        actions={currentUser && <QRCodeGenerator data={currentUser} label="My QR code" />}
      />
      <div className="table-toolbar">
        <input aria-label="Search people" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Department" value={department} onChange={(event) => setDepartment(event.target.value)}>
          <option value="">Department</option>
          {departments.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="Shared interest" value={interest} onChange={(event) => setInterest(event.target.value)}>
          <option value="">Shared interest</option>
          {interests.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {suggestions.isLoading ? <Skeleton /> : visible.length === 0 ? <EmptyState title="No suggestions match" /> : visible.map((person) => (
        <article key={person.id} className="card event-card">
          <h2><Avatar name={person.name} /> {person.name}</h2>
          <p>{person.title} · {person.department}</p>
          <div className="chip-row">
            {(person.reasons || []).map((reason) => <span key={reason} className="chip">{reason}</span>)}
            <span className="chip">Match {person.score}</span>
          </div>
          <button type="button" className="btn" disabled={busy === person.id || person.connection === 'connected'} onClick={() => connect(person)}>
            {busy === person.id ? 'Sending...' : person.connection === 'connected' ? 'Connected' : person.connection === 'requested' ? 'Requested' : 'Connect'}
          </button>
        </article>
      ))}
    </AppLayout>
  );
};

export default Networking;
