function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, locale) {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(value, locale) {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatRelative(value, now = new Date(), locale) {
  const date = toDate(value);
  if (!date) return '';
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const units = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];
  const match = units.find(([, size]) => abs >= size);
  const [unit, size] = match || ['second', 1];
  return formatter.format(Math.round(seconds / size), unit);
}

export const isUpcoming = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  return date > today;
};

export const isPast = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  return date < today;
};

export const daysUntil = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const eventDate = new Date(dateString);
  eventDate.setHours(0, 0, 0, 0);
  
  const differenceInTime = eventDate.getTime() - today.getTime();
  return Math.ceil(differenceInTime / (1000 * 3600 * 24));
};

export const getMonthName = (date) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return months[date.getMonth()];
};