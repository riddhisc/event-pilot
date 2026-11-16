import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const FeedbackReport = ({ data = [] }) => (
  <section className="card">
    <h2>Feedback</h2>
    {data.length === 0 ? <p>No feedback yet.</p> : (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <XAxis dataKey="eventTitle" />
          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} label={{ value: 'Rating', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Bar dataKey="avgRating" name="Average rating" fill="#F59E0B" />
        </BarChart>
      </ResponsiveContainer>
    )}
  </section>
);

export default FeedbackReport;
