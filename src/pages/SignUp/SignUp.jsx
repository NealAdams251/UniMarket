import { Link } from 'react-router-dom'
import './SignUp.css'

function SignUp() {
  return (
    <main className="signup-page" aria-label="Sign Up">
      <Link to="/login" className="signup-back-link" aria-label="Back to Log In" title="Back to Log In">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5m7-7-7 7 7 7" />
        </svg>
      </Link>
      <section className="signup-panel" aria-labelledby="signup-heading">
        <h2 id="signup-heading">Sign up for UniMarket</h2>
        <div className="signup-fields">
          <label htmlFor="signup-email">Email</label>
          <input id="signup-email" name="email" type="email" autoComplete="email" placeholder="Enter your email" />
          <label htmlFor="signup-password">Password</label>
          <input id="signup-password" name="password" type="password" autoComplete="new-password" placeholder="Enter your password" />
          <label htmlFor="signup-confirm-password">Confirm password</label>
          <input id="signup-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Confirm your password" />
        </div>
        <div className="signup-actions">
          <button type="button" className="signup-submit-button">Sign Up</button>
        </div>
      </section>
    </main>
  )
}

export default SignUp