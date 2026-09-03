import type { UIMessage } from 'ai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type ChatMetadataJson = Database['public']['Tables']['chat_messages']['Update']['metadata'];
import type { AlertContextItem } from '@/lib/consultant/system-prompt';

export type StoreSupabase = SupabaseClient<Database>;

export interface AlertMetadata extends Record<string, unknown> {
  alert_unread?: boolean;
  prompt_id?: string;
  prompt_query_text?: string;
  engine?: string;
  competitor?: string;
  drop?: number;
}

const CONTEXT_WINDOW_MESSAGES = 24;

/**
 * Loads the most recent chat history for a project (chat_messages, RLS-scoped)
 * and converts it to UIMessage[] for useChat's initialMessages.
 * Messages persisted here only carry text parts; tool cards always re-render
 * live from the current session stream.
 */
export async function loadInitialChatMessages(
  supabase: StoreSupabase,
  projectId: string
): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, sender, content, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('chat-store: failed to load chat history:', error.message);
    return [];
  }

  return (data || [])
    .slice(-CONTEXT_WINDOW_MESSAGES)
    .map((row) => ({
      id: row.id,
      role: row.sender === 'agent' ? ('assistant' as const) : ('user' as const),
      parts: [{ type: 'text' as const, text: row.content }],
      createdAt: new Date(row.created_at),
    }));
}

/**
 * Alert-to-Chat Trigger Pipeline (read side).
 * The background audit cron inserts agent rows flagged metadata.alert_unread = true.
 * This returns them (newest last) so the /consultant page can seed the thread and
 * the system prompt can brief the agent on what happened while the user was away.
 */
export async function loadUnreadAlerts(
  supabase: StoreSupabase,
  projectId: string
): Promise<AlertContextItem[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, content, metadata, created_at')
    .eq('project_id', projectId)
    .eq('sender', 'agent')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    console.warn('chat-store: failed to load proactive alerts:', error.message);
    return [];
  }

  return (data || [])
    .filter((row) => {
      const metadata = (row.metadata || {}) as AlertMetadata;
      return metadata.alert_unread === true;
    })
    .slice(-5)
    .map((row) => {
      const metadata = (row.metadata || {}) as AlertMetadata;
      return {
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        promptId: metadata.prompt_id ?? null,
        promptQueryText: metadata.prompt_query_text ?? null,
        engine: metadata.engine ?? null,
        competitor: metadata.competitor ?? null,
        drop: typeof metadata.drop === 'number' ? metadata.drop : null,
      };
    });
}

/**
 * Marks proactive alert rows as consumed so the same drop alert does not
 * re-seed the thread on every visit to /consultant.
 */
export async function markAlertsConsumed(supabase: StoreSupabase, alertIds: string[]) {
  if (alertIds.length === 0) return;
  const { error } = await supabase
    .from('chat_messages')
    .update({ metadata: { alert_unread: false } as ChatMetadataJson })
    .in('id', alertIds);

  if (error) {
    console.warn('chat-store: failed to mark alerts consumed:', error.message);
  }
}

export interface PersistedMessageInput {
  projectId: string;
  sender: 'user' | 'agent';
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Appends one message to the durable chat thread.
 * Returns the inserted row id so streamed agent messages keep a stable id
 * across reloads.
 */
export async function persistChatMessage(
  supabase: StoreSupabase,
  input: PersistedMessageInput
): Promise<string | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      project_id: input.projectId,
      sender: input.sender,
      content: input.content,
      metadata: (input.metadata || {}) as ChatMetadataJson,
    })
    .select('id')
    .single();

  if (error) {
    console.warn('chat-store: failed to persist chat message:', error.message);
    return null;
  }
  return data?.id ?? null;
}
