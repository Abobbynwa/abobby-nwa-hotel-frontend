import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/review.css'

const Review = () => {
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [refId, setRefId] = useState('')

  useEffect(() => {
    let data
    try {
      data = JSON.parse(localStorage.getItem('bookingData'))
    } catch {
      navigate('/rooms')
      return
    }
    if (!data) return navigate('/rooms')

    // Calculate nights
    const start = new Date(data.checkIn)
    const end = new Date(data.checkOut)
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    // Generate reference ID
    const ref = `ABH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    setRefId(ref)
    setBooking({ ...data, nights, total: nights * data.room.price })
  }, [navigate])

  if (!booking) return <p className="container">Fetching receipt...</p>

  const { room, fullName, email, guests, checkIn, checkOut, nights, total } = booking

  return (
    <div className="container review-page">
      <h2 className="section-title">✅ Booking Confirmed!</h2>

      <div className="review-box">
        <img src={room.images?.[0]} alt={room.name} className="review-img" />

        <div className="review-summary">
          <h3>{room.name}</h3>
          <p><strong>Reference:</strong> {refId}</p>
          <p><strong>Guest:</strong> {fullName}</p>
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Guests:</strong> {guests}</p>
          <p><strong>Stay:</strong> {checkIn} → {checkOut}</p>
          <p><strong>Nights:</strong> {nights}</p>
          <p><strong>Total Paid:</strong> ₦{total}</p>
        </div>
      </div>

      <div className="feedback-box">
        <h4>📝 Want to leave a feedback?</h4>
        <a href="/contact" className="btn btn-outline">Send a Message</a>
      </div>
    </div>
  )
}

export default Review
