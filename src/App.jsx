import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home/Home'
import ItemPage from './pages/ItemPage/ItemPage'
import Login from './pages/LogIn/LogIn'
import SignUp from './pages/SignUp/SignUp'
import './App.css'

function MarketplaceLayout() {
  const { pathname } = useLocation()
  const showHeader = pathname === '/' || pathname === '/login' || pathname === '/signup'

  return (
    <div className={`marketplace-shell${showHeader ? '' : ' marketplace-shell-full-height'}`}>
      {showHeader && (
        <header className="marketplace-header">
          <h1 className="title">UniMarket</h1>
          <p className="subtitle">Buy and sell with students on your campus</p>
        </header>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/ItemPage/:id" element={<ItemPage />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <MarketplaceLayout />
    </BrowserRouter>
  )
}

export default App