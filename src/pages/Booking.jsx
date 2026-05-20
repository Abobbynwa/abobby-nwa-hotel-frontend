import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import '../styles/booking.css'
import roomService from '../services/roomService'
import API from '../services/api'

const COUNTRY_CODES = [
  { country: 'Nigeria', code: '+234' },
  { country: 'Switzerland', code: '+41' },
  { country: 'United States', code: '+1' },
  { country: 'United Kingdom', code: '+44' },
  { country: 'Canada', code: '+1' },
  { country: 'Ghana', code: '+233' },
  { country: 'South Africa', code: '+27' },
  { country: 'Kenya', code: '+254' },
  { country: 'United Arab Emirates', code: '+971' },
  { country: 'Saudi Arabia', code: '+966' },
  { country: 'Germany', code: '+49' },
  { country: 'France', code: '+33' },
  { country: 'Italy', code: '+39' },
  { country: 'Spain', code: '+34' },
  { country: 'India', code: '+91' },
  { country: 'China', code: '+86' },
  { country: 'Australia', code: '+61' },
  { country: 'Brazil', code: '+55' }
]

const Booking = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [room, setRoom] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneCountryCode: '+234',
    phone: '',
    gender: '',
    nextOfKinName: '',
    nextOfKinCountryCode: '+234',
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

  const cleanPhone = (phone) => phone.replace(/^0+/, '').replace(/\s+/g, '')

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
    const fullPhone = `${formData.phoneCountryCode}${cleanPhone(formData.phone)}`
    const fullNextOfKinPhone = formData.nextOfKinPhone
      ? `${formData.nextOfKinCountryCode}${cleanPhone(formData.nextOfKinPhone)}`
      : ''

    const bookingPayload = {
      ...formData,
      phone: fullPhone,
      nextOfKinPhone: fullNextOfKinPhone,
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
          phone: fullPhone,
          nextOfKinPhone: fullNextOfKinPhone,
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

        <div style={{ display: 'flex', gap: 8 }}>
          <select
            name="phoneCountryCode"
            value={formData.phoneCountryCode}
            onChange={handleChange}
            required
            style={{ maxWidth: 170 }}
          >
            {COUNTRY_CODES.map((item) => (
              <option key={`${item.country}-${item.code}`} value={item.code}>
                {item.country} {item.code}
              </option>
            ))}
          </select>

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

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

        <div style={{ display: 'flex', gap: 8 }}>
          <select
            name="nextOfKinCountryCode"
            value={formData.nextOfKinCountryCode}
            onChange={handleChange}
            style={{ maxWidth: 170 }}
          >
            {COUNTRY_CODES.map((item) => (
              <option key={`nok-${item.country}-${item.code}`} value={item.code}>
                {item.country} {item.code}
              </option>
            ))}
          </select>

          <input
            type="tel"
            name="nextOfKinPhone"
            placeholder="Next of Kin Phone Number (Optional)"
            value={formData.nextOfKinPhone}
            onChange={handleChange}
          />
        </div>

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
