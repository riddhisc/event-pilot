export function scopeToTenant(rows, tenantId, key = 'tenant_id') {
  if (!tenantId || tenantId === 'all') return rows;
  return rows.filter((row) => row[key] === tenantId && row.role !== 'fde');
}

export function withoutFde(rows) {
  return rows.filter((row) => row.role !== 'fde');
}
