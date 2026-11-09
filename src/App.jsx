import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home/Home'
import ItemPage from './pages/ItemPage/ItemPage'
import Login from './pages/LogIn/LogIn'
import SignUp from './pages/SignUp/SignUp'
import ProfilePage from './pages/ProfilePage/ProfilePage'
import CreateListing from './pages/CreateListing/CreateListing'
import Settings from './pages/Settings/Settings'
import Messages from './pages/Messages/Messages'
import './App.css'

function MarketplaceLayout() {
  const { pathname } = useLocation()
const isAuthPage = pathname === '/login' || pathname === '/signup'
const showHeader = isAuthPage
const [currentUser, setCurrentUser] = useState(null)

  return (
    <div className={`marketplace-shell${showHeader ? '' : ' marketplace-shell-full-height'}${isAuthPage ? ' marketplace-shell-auth' : ''}`}>
      {showHeader && (
        <header className="marketplace-header">
          <h1 className="title">UNIMarket</h1>
          <p className="subtitle">One market for all your personal university needs</p>
        </header>
      )}
<Routes>
  <Route
    path="/"
    element={
      <Home
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />
    }
  />
  <Route
    path="/login"
    element={<Login setCurrentUser={setCurrentUser} />}
  />
  <Route path="/settings" element={<Settings setCurrentUser={setCurrentUser} />} />
  <Route path="/signup" element={<SignUp />} />
  <Route path="/ItemPage/:id" element={<ItemPage />} />
  <Route path="/profile/:uid" element={<ProfilePage />} />
  <Route path="/messages" element={<Messages />} />
  <Route path="/messages/:conversationId" element={<Messages />} />
  <Route path="/CreateListing" element={<CreateListing currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
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