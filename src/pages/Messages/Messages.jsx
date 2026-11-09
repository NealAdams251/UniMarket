import './Messages.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import { useAuthUser } from '../../hooks/useAuthUser'
import {
  listConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  subscribeToConversation,
  subscribeToInbox,
  formatMessageTime,
} from '../../lib/messages'

function Messages() {
  const { conversationId } = useParams()
  const { loading: authLoading, user } = useAuthUser()

  const [conversations, setConversations] = useState([])
  const [inboxStatus, setInboxStatus] = useState('loading') // loading | ready | error

  const refreshInbox = useCallback(() => {
    return listConversations()
      .then((rows) => { setConversations(rows); setInboxStatus('ready') })
      .catch((err) => { console.error('Failed to load conversations:', err); setInboxStatus('error') })
  }, [])

  useEffect(() => {
    if (!user) return
    refreshInbox()
    return subscribeToInbox(refreshInbox)
  }, [user, refreshInbox])

  if (authLoading) return <main className="messages-page"><p className="messages-status">Loading…</p></main>
  if (!user) return <Navigate to="/login" replace />

  const active = conversations.find((c) => c.id === conversationId)

  return (
    <div className="messages-layout">
      <Sidebar />
      <main className={`messages-page${conversationId ? ' has-thread' : ''}`}>
        <section className="inbox" aria-label="Conversations">
          <div className="inbox-header">
            <Link className="messages-home" to="/">← Home</Link>
            <h1>Messages</h1>
          </div>

          {inboxStatus === 'loading' && <p className="messages-status">Loading…</p>}
          {inboxStatus === 'error' && <p className="messages-status">Could not load messages. Try refreshing.</p>}
          {inboxStatus === 'ready' && conversations.length === 0 && (
            <p className="messages-status">No messages yet. Find something you like and message the seller.</p>
          )}

          <ul className="inbox-list">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/messages/${c.id}`}
                  className={`inbox-row${c.id === conversationId ? ' active' : ''}${c.unreadCount ? ' unread' : ''}`}
                >
                  <span className="inbox-avatar" aria-hidden="true">{c.otherUserName.charAt(0).toUpperCase()}</span>
                  <span className="inbox-text">
                    <span className="inbox-top">
                      <span className="inbox-name">{c.otherUserName}</span>
                      <span className="inbox-time">{formatMessageTime(c.lastMessageAt)}</span>
                    </span>
                    <span className="inbox-preview">
                      {c.lastMessage
                        ? `${c.lastSenderId === user.id ? 'You: ' : ''}${c.lastMessage}`
                        : 'No messages yet'}
                    </span>
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="inbox-badge" aria-label={`${c.unreadCount} unread`}>{c.unreadCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="thread-pane" aria-label="Conversation">
          {conversationId
            ? <Thread
                key={conversationId}
                conversationId={conversationId}
                me={user.id}
                other={active}
                onActivity={refreshInbox}
              />
            : <p className="messages-status thread-empty">Select a conversation.</p>}
        </section>
      </main>
    </div>
  )
}

function Thread({ conversationId, me, other, onActivity }) {
  const location = useLocation()
  const navigate = useNavigate()
  // Set when the user arrives from an item page via "Message seller".
  const [aboutListing, setAboutListing] = useState(location.state?.listing ?? null)
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef(null)

  const addMessage = useCallback((msg) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
  }, [])

  useEffect(() => {
    let ignore = false
    getMessages(conversationId)
      .then((rows) => {
        if (ignore) return
        setMessages(rows)
        setStatus('ready')
        markConversationRead(conversationId).then(onActivity).catch(() => {})
      })
      .catch((err) => { console.error('Failed to load messages:', err); if (!ignore) setStatus('error') })

    const unsubscribe = subscribeToConversation(conversationId, (msg) => {
      addMessage(msg)
      if (msg.senderId !== me) markConversationRead(conversationId).then(onActivity).catch(() => {})
    }, (id, readAt) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, readAt } : m)))
    })
    return () => { ignore = true; unsubscribe() }
  }, [conversationId, me, addMessage, onActivity])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function handleSend(event) {
    event.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    setSendError('')
    try {
      const msg = await sendMessage(conversationId, draft, aboutListing?.id ?? null)
      addMessage(msg)
      setDraft('')
      setAboutListing(null)
      // Drop the listing from history state so a refresh doesn't re-attach it.
      if (location.state?.listing) navigate(location.pathname, { replace: true, state: null })
      onActivity()
    } catch (err) {
      console.error('Failed to send message:', err)
      setSendError(err.message?.includes('2000') ? err.message : 'Could not send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) handleSend(event)
  }

  return (
    <div className="thread">
      <header className="thread-header">
        <Link className="thread-back" to="/messages" aria-label="Back to conversations">←</Link>
        {other
          ? <Link className="thread-name" to={`/profile/${other.otherUserId}`}>{other.otherUserName}</Link>
          : <span className="thread-name">Conversation</span>}
      </header>

      <div className="thread-body">
        {status === 'loading' && <p className="messages-status">Loading…</p>}
        {status === 'error' && <p className="messages-status">Could not load this conversation.</p>}
        {status === 'ready' && messages.length === 0 && (
          <p className="messages-status">Say hi 👋</p>
        )}
        <ol className="message-list">
          {messages.map((m) => {
            const mine = m.senderId === me
            return (
              <li key={m.id} className={`message${mine ? ' mine' : ''}`}>
                {m.listing && (
                  <Link className="message-listing" to={`/ItemPage/${m.listing.id}`}>
                    About: {m.listing.title}
                  </Link>
                )}
                <p className="message-body">{m.body}</p>
                <span className="message-meta">
                  {formatMessageTime(m.createdAt)}
                  {mine && m.readAt && ' · Seen'}
                </span>
              </li>
            )
          })}
        </ol>
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={handleSend}>
        {aboutListing && (
          <div className="composer-listing">
            <span>About: <strong>{aboutListing.title}</strong></span>
            <button type="button" aria-label="Remove item reference" onClick={() => setAboutListing(null)}>×</button>
          </div>
        )}
        <div className="composer-row">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message…"
            rows={1}
            maxLength={2000}
            aria-label="Message"
          />
          <button type="submit" disabled={sending || !draft.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
        {sendError && <p className="composer-error" role="alert">{sendError}</p>}
      </form>
    </div>
  )
}

export default Messages
