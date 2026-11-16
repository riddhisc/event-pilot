export function filterAndRankSuggestions(rows = [], { query = '', department = '', interests = [], attendedSameEvent = false, sort = 'score' } = {}) {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => {
    const haystack = `${row.name || ''} ${row.title || ''} ${row.department || ''}`.toLowerCase();
    return (!needle || haystack.includes(needle)) && (!department || row.department === department) && (!interests.length || interests.every((interest) => (row.commonInterests || []).includes(interest))) && (!attendedSameEvent || row.attendedSameEvent);
  }).sort((a, b) => sort === 'name' ? String(a.name).localeCompare(String(b.name)) : (b.score || 0) - (a.score || 0));
}
