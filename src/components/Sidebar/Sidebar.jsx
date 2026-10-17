import { useLocation, useNavigate } from 'react-router-dom'
import './Sidebar.css'
import uciLogo from '../../assets/uci-logo.png'

function Sidebar({ categoriesOpen, onToggleCategories }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const goHome = () => {
    if (pathname === '/') {
      window.location.reload()
    } else {
      navigate('/')
    }
  }
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        {onToggleCategories && (
          <button
            type="button"
            className="sidebar-menu-toggle"
            aria-label={categoriesOpen ? 'Hide search and categories' : 'Show search and categories'}
            aria-expanded={categoriesOpen}
            aria-controls="search-panel"
            onClick={onToggleCategories}
          >
            <span aria-hidden="true">☰</span>
          </button>
        )}
        <div className="sidebar-logo">
          <img src={uciLogo} alt="UCI" />
        </div>

      </div>
      <nav className="sidebar-nav">
        <button type="button" className="sidebar-item" aria-label="Home" title="Home" onClick={goHome}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 10 12 3l9 7" />
            <path d="M5 9v12h5v-7h4v7h5V9" />
          </svg>
        </button>
        <button className="sidebar-item"> button2 </button>
        <button className="sidebar-item"> button3 </button>
        <button className="sidebar-item"> button4 </button>
      </nav>
    </aside>
  )
}

export default Sidebar