// Data layer for friends. Pages only call these functions.
// All access control lives in Postgres (see supabase/migrations/*_friends.sql).
import { supabase } from './supabase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Everyone I'm connected to, grouped:
 *   { friends: [...], incoming: [...], outgoing: [...] }
 * Each entry: { userId, name, status, direction, since }
 */
export async function listFriendships() {
  const { data, error } = await supabase.rpc('list_friendships')
  if (error) throw error
  const groups = { friends: [], incoming: [], outgoing: [] }
  for (const row of data) {
    const entry = {
      userId: row.other_user_id,
      name: row.other_user_name ?? 'Student',
      status: row.status,
      direction: row.direction,
      since: row.responded_at ?? row.created_at,
    }
    if (row.status === 'accepted') groups.friends.push(entry)
    else if (row.direction === 'incoming') groups.incoming.push(entry)
    else groups.outgoing.push(entry)
  }
  return groups
}

/**
 * My relationship with one user:
 *   'none' | 'friends' | 'incoming' (they asked me) | 'outgoing' (I asked them)
 */
export async function getFriendshipStatus(myId, otherUserId) {
  if (!myId || !otherUserId || myId === otherUserId) return 'none'
  // otherUserId comes from the URL; only let real UUIDs into the filter string.
  if (!UUID_RE.test(otherUserId)) return 'none'
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(`and(requester_id.eq.${myId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${myId})`)
    .maybeSingle()
  if (error?.code === '22P02') return 'none' // malformed uuid in the URL
  if (error) throw error
  if (!data) return 'none'
  if (data.status === 'accepted') return 'friends'
  return data.addressee_id === myId ? 'incoming' : 'outgoing'
}

/** Send a request. If they already asked me, this accepts it. Returns 'pending' | 'accepted'. */
export async function sendFriendRequest(otherUserId) {
  const { data, error } = await supabase.rpc('send_friend_request', { other_user: otherUserId })
  if (error) throw error
  return data
}

export async function acceptFriendRequest(otherUserId) {
  const { error } = await supabase.rpc('respond_friend_request', { other_user: otherUserId, accept: true })
  if (error) throw error
}

export async function declineFriendRequest(otherUserId) {
  const { error } = await supabase.rpc('respond_friend_request', { other_user: otherUserId, accept: false })
  if (error) throw error
}

/** Unfriend, or cancel a request I sent. */
export async function removeFriend(otherUserId) {
  const { error } = await supabase.rpc('remove_friend', { other_user: otherUserId })
  if (error) throw error
}

/** Find students by display name (for the "Add friends" search box). */
export async function searchStudents(query, excludeUserId) {
  const term = query.trim()
  if (term.length < 2) return []
  // Escape LIKE wildcards so "50%" searches literally.
  const pattern = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
  let request = supabase
    .from('profiles')
    .select('id, display_name, school')
    .ilike('display_name', pattern)
    .order('display_name')
    .limit(10)
  if (excludeUserId) request = request.neq('id', excludeUserId)
  const { data, error } = await request
  if (error) throw error
  return data.map((row) => ({ userId: row.id, name: row.display_name ?? 'Student', school: row.school }))
}

/** Fires whenever one of my friendships changes. Returns unsubscribe. */
export function subscribeToFriendships(onChange) {
  const channel = supabase
    .channel(`friendships:${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => onChange())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}
