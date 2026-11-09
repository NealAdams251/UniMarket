// Data layer for messaging. Pages only call these functions.
// All access control lives in Postgres (see supabase/migrations/*_messaging.sql).
import { supabase } from './supabase'

const MESSAGE_COLUMNS = `id, conversation_id, sender_id, body, created_at, read_at,
  listing:listings(id, title)`

/** Open (or create) the thread between the signed-in user and otherUserId. Returns its id. */
export async function startConversation(otherUserId) {
  const { data, error } = await supabase.rpc('start_conversation', { other_user: otherUserId })
  if (error) throw error
  return data
}

/** Inbox rows, newest first. */
export async function listConversations() {
  const { data, error } = await supabase.rpc('list_conversations')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    otherUserId: row.other_user_id,
    otherUserName: row.other_user_name ?? 'Student',
    lastMessage: row.last_message,
    lastSenderId: row.last_sender_id,
    lastMessageAt: row.last_message_at,
    unreadCount: Number(row.unread_count),
  }))
}

/** All messages in one thread, oldest first. */
export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error?.code === '22P02') return []
  if (error) throw error
  return data.map(toMessage)
}

/** Send a message. listingId is optional ("about this item"). */
export async function sendMessage(conversationId, body, listingId = null) {
  const text = body.trim()
  if (!text) throw new Error('Message is empty.')
  if (text.length > 2000) throw new Error('Messages can be at most 2000 characters.')

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, body: text, listing_id: listingId })
    .select(MESSAGE_COLUMNS)
    .single()
  if (error) throw error
  return toMessage(data)
}

export async function markConversationRead(conversationId) {
  const { error } = await supabase.rpc('mark_conversation_read', { conv_id: conversationId })
  if (error) throw error
}

/**
 * Live updates for one thread. onInsert receives a message in the same shape
 * getMessages() returns (listing title is fetched lazily if needed).
 * Returns an unsubscribe function.
 */
export function subscribeToConversation(conversationId, onInsert, onRead = () => {}) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      ({ new: row }) => onRead(row.id, row.read_at),
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      async ({ new: row }) => {
        let listing = null
        if (row.listing_id) {
          const { data } = await supabase.from('listings').select('id, title').eq('id', row.listing_id).maybeSingle()
          listing = data
        }
        onInsert(toMessage({ ...row, listing }))
      },
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

/** Fires whenever any thread the user can see gets a new message. Returns unsubscribe. */
export function subscribeToInbox(onChange) {
  const channel = supabase
    .channel('inbox')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => onChange())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

function toMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
    listing: row.listing ? { id: row.listing.id, title: row.listing.title } : null,
  }
}

export function formatMessageTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const days = Math.floor((now - date) / 86_400_000)
  if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
