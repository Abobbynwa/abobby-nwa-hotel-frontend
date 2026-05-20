import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import '../styles/booking.css'
import roomService from '../services/roomService'
import API from '../services/api'

const Booking = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [room, setRoom] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    guests: 1,
    checkIn: '',
    checkOut: '',
  })

  useEffect(() => {
    AOS.init({ duration: 600 })

    const fetchRoom = async () => {
      try {
        const data = await roomService.getRoom(id)
        setRoom(data.room)
      } catch (error) {
        console.error('Error loading room:', error)
        navigate('/rooms')
      }
    }

    fetchRoom()
  }, [id, navigate])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const start = new Date(formData.checkIn)
    const end = new Date(formData.checkOut)
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    if (nights <= 0) {
      alert('Check-out date must be after check-in date')
      return
    }

    const total = nights * room.price

    const bookingPayload = {
      ...formData,
      roomType: room.type,
      roomId: room.id,
      total,
    }

    try {
      setSubmitting(true)
      const { data } = await API.post('/bookings', bookingPayload)

      localStorage.setItem(
        'bookingData',
        JSON.stringify({
          ...formData,
          room,
          total,
          reference: data.reference,
        })
      )

      navigate('/payment')
    } catch (err) {
      console.error('Booking Error:', err)
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Something went wrong'
      alert('Booking failed: ' + message)
    } finally {
      setSubmitting(false)
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
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="text"
          name="nextOfKinName"
          placeholder="Next of Kin Name (Optional)"
          value={formData.nextOfKinName}
          onChange={handleChange}
        />

        <input
          type="tel"
          name="nextOfKinPhone"
          placeholder="Next of Kin Phone Number (Optional)"
          value={formData.nextOfKinPhone}
          onChange={handleChange}
        />

        <input
          type="number"
          name="guests"
          min={1}
          max={6}
          placeholder="Number of Guests"
          value={formData.guests}
          onChange={handleChange}
          required
        />

        <label>Check-in Date:</label>
        <input
          type="date"
          name="checkIn"
          value={formData.checkIn}
          onChange={handleChange}
          required
        />

        <label>Check-out Date:</label>
        <input
          type="date"
          name="checkOut"
          value={formData.checkOut}
          onChange={handleChange}
          required
        />

        <button type="submit" className="btn btn-glow" disabled={submitting}>
          {submitting ? 'Creating Booking...' : 'Proceed to Payment'}
        </button>
      </form>
    </div>
  )
}

export default Booking
