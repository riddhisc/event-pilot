const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInviteRows(rows = [], { existingEmails = [], departments = [] } = {}) {
  const existing = new Set(existingEmails.map((email) => email.toLowerCase()));
  const seen = new Set();
  return rows.map((row, index) => {
    const email = String(row.email || '').trim();
    const errors = [];
    const key = email.toLowerCase();
    if (!EMAIL.test(email)) errors.push('Invalid email');
    if (seen.has(key)) errors.push('Duplicate in file');
    if (existing.has(key)) errors.push('Already exists in tenant');
    if (row.department && departments.length && !departments.includes(row.department)) errors.push('Unknown department');
    if (row.role && !['admin', 'staff'].includes(String(row.role).toLowerCase())) errors.push('Forbidden role');
    seen.add(key);
    return { ...row, row: row.row || index + 2, errors, valid: errors.length === 0 };
  });
}

export function inviteSummary(rows = []) {
  return { valid: rows.filter((row) => row.valid).length, errors: rows.filter((row) => !row.valid).length, duplicates: rows.filter((row) => row.errors?.includes('Duplicate in file')).length };
}
