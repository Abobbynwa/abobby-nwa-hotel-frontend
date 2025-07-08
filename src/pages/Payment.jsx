import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoomById } from '../utils/roomData'
import '../styles/payment.css'

const Payment = () => {
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [method, setMethod] = useState('paystack')

  useEffect(() => {
    let data
    try {
      data = JSON.parse(localStorage.getItem('bookingData'))
    } catch {
      // corrupted data
      navigate('/rooms')
      return
    }
    if (!data) return navigate('/rooms')

    // Compute duration
    const start = new Date(data.checkIn)
    const end = new Date(data.checkOut)
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    const room = getRoomById(data.room.id)
    const total = room.price * nights

    setBooking({ ...data, room, nights, total })
  }, [navigate])

  const handlePayment = () => {
    alert(`Payment successful via ${method.toUpperCase()}!`)
    navigate('/review')
  }

  if (!booking) return <p className="container">Loading payment info...</p>

  const { room, fullName, email, guests, checkIn, checkOut, nights, total } = booking

  return (
    <div className="container">
      <h2>💳 Payment</h2>

      <div className="payment-summary">
        <img src={room.images?.[0]} alt={room.name} style={{ maxWidth: 400, borderRadius: 8 }} />
        <h3>{room.name}</h3>
        <p><strong>Guest:</strong> {fullName} ({email})</p>
        <p><strong>Guests:</strong> {guests}</p>
        <p><strong>Stay:</strong> {checkIn} → {checkOut} ({nights} nights)</p>
        <p><strong>Total:</strong> ₦{room.price} x {nights} = <b>₦{total}</b></p>
      </div>

      <div className="payment-method">
        <label>
          <input
            type="radio"
            name="method"
            value="paystack"
            checked={method === 'paystack'}
            onChange={() => setMethod('paystack')}
          />
          Paystack
        </label>
        <label>
          <input
            type="radio"
            name="method"
            value="stripe"
            checked={method === 'stripe'}
            onChange={() => setMethod('stripe')}
          />
          Stripe
        </label>
      </div>

      <button className="btn btn-glow" onClick={handlePayment}>
        Pay Now with {method.toUpperCase()}
      </button>
    </div>
  )
}

export default Payment
