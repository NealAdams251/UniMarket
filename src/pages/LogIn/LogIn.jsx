import { Link } from 'react-router-dom'
import './LogIn.css'

function Login() {
  return (
    <main className="login-page" aria-label="Log In">
      <Link to="/" className="login-home-link" aria-label="Home" title="Home">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5m7-7-7 7 7 7" />
        </svg>
      </Link>
      <section className="login-panel" aria-labelledby="login-heading">
        <h2 id="login-heading">Log into UniMarket</h2>
        <div className="login-fields">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" autoComplete="email" placeholder="Enter your email" />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" />
        </div>
        <div className="login-signup-area">
          <button type="button" className="login-signup-button">Log In</button>
          <Link to="/signup" className="login-signup-link">Sign Up</Link>
        </div>
      </section>
    </main>
  )
}

export default Login