import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import NotFound from './pages/NotFound'
import Contact from './pages/Contact'
import RoomDetail from './pages/RoomDetail'
import About from './pages/About'
import Booking from './pages/Booking'
import Payment from './pages/Payment'
import PaymentVerify from './pages/PaymentVerify'
import Review from './pages/Review'

const Router = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/rooms" element={<Rooms />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/rooms/:id" element={<RoomDetail />} />
    <Route path="/about" element={<About />} />
    <Route path="/booking/:id" element={<Booking />} />
    <Route path="/payment" element={<Payment />} />
    <Route path="/payment/verify" element={<PaymentVerify />} />
    <Route path="/review" element={<Review />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
)

export default Router
