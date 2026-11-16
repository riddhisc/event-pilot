const NetworkingMatch = ({ suggestion, onConnect, connected }) => (
  <article className={`networking-match ${connected ? 'selected' : ''}`}>
    <h3>{suggestion.name}</h3>
    <p>{suggestion.title}</p>
    <p>{suggestion.department}</p>
    <p>Shared interests: {(suggestion.commonInterests || []).join(', ') || 'None yet'}</p>
    <p>Shared events: {(suggestion.commonEvents || []).join(', ') || 'None yet'}</p>
    <button type="button" className="btn" onClick={onConnect} disabled={connected}>
      {connected ? 'Connected' : 'Connect'}
    </button>
  </article>
);

export default NetworkingMatch;
