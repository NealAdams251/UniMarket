import { useLocation, useNavigate } from 'react-router-dom'
import './Sidebar.css'
import { Link } from 'react-router-dom'
import uciLogo from '../../assets/uci-logo.png'


function Sidebar() {
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

        <Link to="/" className="sidebar-logo" aria-label="UniMarket home" title="Return to homepage">
          <img src={uciLogo} alt="UCI" />
        </Link>
        
    </aside>
  )
}

export default Sidebar