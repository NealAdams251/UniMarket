import './LoginPage.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { placeholderUser } from '../../data/placeholderUser'


function Login({ setCurrentUser }) {
  const navigate = useNavigate()

  function handleLogin() {
    setCurrentUser(placeholderUser)
    navigate('/')
  }

  return (
    <div className="login-page">
      <button className="login-button" onClick={handleLogin}>Log In</button>
    </div>
  )
}

export default Login