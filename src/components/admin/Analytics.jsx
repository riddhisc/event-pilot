import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const Analytics = ({ data = [] }) => (
  <section className="card">
    <h2>Participation</h2>
    {data.length === 0 ? <p>No participation data yet.</p> : (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="invites" name="Capacity" fill="#4F46E5" />
            <Bar dataKey="attendees" name="Registered" fill="#0EA5E9" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </section>
);

export default Analytics;
