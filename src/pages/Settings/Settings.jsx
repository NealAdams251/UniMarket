import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './Settings.css'

function Settings({ setCurrentUser }) {
  const [auth, setAuth] = useState({ loading: true, user: null })
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let active = true
    let authChanged = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authChanged = true
      if (active) setAuth({ loading: false, user: session?.user ?? null })
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && !authChanged) setAuth({ loading: false, user: error ? null : data.session?.user ?? null })
    }).catch(() => {
      if (active && !authChanged) setAuth({ loading: false, user: null })
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  async function signOut() {
    setSigningOut(true)
    setError('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setCurrentUser(null)
      setAuth({ loading: false, user: null })
    } catch {
      setError('Could not sign out. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  if (auth.loading) return <main className="settings-page"><p role="status">Loading settings…</p></main>
  if (!auth.user) return <Navigate to="/login" replace />

  return (
    <main className="settings-page">
      <Link className="settings-home" to="/">← Back to home</Link>
      <div className="settings-content">
      <h1>Settings</h1>
      <section className="settings-section" aria-labelledby="account-heading">
        <h2 id="account-heading">Account</h2>
        <dl><dt>Email</dt><dd>{auth.user.email}</dd></dl>
        <Link to={`/profile/${auth.user.id}`}>View my profile</Link>
      </section>
      <section className="settings-section" aria-label="Sign out">
        <button type="button" onClick={signOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
        {error && <p role="alert">{error}</p>}
      </section>
      </div>
    </main>
  )
}

export default Settings