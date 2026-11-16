import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { useAuth } from '../../hooks/useAuth';
import { CHART_COLORS } from '../../lib/charts';
import { fetchAnalytics, fetchEvents } from '../../services/eventService';
import { pluralize } from '../../utils/formatters';
import { EmptyState, PageHeader, Skeleton, Tabs } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';

const RANGES = [
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
  { id: '365', label: 'Last 12 months' },
];

const Reports = () => {
  const [range, setRange] = useState('90');
  const { push } = useToast();
  const { currentUser } = useAuth();
  const analytics = useQuery({ queryKey: ['analytics', range, currentUser?.tenant_id], queryFn: () => fetchAnalytics(range) });
  const events = useQuery({ queryKey: ['events', currentUser?.tenant_id], queryFn: () => fetchEvents(currentUser?.tenant_id), enabled: Boolean(currentUser?.tenant_id) });
  const data = analytics.data;
  const attendance = (events.data || []).map((event) => ({
    id: event.id,
    title: event.title,
    registered: event.registered_count || 0,
    capacity: event.capacity || 0,
    noShows: Math.max(0, (event.registered_count || 0) - Math.round((event.registered_count || 0) * ((data?.avgParticipation || 0) / 100))),
  }));

  const exportCsv = () => {
    const lines = ['title,registered,capacity,no_shows', ...attendance.map((row) => `${row.title},${row.registered},${row.capacity},${row.noShows}`)];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eventbuddy-reports.csv';
    link.click();
    URL.revokeObjectURL(url);
    push({ title: 'CSV exported' });
  };

  return (
    <AppLayout role="admin">
      <PageHeader title="Reports" actions={<><Tabs tabs={RANGES} value={range} onChange={setRange} label="Date range" /><button type="button" className="btn" onClick={exportCsv}>Export CSV</button></>} />
      {analytics.isLoading ? <Skeleton /> : (
        <div className="section-gap">
          <p>{pluralize(data?.pastEvents || 0, 'completed event')} in this range.</p>
          <section className="card">
            <h2>Attendance and no-shows</h2>
            {attendance.length === 0 ? <EmptyState title="No events to report" /> : (
              <table className="data-table">
                <thead><tr><th>Event</th><th>Registered</th><th>Capacity</th><th>No-shows</th></tr></thead>
                <tbody>
                  {attendance.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Event">{row.title}</td>
                      <td data-label="Registered">{row.registered}</td>
                      <td data-label="Capacity">{row.capacity}</td>
                      <td data-label="No-shows">{row.noShows}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <section className="card">
            <h2>Average rating</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.feedbackData || []}>
                <XAxis dataKey="eventTitle" />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                <Tooltip />
                <Bar dataKey="avgRating" name="Average rating" fill={CHART_COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="chart-note">{(data?.feedbackData || []).map((row) => `${row.eventTitle} ${row.avgRating}`).join(', ') || 'No ratings yet.'}</p>
          </section>
          <section className="card">
            <h2>Participation trend</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data?.participationData || []}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="attendees" name="Registered" stroke={CHART_COLORS[0]} />
                <Line dataKey="invites" name="Capacity" stroke={CHART_COLORS[4]} />
              </LineChart>
            </ResponsiveContainer>
          </section>
          <section className="card">
            <h2>Engagement by department</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.engagementData || []}>
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} label={{ value: 'Percent', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Engagement']} />
                <Bar dataKey="engagementScore" name="Engagement" fill={CHART_COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}
    </AppLayout>
  );
};

export default Reports;
