import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => (
  <nav className="navbar">
    <h1>🏨 Abobby Nwa Hotel</h1>
    <ul>
      <li><Link to="/">Home</Link></li>
      <li><Link to="/rooms">Rooms</Link></li>
      <li><Link to="/about">About</Link></li>
      <li><Link to="/login">Login</Link></li>
      <li><Link to="/contact">Contact</Link></li>
    </ul>
  </nav>
)

export default Navbar
