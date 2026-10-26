import './LogIn.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

function Login({ setCurrentUser }) {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    console.log('Attempting login with email:', email)
    setErrorMessage('')

    if (!email || !password) {
      setErrorMessage('Please enter your email and password.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setErrorMessage('Invalid email or password.')
      console.error(error)
      return
    }

    if (!data.user) {
      setErrorMessage('User not found.')
      return
    }

    // Get the matching public profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error(profileError)
      setErrorMessage('Could not load your profile.')
      return
    }

    setCurrentUser({
      uid: data.user.id,
      email: data.user.email,
      name: profile.display_name,
      school: profile.school,
      bio: profile.bio,
    })
    navigate('/')
  }


  return (
    <main className="login-page">
      <section className="login-panel">
        <h2>Log In to UniMarket</h2>

        <div className="login-fields">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {errorMessage && (
          <p className="login-error">
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </section>
    </main>
  )
}

export default Login