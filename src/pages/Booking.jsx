import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import '../styles/booking.css'
import { getRoomById } from '../utils/roomData'

const Booking = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [room, setRoom] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    guests: 1,
    checkIn: '',
    checkOut: ''
  })

  useEffect(() => {
    AOS.init({ duration: 600 })
    const fetchedRoom = getRoomById(parseInt(id))
    if (fetchedRoom) {
      setRoom(fetchedRoom)
    } else {
      navigate('/rooms') // invalid ID
    }
  }, [id])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const start = new Date(formData.checkIn)
    const end = new Date(formData.checkOut)
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    const total = nights * room.price

    const bookingPayload = {
      ...formData,
      roomType: room.type,
      roomId: room.id,
      total,
    }

    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem(
          'bookingData',
          JSON.stringify({
            ...formData,
            room,
            total,
            reference: data.reference,
          })
        )
        alert(`Booking confirmed. Reference: ${data.reference}`)
        navigate('/review')
      } else {
        alert('Booking failed: ' + data.error)
      }
    } catch (err) {
      console.error('Booking Error:', err)
      alert('Something went wrong')
    }
  }

  if (!room) return <p className="container">Loading booking info...</p>

  return (
    <div className="container">
      <h2 className="section-title" data-aos="fade-down">📝 Book {room.name}</h2>

      <img
        src={room.images?.[0]}
        alt={room.name}
        className="booking-image"
        data-aos="zoom-in"
      />

      <form onSubmit={handleSubmit} className="booking-form" data-aos="fade-up">
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="guests"
          min={1}
          max={6}
          placeholder="Number of Guests"
          onChange={handleChange}
          required
        />
        <label>Check-in Date:</label>
        <input
          type="date"
          name="checkIn"
          onChange={handleChange}
          required
        />
        <label>Check-out Date:</label>
        <input
          type="date"
          name="checkOut"
          onChange={handleChange}
          required
        />

        <button type="submit" className="btn btn-glow">Proceed to Payment</button>
      </form>
    </div>
  )
}

export default Booking
