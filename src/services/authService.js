import { isSupabaseConfigured } from '../lib/env';
import { supabase } from '../lib/supabaseClient';

const SESSION_KEY = 'eventpilot.session';
const RESET_KEY = 'eventpilot.reset';
const OVERRIDE_KEY = 'eventpilot.mockPasswords';

function account(emailKey, passwordKey, profile) {
  return {
    email: import.meta.env[emailKey] || profile.email,
    password: import.meta.env[passwordKey] || '',
    profile,
  };
}

function mockAccounts() {
  return [
    account('VITE_MOCK_ADMIN_EMAIL', 'VITE_MOCK_ADMIN_PASSWORD', {
      id: 'user-admin',
      email: 'avery@northwind.example',
      name: 'Avery Admin',
      role: 'admin',
      tenant_id: 'tenant-northwind',
      title: 'Workplace Lead',
      department: 'People',
    }),
    account('VITE_MOCK_STAFF_EMAIL', 'VITE_MOCK_STAFF_PASSWORD', {
      id: 'user-staff',
      email: 'sam@northwind.example',
      name: 'Sam Staff',
      role: 'staff',
      tenant_id: 'tenant-northwind',
      title: 'Engineer',
      department: 'Engineering',
    }),
    account('VITE_MOCK_FDE_EMAIL', 'VITE_MOCK_FDE_PASSWORD', {
      id: 'user-fde',
      email: 'fde@eventbuddy.com',
      name: 'Finn Deployed',
      role: 'fde',
      tenant_id: null,
      title: 'Forward Deployed Engineer',
      department: 'Platform',
    }),
  ];
}

function mockMode() {
  return import.meta.env.VITE_USE_MOCK === 'true';
}

function live() {
  return !mockMode() && isSupabaseConfigured && supabase;
}

function passwordOverrides() {
  try {
    return JSON.parse(sessionStorage.getItem(OVERRIDE_KEY) || '{}');
  } catch {
    return {};
  }
}

function acceptedPassword(entry) {
  return passwordOverrides()[entry.email] || entry.password;
}

async function profileFor(user) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
      role: user.user_metadata?.role || 'staff',
      tenant_id: user.user_metadata?.tenant_id || null,
    };
  }
  return {
    id: data.id,
    email: data.email,
    name: data.full_name,
    role: data.role,
    tenant_id: data.tenant_id,
    title: data.title,
    department: data.department,
  };
}

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function writeSession(user) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export async function login(credentials) {
  if (credentials.provider) {
    if (!supabase) throw new Error('Google and Microsoft sign-in need VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: credentials.provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return null;
  }

  if (credentials.demoRole) {
    if (live()) throw new Error('Dummy sign-in is only available while Supabase is not configured.');
    const found = mockAccounts().find((entry) => entry.profile.role === credentials.demoRole);
    if (!found) throw new Error('Unknown demo account.');
    const session = { ...found.profile, source: 'login' };
    writeSession(session);
    return session;
  }

  if (!live()) {
    if (!mockMode()) {
      throw new Error('Set VITE_USE_MOCK=true or add the Supabase URL and anon key.');
    }
    const email = String(credentials.email || '').trim().toLowerCase();
    const found = mockAccounts().find((entry) => entry.email.toLowerCase() === email);
    const expected = found ? acceptedPassword(found) : '';
    if (!found || !expected || expected !== credentials.password) {
      throw new Error('That email and password do not match.');
    }
    const session = { ...found.profile, source: 'login' };
    writeSession(session);
    return session;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  if (error) throw error;
  const profile = await profileFor(data.user);
  writeSession(profile);
  return profile;
}

export async function restoreSession() {
  if (!live()) {
    const session = readSession();
    if (!session?.source) {
      writeSession(null);
      return null;
    }
    return session;
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.user) {
    writeSession(null);
    return null;
  }
  const profile = await profileFor(data.session.user);
  writeSession(profile);
  return profile;
}

export async function logout() {
  if (live()) await supabase.auth.signOut();
  writeSession(null);
}

export async function requestPasswordReset(email) {
  if (live()) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return { message: 'If that email is registered, a reset link is on its way.' };
  }
  if (!mockMode()) throw new Error('Password reset needs Supabase or mock mode.');
  const token = crypto.randomUUID();
  sessionStorage.setItem(RESET_KEY, JSON.stringify({ email, token }));
  return { message: 'Mock mode saved a reset token in this browser session. Continue to choose a new password.' };
}

export async function resetPassword(token, newPassword) {
  if (live()) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { message: 'Password updated.' };
  }
  const pending = JSON.parse(sessionStorage.getItem(RESET_KEY) || 'null');
  if (!pending || pending.token !== token) throw new Error('Reset link is missing or expired.');
  if (!newPassword || newPassword.length < 8) throw new Error('Use at least 8 characters.');
  const overrides = passwordOverrides();
  overrides[pending.email] = newPassword;
  sessionStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
  sessionStorage.removeItem(RESET_KEY);
  return { message: 'Password updated for this browser session. Sign in with the new password.' };
}

export function readResetToken() {
  try {
    return JSON.parse(sessionStorage.getItem(RESET_KEY) || 'null');
  } catch {
    return null;
  }
}
