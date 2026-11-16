import { describe, expect, it } from 'vitest';
import { buildAttentionItems } from './attentionRules';
import { inviteSummary, validateInviteRows } from './inviteValidator';
import { filterAndRankSuggestions } from './suggestions';
import { diffJson, summarizeDiff } from './configDiff';

describe('remaining spec helpers', () => {
  it('builds attention rules', () => { const now = new Date('2026-01-01T00:00:00Z'); const items = buildAttentionItems([{ id: 'e', title: 'Event', starts_at: '2026-01-03', capacity: 10, registered_count: 2 }], [], now); expect(items[0].type).toBe('low_rsvp'); });
  it('validates invite rows', () => { const rows = validateInviteRows([{ email: 'ok@example.com', role: 'staff' }, { email: 'ok@example.com', role: 'fde' }], { existingEmails: ['taken@example.com'] }); expect(inviteSummary(rows)).toMatchObject({ valid: 1, errors: 1, duplicates: 1 }); });
  it('filters and ranks suggestions', () => { expect(filterAndRankSuggestions([{ name: 'B', score: 2 }, { name: 'A', score: 5 }])[0].name).toBe('A'); });
  it('summarizes nested config changes', () => { const changes = diffJson({ a: 1, nested: { x: true } }, { a: 2, nested: { x: true, y: 3 } }); expect(summarizeDiff(changes)).toEqual({ changed: 1, added: 1, removed: 0 }); });
});
