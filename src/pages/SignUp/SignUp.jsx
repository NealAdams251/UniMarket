import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import './SignUp.css'
import { supabase } from '../../lib/supabase'

function SignUp() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    setErrorMessage('')

    if (!email || !password || !confirmPassword) {
      setErrorMessage('Please fill out all fields.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      return
    }

    console.log('User created:', data.user)

    navigate('/login')
  }

  return (
    <main className="signup-page" aria-label="Sign Up">

      <Link
        to="/login"
        className="signup-back-link"
        aria-label="Back to Log In"
        title="Back to Log In"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5m7-7-7 7 7 7" />
        </svg>
      </Link>

      <section
        className="signup-panel"
        aria-labelledby="signup-heading"
      >
        <h2 id="signup-heading">
          Sign up for UniMarket
        </h2>

        <div className="signup-fields">

          <label htmlFor="signup-email">
            Email
          </label>

          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="signup-password">
            Password
          </label>

          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label htmlFor="signup-confirm-password">
            Confirm password
          </label>

          <input
            id="signup-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
          />

        </div>

        {errorMessage && (
          <p className="signup-error">
            {errorMessage}
          </p>
        )}

        <div className="signup-actions">

          <button
            type="button"
            className="signup-submit-button"
            onClick={handleSignUp}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

        </div>

      </section>
    </main>
  )
}

export default SignUp