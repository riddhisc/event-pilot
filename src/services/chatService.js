import { isSupabaseConfigured, useMock } from '../lib/env';
import { supabase } from '../lib/supabaseClient';
import * as store from '../mock/store';

function live() {
  return !useMock && isSupabaseConfigured && supabase;
}

function mapRow(row) {
  return {
    id: row.id,
    eventId: row.event_id || row.eventId,
    senderId: row.user_id || row.senderId,
    senderName: row.sender_name || row.senderName || 'Staff',
    text: row.body || row.text,
    timestamp: row.created_at || row.timestamp,
  };
}

export async function loadMessages(eventId) {
  if (live()) {
    const { data, error } = await supabase.from('chat_messages').select('*').eq('event_id', eventId).order('created_at');
    if (error) throw error;
    return (data || []).map(mapRow);
  }
  return store.listMessages(eventId);
}

export async function sendChatMessage(message) {
  if (live()) {
    const { data, error } = await supabase.from('chat_messages').insert({
      event_id: message.eventId,
      user_id: message.senderId,
      tenant_id: message.tenantId,
      body: message.text,
    }).select().single();
    if (error) throw error;
    return mapRow({ ...data, sender_name: message.senderName });
  }
  return store.publishMessage(message);
}

export function subscribeToChat(eventId, callback) {
  if (live()) {
    const channel = supabase
      .channel(`chat:${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => callback(mapRow(payload.new)))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }
  return store.subscribeMessages(eventId, callback);
}
