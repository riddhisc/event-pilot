import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { loadMessages, sendChatMessage, subscribeToChat } from '../../services/chatService';
import RelativeTime from '../common/RelativeTime';

const LiveChat = ({ eventId }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    let stop = () => {};
    loadMessages(eventId).then((rows) => {
      setMessages(rows);
      setConnected(true);
    }).catch((err) => {
      setConnected(false);
      setError(err.message);
    });
    stop = subscribeToChat(eventId, (message) => {
      setConnected(true);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    });
    return () => stop?.();
  }, [eventId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  const send = async (event) => {
    event.preventDefault();
    if (!text.trim() || !connected) return;
    const message = { eventId, senderId: currentUser?.id, senderName: currentUser?.name || 'You', tenantId: currentUser?.tenant_id, text: text.trim() };
    setText('');
    const saved = await sendChatMessage(message);
    setMessages((current) => current.some((item) => item.id === saved.id) ? current : [...current, saved]);
  };

  return (
    <section className="card" aria-label="Live chat">
      <h2>Live chat</h2>
      <p className="muted">{connected ? 'Connected' : 'Disconnected'}</p>
      {error && <p className="error-message" role="alert">{error}</p>}
      <div aria-live="polite">
        {messages.length === 0 && <p>No messages yet.</p>}
        {messages.map((message) => (
          <article key={message.id}>
            <strong>{message.senderName}</strong>
            <p>{message.text}</p>
            <RelativeTime value={message.timestamp} />
          </article>
        ))}
        <div ref={endRef} />
      </div>
      <form className="form-actions" onSubmit={send}>
        <label className="sr-only" htmlFor="chat-message">Message</label>
        <input id="chat-message" value={text} disabled={!connected} onChange={(event) => setText(event.target.value)} placeholder={connected ? 'Type a message' : 'Chat is disconnected'} />
        <button className="btn" type="submit" disabled={!connected || !text.trim()}>Send</button>
      </form>
    </section>
  );
};

export default LiveChat;
