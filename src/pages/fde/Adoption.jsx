import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { CHART_COLORS } from '../../lib/charts';
import { fetchScopedAnalytics } from '../../services/eventService';
import { fetchAdoptionTrend, fetchTenants } from '../../services/platformService';
import { EmptyState, PageHeader, Skeleton, StatCard } from '../../components/ui/kit';
import { useUiStore } from '../../stores/uiStore';

const Adoption = () => {
  const clientId = useUiStore((state) => state.clientId);
  const [scope, setScope] = useState('client');
  const tenantId = scope === 'all' ? 'all' : clientId;
  const tenants = useQuery({ queryKey: ['tenants'], queryFn: fetchTenants });
  const analytics = useQuery({ queryKey: ['scoped', tenantId], queryFn: () => fetchScopedAnalytics(tenantId) });
  const trend = useQuery({ queryKey: ['trend', tenantId], queryFn: () => fetchAdoptionTrend(tenantId) });
  const selected = (tenants.data || []).filter((tenant) => scope === 'all' || tenant.id === clientId);
  const chart = selected.map((tenant) => ({ name: tenant.name, adoption: tenant.adoption || 0, health: tenant.health || 0 }));

  return (
    <AppLayout role="fde">
      <PageHeader
        title="Adoption"
        actions={(
          <div className="segmented" role="group" aria-label="Adoption scope">
            <button type="button" aria-pressed={scope === 'client'} onClick={() => setScope('client')}>This client</button>
            <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>All clients</button>
          </div>
        )}
      />
      {analytics.isLoading ? <Skeleton /> : (
        <div className="section-gap">
          <div className="stat-grid">
            <StatCard label="RSVP rate" value={`${analytics.data?.avgParticipation ?? 0}%`} />
            <StatCard label="Events" value={analytics.data?.totalEvents ?? 0} />
            <StatCard label="Upcoming" value={analytics.data?.upcomingEvents ?? 0} />
            <StatCard label="Staff" value={analytics.data?.totalStaff ?? 0} />
          </div>
          <section className="card">
            <h2>Adoption by client</h2>
            {chart.length === 0 ? <EmptyState title="No clients" /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chart}>
                  <XAxis dataKey="name" label={{ value: 'Client', position: 'insideBottom', offset: -2 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} label={{ value: 'Percent', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  <Legend />
                  <Bar dataKey="adoption" name="Adoption" fill={CHART_COLORS[0]} />
                  <Bar dataKey="health" name="Health" fill={CHART_COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <p className="chart-note">{chart.map((row) => `${row.name} adoption ${row.adoption}%`).join('. ')}</p>
          </section>
          <section className="card">
            <h2>DAU, WAU, and RSVP rate</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend.data || []}>
                <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -2 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="dau" name="DAU" stroke={CHART_COLORS[0]} />
                <Line dataKey="wau" name="WAU" stroke={CHART_COLORS[1]} />
                <Line dataKey="rsvp" name="RSVP rate" stroke={CHART_COLORS[3]} />
              </LineChart>
            </ResponsiveContainer>
          </section>
          <section className="card">
            <h2>Department engagement</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.data?.engagementData || []} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="date" width={110} />
                <Tooltip formatter={(value) => [`${value}%`, 'Engagement']} />
                <Bar dataKey="engagementScore" name="Engagement" fill={CHART_COLORS[4]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}
    </AppLayout>
  );
};

export default Adoption;
