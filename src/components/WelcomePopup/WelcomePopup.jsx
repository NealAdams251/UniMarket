import { useEffect, useRef, useState } from 'react'
import './WelcomePopup.css'

const STORAGE_KEY = 'unimarket-welcome-dismissed'

function WelcomePopup() {
  const dialogRef = useRef(null)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!dismissed && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [dismissed])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // The popup still closes when browser storage is unavailable.
    }
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <dialog ref={dialogRef} className="welcome-popup"
      aria-labelledby="welcome-title" aria-describedby="welcome-instructions"
      onClose={dismiss}>
      <form method="dialog">
        <button className="welcome-close" type="submit" aria-label="Close welcome instructions" autoFocus>
          <span aria-hidden="true">×</span>
        </button>
      </form>
      <h2 id="welcome-title">Welcome to UNIMarket</h2>
      <ul id="welcome-instructions">
        <li>Browse items or use search and categories to find what you need.</li>
        <li>Open a listing to view details and contact the seller.</li>
        <li>Sign up or log in to message sellers and list items with Sell Item.</li>
      </ul>
    </dialog>
  )
}

export default WelcomePopup