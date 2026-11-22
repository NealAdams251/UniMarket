import './Friends.css'
import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import { useAuthUser } from '../../hooks/useAuthUser'
import { startConversation } from '../../lib/messages'
import {
  listFriendships,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  searchStudents,
  subscribeToFriendships,
} from '../../lib/friends'

const EMPTY = { friends: [], incoming: [], outgoing: [] }

function Friends() {
  const navigate = useNavigate()
  const { loading: authLoading, user } = useAuthUser()

  const [groups, setGroups] = useState(EMPTY)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [search, setSearch] = useState({ term: '', rows: [] })
  const term = query.trim()
  const searching = term.length >= 2 && search.term !== term
  const results = search.term === term ? search.rows : []

  const refresh = useCallback(() => {
    return listFriendships()
      .then((g) => { setGroups(g); setStatus('ready') })
      .catch((err) => { console.error('Failed to load friends:', err); setStatus('error') })
  }, [])

  useEffect(() => {
    if (!user) return
    refresh()
    return subscribeToFriendships(refresh)
  }, [user, refresh])

  // Debounced name search.
  useEffect(() => {
    if (!user) return
    if (term.length < 2) return
    let ignore = false
    const timer = setTimeout(() => {
      searchStudents(term, user.id)
        .then((rows) => { if (!ignore) setSearch({ term, rows }) })
        .catch((err) => { console.error('Search failed:', err); if (!ignore) setSearch({ term, rows: [] }) })
    }, 250)
    return () => { ignore = true; clearTimeout(timer) }
  }, [term, user])

  if (authLoading) return <main className="friends-page"><p className="friends-status">Loading…</p></main>
  if (!user) return <Navigate to="/login" replace />

  async function run(userId, action) {
    setBusyId(userId)
    setError('')
    try {
      await action(userId)
      await refresh()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function message(userId) {
    setBusyId(userId)
    try {
      const conversationId = await startConversation(userId)
      navigate(`/messages/${conversationId}`)
    } catch (err) {
      console.error('Failed to start conversation:', err)
      setError('Could not open the conversation. Try again.')
      setBusyId(null)
    }
  }

  function relationOf(userId) {
    if (groups.friends.some((f) => f.userId === userId)) return 'friends'
    if (groups.incoming.some((f) => f.userId === userId)) return 'incoming'
    if (groups.outgoing.some((f) => f.userId === userId)) return 'outgoing'
    return 'none'
  }

  return (
    <div className="friends-layout">
      <Sidebar />
      <main className="friends-page">
        <div className="friends-header">
          <Link className="friends-home" to="/">← Home</Link>
          <h1>Friends</h1>
        </div>

        {error && <p className="friends-error" role="alert">{error}</p>}

        <section className="friends-section" aria-labelledby="add-friends-heading">
          <h2 id="add-friends-heading">Add friends</h2>
          <input
            type="search"
            className="friends-search"
            placeholder="Search students by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search students by name"
          />
          {term.length >= 2 && (
            <ul className="friends-list">
              {searching && results.length === 0 && <li className="friends-status">Searching…</li>}
              {!searching && results.length === 0 && <li className="friends-status">No students found.</li>}
              {results.map((s) => {
                const relation = relationOf(s.userId)
                return (
                  <li key={s.userId} className="friend-row">
                    <PersonLink userId={s.userId} name={s.name} subtitle={s.school} />
                    <div className="friend-actions">
                      {relation === 'none' && (
                        <button type="button" className="friend-btn primary" disabled={busyId === s.userId}
                          onClick={() => run(s.userId, sendFriendRequest)}>Add friend</button>
                      )}
                      {relation === 'outgoing' && <span className="friend-tag">Request sent</span>}
                      {relation === 'incoming' && (
                        <button type="button" className="friend-btn primary" disabled={busyId === s.userId}
                          onClick={() => run(s.userId, acceptFriendRequest)}>Accept</button>
                      )}
                      {relation === 'friends' && <span className="friend-tag">Friends</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {status === 'loading' && <p className="friends-status">Loading…</p>}
        {status === 'error' && <p className="friends-status">Could not load friends. Try refreshing.</p>}

        {status === 'ready' && groups.incoming.length > 0 && (
          <section className="friends-section" aria-labelledby="requests-heading">
            <h2 id="requests-heading">Friend requests <span className="friends-count">{groups.incoming.length}</span></h2>
            <ul className="friends-list">
              {groups.incoming.map((f) => (
                <li key={f.userId} className="friend-row">
                  <PersonLink userId={f.userId} name={f.name} subtitle="Wants to be friends" />
                  <div className="friend-actions">
                    <button type="button" className="friend-btn primary" disabled={busyId === f.userId}
                      onClick={() => run(f.userId, acceptFriendRequest)}>Accept</button>
                    <button type="button" className="friend-btn" disabled={busyId === f.userId}
                      onClick={() => run(f.userId, declineFriendRequest)}>Decline</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {status === 'ready' && (
          <section className="friends-section" aria-labelledby="my-friends-heading">
            <h2 id="my-friends-heading">My friends <span className="friends-count">{groups.friends.length}</span></h2>
            {groups.friends.length === 0 ? (
              <p className="friends-status">No friends yet. Search above or tap “Add friend” on someone’s profile.</p>
            ) : (
              <ul className="friends-list">
                {groups.friends.map((f) => (
                  <li key={f.userId} className="friend-row">
                    <PersonLink userId={f.userId} name={f.name}
                      subtitle={`Friends since ${new Date(f.since).toLocaleDateString()}`} />
                    <div className="friend-actions">
                      <button type="button" className="friend-btn primary" disabled={busyId === f.userId}
                        onClick={() => message(f.userId)}>Message</button>
                      <button type="button" className="friend-btn" disabled={busyId === f.userId}
                        onClick={() => {
                          if (window.confirm(`Remove ${f.name} from your friends?`)) run(f.userId, removeFriend)
                        }}>Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {status === 'ready' && groups.outgoing.length > 0 && (
          <section className="friends-section" aria-labelledby="sent-heading">
            <h2 id="sent-heading">Sent requests</h2>
            <ul className="friends-list">
              {groups.outgoing.map((f) => (
                <li key={f.userId} className="friend-row">
                  <PersonLink userId={f.userId} name={f.name} subtitle="Pending" />
                  <div className="friend-actions">
                    <button type="button" className="friend-btn" disabled={busyId === f.userId}
                      onClick={() => run(f.userId, removeFriend)}>Cancel</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}

function PersonLink({ userId, name, subtitle }) {
  return (
    <Link to={`/profile/${userId}`} className="friend-person">
      <span className="friend-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
      <span className="friend-text">
        <span className="friend-name">{name}</span>
        {subtitle && <span className="friend-sub">{subtitle}</span>}
      </span>
    </Link>
  )
}

export default Friends
