import { isSupabaseConfigured, useMock } from '../lib/env';
import { supabase } from '../lib/supabaseClient';
import * as store from '../mock/store';
import { readSession } from './authService';

function live() {
  return !useMock && isSupabaseConfigured && supabase;
}

function mapRow(row) {
  return {
    id: row.id,
    type: row.type,
    message: row.payload?.message || row.message || row.type,
    read: Boolean(row.read_at || row.read),
    createdAt: row.created_at || row.createdAt,
  };
}

export async function fetchNotifications() {
  const user = readSession();
  if (live()) {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  }
  return store.listNotifications(user?.id).map(mapRow);
}

export async function markAsRead(notificationId) {
  const user = readSession();
  if (live()) {
    const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId);
    if (error) throw error;
    return true;
  }
  store.markNotification(notificationId, user?.id);
  return true;
}

export async function markAllAsRead() {
  const user = readSession();
  if (live()) {
    const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
    if (error) throw error;
    return true;
  }
  store.markAllNotifications(user?.id);
  return true;
}
