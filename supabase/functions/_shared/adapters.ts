export type SyncStats = { created: number; updated: number; skipped: number };

export type AdapterResult = { ok: true } | { ok: false; error: string };

export interface IntegrationAdapter {
  id: 'slack' | 'teams' | 'gcal' | 'outlook' | 'hris_csv' | 'oidc';
  validateConfig(cfg: unknown): AdapterResult;
  connect(tenantId: string, cfg: unknown): Promise<void>;
  sync(tenantId: string, since?: string): Promise<SyncStats>;
  disconnect(tenantId: string): Promise<void>;
}

function objectConfig(cfg: unknown): Record<string, unknown> {
  return cfg && typeof cfg === 'object' ? cfg as Record<string, unknown> : {};
}

export const slackAdapter: IntegrationAdapter = {
  id: 'slack',
  validateConfig(cfg) {
    const value = objectConfig(cfg);
    if (!value.channel && !value.teamId) return { ok: false, error: 'Slack needs a channel or teamId.' };
    return { ok: true };
  },
  async connect() {},
  async sync() {
    return { created: 0, updated: 0, skipped: 0 };
  },
  async disconnect() {},
};

export const gcalAdapter: IntegrationAdapter = {
  id: 'gcal',
  validateConfig(cfg) {
    const value = objectConfig(cfg);
    if (value.calendarId && typeof value.calendarId !== 'string') return { ok: false, error: 'calendarId must be a string.' };
    return { ok: true };
  },
  async connect() {},
  async sync() {
    return { created: 0, updated: 0, skipped: 0 };
  },
  async disconnect() {},
};

export const csvAdapter: IntegrationAdapter = {
  id: 'hris_csv',
  validateConfig(cfg) {
    const value = objectConfig(cfg);
    if (value.filePath && typeof value.filePath !== 'string') return { ok: false, error: 'filePath must be a string.' };
    return { ok: true };
  },
  async connect() {},
  async sync() {
    return { created: 0, updated: 0, skipped: 0 };
  },
  async disconnect() {},
};

export const oidcAdapter: IntegrationAdapter = {
  id: 'oidc',
  validateConfig(cfg) {
    const value = objectConfig(cfg);
    if (typeof value.issuer !== 'string' || !value.issuer.startsWith('https://')) {
      return { ok: false, error: 'OIDC issuer must be an https URL.' };
    }
    return { ok: true };
  },
  async connect() {},
  async sync() {
    return { created: 0, updated: 0, skipped: 0 };
  },
  async disconnect() {},
};

// Stubs. The interface is the same; they do not call Outlook or Teams.
export const outlookAdapter: IntegrationAdapter = {
  id: 'outlook',
  validateConfig() {
    return { ok: false, error: 'Outlook adapter is a stub.' };
  },
  async connect() {
    throw new Error('Outlook adapter is a stub.');
  },
  async sync() {
    throw new Error('Outlook adapter is a stub.');
  },
  async disconnect() {},
};

export const teamsAdapter: IntegrationAdapter = {
  id: 'teams',
  validateConfig() {
    return { ok: false, error: 'Teams adapter is a stub.' };
  },
  async connect() {
    throw new Error('Teams adapter is a stub.');
  },
  async sync() {
    throw new Error('Teams adapter is a stub.');
  },
  async disconnect() {},
};

export const adapters: Record<string, IntegrationAdapter> = {
  slack: slackAdapter,
  gcal: gcalAdapter,
  hris_csv: csvAdapter,
  oidc: oidcAdapter,
  outlook: outlookAdapter,
  teams: teamsAdapter,
};

export function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { headers: [] as string[], rows: [] as string[][] };
  const headers = lines[0].split(',').map((cell) => cell.trim());
  const rows = lines.slice(1).map((line) => line.split(',').map((cell) => cell.trim()));
  return { headers, rows };
}
