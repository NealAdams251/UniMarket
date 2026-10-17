// Profile button with a dropdown menu. Closes on outside click or Escape.
import { useEffect, useRef, useState } from 'react'
import './ProfileMenu.css'

const MENU_ITEMS = [
  { label: 'My Profile', action: 'profile' },
  { label: 'My listings', action: 'listings' },
  { label: 'Messages', action: 'messages' },
  { label: 'Settings', action: 'settings' },
]

function ProfileMenu({ name = 'Guest', onSelect = () => {} }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

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

  function choose(action) {
    setOpen(false)
    onSelect(action)
  }

  return (
    <div className="profile-menu" ref={wrapperRef}>
      <button
        type="button"
        className="profile-button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="profile-icon" aria-hidden="true">{initials}</span>
        <span className="profile-text">
          <span className="profile-name">{name}</span>
        </span>
        <span className={`profile-caret${open ? ' open' : ''}`} aria-hidden="true">▾</span>
      </button>

      {open && (
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
            <button type="button" role="menuitem" className="danger" onClick={() => choose('signout')}>
              Sign out
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}

export default ProfileMenu
