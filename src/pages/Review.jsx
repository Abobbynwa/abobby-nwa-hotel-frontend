import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/review.css'

const fallbackRoomImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900'

const normalizeImages = (images) => {
  if (!images) return []

  if (Array.isArray(images)) return images.filter(Boolean)

  if (typeof images === 'string') {
    const value = images.trim()
    if (!value) return []

    if (value.startsWith('data:image')) return [value]

    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed.filter(Boolean) : []
      } catch (error) {
        return []
      }
    }

    return value.split(',').map((url) => url.trim()).filter(Boolean)
  }

  return []
}

const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`

const Review = () => {
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [refId, setRefId] = useState('')

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('bookingData'))
    if (!data) return navigate('/rooms')

    const start = new Date(data.checkIn)
    const end = new Date(data.checkOut)
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
    const ref = data.reference || `ABH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    setRefId(ref)
    setBooking({ ...data, nights, total: nights * Number(data.room?.price || 0) })
  }, [navigate])

  if (!booking) return <p className="container">Fetching receipt...</p>

  const { room, fullName, email, guests, checkIn, checkOut, nights, total } = booking
  const roomImage = normalizeImages(room?.images)[0] || room?.image || fallbackRoomImage

  return (
    <div className="container review-page">
      <div className="review-hero">
        <span className="review-check">✅</span>
        <div>
          <h2>Booking Confirmed</h2>
          <p>Your reservation has been created successfully. Keep your booking reference for payment and verification.</p>
        </div>
      </div>

      <div className="review-box">
        <div className="review-image-wrap">
          <img
            src={roomImage}
            alt={room?.name || 'Hotel room'}
            className="review-img"
            onError={(event) => {
              event.currentTarget.src = fallbackRoomImage
            }}
          />
          <span className="review-room-type">{room?.type || 'Hotel Room'}</span>
        </div>

        <div className="review-summary">
          <span className="receipt-label">Booking Receipt</span>
          <h3>{room?.name || 'Selected Room'}</h3>

          <div className="receipt-grid">
            <p><strong>Reference</strong><span>{refId}</span></p>
            <p><strong>Guest</strong><span>{fullName}</span></p>
            <p><strong>Email</strong><span>{email}</span></p>
            <p><strong>Guests</strong><span>{guests}</span></p>
            <p><strong>Check-in</strong><span>{checkIn}</span></p>
            <p><strong>Check-out</strong><span>{checkOut}</span></p>
            <p><strong>Nights</strong><span>{nights}</span></p>
          </div>

          <div className="review-total">
            <span>Total Paid</span>
            <strong>{formatMoney(total)}</strong>
          </div>
        </div>
      </div>

      <div className="feedback-box">
        <div>
          <h4>📝 Want to leave feedback?</h4>
          <p>Send us a quick message about your booking or room experience.</p>
        </div>
        <Link to="/contact" className="review-feedback-btn">Send a Message</Link>
      </div>
    </div>
  )
}

export default Review
