import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import Home from './pages/Home/Home'
import ItemPage from './pages/ItemPage/ItemPage'

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (   
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ItemPage/:id" element={<ItemPage />} />
      </Routes>
    </BrowserRouter>
    )
}

export default App
