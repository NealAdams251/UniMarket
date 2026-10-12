import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home/Home'
import ItemPage from './pages/ItemPage/ItemPage'
import './App.css'

function MarketplaceLayout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className={`marketplace-shell${isHome ? '' : ' marketplace-shell-full-height'}`}>
      {isHome && (
        <header className="marketplace-header">
          <h1 className="title">UniMarket</h1>
          <p className="subtitle">Buy and sell with students on your campus</p>
        </header>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
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