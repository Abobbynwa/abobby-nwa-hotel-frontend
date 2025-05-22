import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Rooms from './pages/Rooms'
import NotFound from './pages/NotFound'
import Contact from './pages/Contact'
import RoomDetail from './pages/RoomDetail'
import About from './pages/About'
import Booking from './pages/Booking'
import Payment from './pages/Payment'
import Review from './pages/Review'

const Router = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/rooms" element={<Rooms />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="*" element={<NotFound />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/rooms/:id" element={<RoomDetail />} />
    <Route path="/about" element={<About />} />
    <Route path="/booking/:id" element={<Booking />} />
    <Route path="/payment" element={<Payment />} />
    <Route path="/review" element={<Review />} />
  </Routes>
)

export default Router
