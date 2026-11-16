import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const StaffEngagement = ({ data = [] }) => (
  <section className="card">
    <h2>Engagement by department</h2>
    {data.length === 0 ? <p>No engagement data yet.</p> : (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <XAxis dataKey="date" label={{ value: 'Department', position: 'insideBottom', offset: -4 }} />
          <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(value) => `${value}%`} label={{ value: 'Percent', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => [`${value}%`, 'Engagement']} />
          <Line type="monotone" dataKey="engagementScore" stroke="#10B981" />
        </LineChart>
      </ResponsiveContainer>
    )}
  </section>
);

export default StaffEngagement;
