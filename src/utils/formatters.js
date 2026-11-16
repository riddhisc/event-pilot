export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  if (timeString.includes('T') || timeString.endsWith('Z')) {
    const date = new Date(timeString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  if (Number.isNaN(hour)) return timeString;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes || '00'} ${ampm}`;
};

export const formatParticipants = (count, capacity) => {
  if (capacity) return `${count}/${capacity}`;
  return String(count ?? 0);
};

export const formatRSVPStatus = (status) => {
  switch (status) {
    case 'going':
    case 'attending':
      return 'Going';
    case 'maybe':
      return 'Maybe';
    case 'declined':
      return 'Not going';
    case 'waitlist':
      return 'Waitlist';
    default:
      return 'No response';
  }
};

export function pluralize(count, singular, plural) {
  const amount = Number(count) || 0;
  const word = amount === 1 ? singular : (plural || `${singular}s`);
  return `${amount} ${word}`;
}

export const typeLabel = (type) => {
  if (type === 'virtual') return 'Virtual';
  if (type === 'hybrid') return 'Hybrid';
  return 'In person';
};
