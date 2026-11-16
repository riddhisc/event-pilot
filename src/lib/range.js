export function rangeStart(range, now = new Date()) {
  const days = range === '30' ? 30 : range === '365' ? 365 : 90;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return start;
}

export function inDashboardRange(iso, range, now = new Date()) {
  if (!iso) return false;
  const when = new Date(iso);
  const start = rangeStart(range, now);
  const end = new Date(now);
  const days = range === '30' ? 30 : range === '365' ? 365 : 90;
  end.setDate(end.getDate() + days);
  return when >= start && when <= end;
}
