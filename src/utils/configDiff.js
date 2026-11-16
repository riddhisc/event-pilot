export function diffJson(before, after, path = '') {
  const left = before ?? {};
  const right = after ?? {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  const changes = [];
  keys.forEach((key) => {
    const nextPath = path ? `${path}.${key}` : key;
    const a = left[key]; const b = right[key];
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) changes.push(...diffJson(a, b, nextPath));
    else if (!(key in left)) changes.push({ path: nextPath, type: 'added', before: undefined, after: b });
    else if (!(key in right)) changes.push({ path: nextPath, type: 'removed', before: a, after: undefined });
    else if (JSON.stringify(a) !== JSON.stringify(b)) changes.push({ path: nextPath, type: 'changed', before: a, after: b });
  });
  return changes;
}

export function summarizeDiff(changes) { return { changed: changes.filter((item) => item.type === 'changed').length, added: changes.filter((item) => item.type === 'added').length, removed: changes.filter((item) => item.type === 'removed').length }; }
