import { formatDateTime, formatRelative } from '../../utils/dateUtils';

const RelativeTime = ({ value, fallback = 'never' }) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return (
    <time dateTime={date.toISOString()} title={formatDateTime(value)}>
      {formatRelative(value)}
    </time>
  );
};

export default RelativeTime;
