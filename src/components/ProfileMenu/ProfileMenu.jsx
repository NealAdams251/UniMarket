import { useNavigate } from 'react-router-dom'
// Profile button with a dropdown menu. Closes on outside click or Escape.
import { useEffect, useRef, useState } from 'react'
import './ProfileMenu.css'
import { supabase } from '../../lib/supabase'

const MENU_ITEMS = [
  { label: 'My Profile', action: 'profile' },
  { label: 'My listings', action: 'listings' },
  { label: 'Messages', action: 'messages' },
  { label: 'Settings', action: 'settings' },
]

function ProfileMenu({ onSelect = () => {}, currentUser, setCurrentUser }) {
  const isAuthenticated = !! currentUser
  const name = currentUser?.name || 'Sign Up/Log In'
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error signing out:', error)
      return
    }

    setCurrentUser(null)
    setOpen(false)
    navigate('/')
  }

  function choose(action) {
    setOpen(false)
    onSelect(action)
  }



  return (
    <div className="profile-menu" ref={wrapperRef}>
      <button
        type="button"
        className="profile-button"
        aria-haspopup={isAuthenticated ? 'menu' : undefined}
        aria-expanded={isAuthenticated ? open : undefined}
        onClick={() => {
          if (isAuthenticated) setOpen((o) => !o)
          else navigate('/login')
        }}
      >
        <span className="profile-text">
          <span className="profile-name">{name}</span>
        </span>
        {isAuthenticated && <span className={`profile-caret${open ? ' open' : ''}`} aria-hidden="true">▾</span>}
      </button>

      {/* Retained for future authenticated profile actions. */}
      {isAuthenticated && open && (
        <ul className="profile-dropdown" role="menu">
          {MENU_ITEMS.map((item) => (
            <li key={item.action} role="none">
              <button type="button" role="menuitem" onClick={() => choose(item.action)}>
                {item.label}
              </button>
            </li>
          ))}
          
          <li role="separator" className="profile-divider" />
          <li role="none">
            <button type="button" role="menuitem" className="danger" onClick={handleSignOut}>
              Sign out
            </button>
          </li>
          
        </ul>
      )}
    </div>
  )
}

export default ProfileMenu
