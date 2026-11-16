const ParticipantList = ({ data = [] }) => (
  <section className="card">
    <h2>Recent staff</h2>
    {data.length === 0 ? <p>No participants yet.</p> : (
      <ul>
        {data.map((participant) => (
          <li key={participant.id}>{participant.name} ({participant.email})</li>
        ))}
      </ul>
    )}
  </section>
);

export default ParticipantList;
