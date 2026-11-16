import { isSupabaseConfigured, useMock } from '../lib/env';
import { supabase } from '../lib/supabaseClient';

export function listenForNotifications(callback) {
  if (useMock || !isSupabaseConfigured || !supabase) {
    return { off() {} };
  }

  const channel = supabase
    .channel('notifications-feed')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
      const row = payload.new;
      callback({
        id: row.id,
        type: row.type,
        message: row.payload?.message || row.type,
        read: false,
        createdAt: row.created_at,
      });
    })
    .subscribe();

  return {
    off() {
      supabase.removeChannel(channel);
    },
  };
}
