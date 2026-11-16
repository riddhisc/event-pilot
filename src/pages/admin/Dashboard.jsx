import { CalendarDays, TrendingUp, UserRound, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { CHART_COLORS } from '../../lib/charts';
import { fetchActivity, fetchAnalytics, fetchAttention } from '../../services/eventService';
import { pluralize } from '../../utils/formatters';
import RelativeTime from '../../components/common/RelativeTime';
import { EmptyState, PageHeader, Skeleton, StatCard, Tabs } from '../../components/ui/kit';
import { useState } from 'react';

const RANGES = [
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
  { id: '365', label: 'Last 12 months' },
];

const AdminDashboard = () => {
  const [range, setRange] = useState('90');
  const analytics = useQuery({ queryKey: ['analytics', range], queryFn: () => fetchAnalytics(range) });
  const attention = useQuery({ queryKey: ['attention'], queryFn: fetchAttention });
  const activity = useQuery({ queryKey: ['activity'], queryFn: fetchActivity });
  const data = analytics.data;

  return (
    <AppLayout role="admin">
      <PageHeader title="Dashboard" actions={<Tabs tabs={RANGES} value={range} onChange={setRange} label="Date range" />} />
      {analytics.isLoading ? <Skeleton /> : analytics.error ? <EmptyState title="Could not load the dashboard" action={<button type="button" className="btn" onClick={() => analytics.refetch()}>Retry</button>} /> : (
        <div className="section-gap">
          <div className="stat-grid">
            <StatCard icon={<CalendarDays size={18} />} label="Total events" value={data.totalEvents} trend={pluralize(data.totalEvents, 'event')} />
            <StatCard icon={<TrendingUp size={18} />} label="Upcoming" value={data.upcomingEvents} trend={pluralize(data.upcomingEvents, 'event')} />
            <StatCard icon={<Users size={18} />} label="Total staff" value={data.totalStaff} trend={pluralize(data.totalStaff, 'person', 'people')} />
            <StatCard icon={<UserRound size={18} />} label="Avg participation" value={`${data.avgParticipation}%`} trend="Registered vs capacity" />
          </div>
          <section className="card">
            <h2>Participation</h2>
            <p className="chart-note">Registered versus capacity by month.</p>
            {(data.participationData || []).length === 0 ? <EmptyState title="No participation in this range" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.participationData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="invites" name="Capacity" fill={CHART_COLORS[0]} />
                  <Bar dataKey="attendees" name="Registered" fill={CHART_COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>
          <section className="card">
            <h2>Engagement by department</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...(data.engagementData || [])].sort((a, b) => b.engagementScore - a.engagementScore)} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} label={{ value: 'Percent', position: 'insideBottom', offset: -2 }} />
                <YAxis type="category" dataKey="date" width={110} />
                <Tooltip formatter={(value) => [`${value}%`, 'Engagement']} />
                <Bar dataKey="engagementScore" name="Engagement" fill={CHART_COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
          <section className="card">
            <h2>Feedback</h2>
            {(data.feedbackData || []).length === 0 ? <EmptyState title="No feedback in this range" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.feedbackData}>
                  <XAxis dataKey="eventTitle" />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} label={{ value: 'Rating', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value, name, item) => [`${value} · ${item.payload.responseCount} responses`, 'Average']} />
                  <Bar dataKey="avgRating" name="Average rating" fill={CHART_COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <p className="chart-note">{(data.feedbackData || []).map((row) => `${row.eventTitle}: ${row.avgRating} from ${row.responseCount}`).join('. ')}</p>
          </section>
          <section className="card">
            <h2>Needs attention</h2>
            {(attention.data || []).length === 0 ? <EmptyState title="Nothing needs attention" /> : (attention.data || []).map((event) => (
              <p key={event.id}>{event.title} · {event.registered_count}/{event.capacity}</p>
            ))}
          </section>
          <section className="card">
            <h2>Recent RSVP activity</h2>
            {(activity.data || []).length === 0 ? <EmptyState title="No RSVPs yet" /> : (activity.data || []).slice(0, 6).map((row) => (
              <p key={row.id}>{row.name} · {row.status} · {row.eventTitle} · <RelativeTime value={row.at} /></p>
            ))}
          </section>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminDashboard;
