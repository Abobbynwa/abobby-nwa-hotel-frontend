import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const fakeRoomData = {
  1: { id: 1, name: 'Deluxe Room', price: 120, image: 'https://source.unsplash.com/600x400/?hotel,room' },
  2: { id: 2, name: 'Executive Suite', price: 180, image: 'https://source.unsplash.com/600x400/?luxury,suite' }
}

const Booking = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [room, setRoom] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    guests: 1,
    checkIn: '',
    checkOut: ''
  })

  useEffect(() => {
    if (!user) {
      navigate(`/login?redirect=/booking/${id}`)
      return
    }

    setRoom(fakeRoomData[id])
    setFormData({ ...formData, fullName: user.name, email: user.email })
  }, [id, user])

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = e => {
    e.preventDefault()
    localStorage.setItem('bookingData', JSON.stringify({ ...formData, room }))
    navigate('/payment')
  }

  if (!room) return <p className="container">Loading booking info...</p>

  return (
    <div className="container">
      <h2>📝 Book {room.name}</h2>
      <img src={room.image} alt={room.name} style={{ maxWidth: '500px', borderRadius: '8px' }} />

      <form onSubmit={handleSubmit} className="booking-form">
        <input type="text" name="fullName" value={formData.fullName} placeholder="Full Name" onChange={handleChange} required />
        <input type="email" name="email" value={formData.email} placeholder="Email Address" onChange={handleChange} required />
        <input type="number" name="guests" placeholder="Number of Guests" min={1} max={6} onChange={handleChange} required />
        <label>Check-in Date:</label>
        <input type="date" name="checkIn" onChange={handleChange} required />
        <label>Check-out Date:</label>
        <input type="date" name="checkOut" onChange={handleChange} required />

        <button type="submit" className="btn btn-glow">Proceed to Payment</button>
      </form>
    </div>
  )
}

export default Booking
