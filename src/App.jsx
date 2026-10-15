import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home/Home'
import ItemPage from './pages/ItemPage/ItemPage'
import ProfilePage from './pages/ProfilePage/ProfilePage'
import Login from './pages/LoginPage/LoginPage'
import './App.css'

function MarketplaceLayout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [currentUser, setCurrentUser] = useState(null)

  return (
    <div className={`marketplace-shell${isHome ? '' : ' marketplace-shell-full-height'}`}>
      {isHome && (
        <header className="marketplace-header">
          <h1 className="title">UniMarket</h1>
          <p className="subtitle">Buy and sell with students on your campus</p>
        </header>
      )}
      <Routes>
        <Route path="/" element={<Home currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
        <Route path="/ItemPage/:id" element={<ItemPage />} />
        <Route path="/profile/:uid" element={<ProfilePage />} />
        <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
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