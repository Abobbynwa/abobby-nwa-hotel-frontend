import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Payment = () => {
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [method, setMethod] = useState('paystack') // or 'stripe'

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('bookingData'))
    if (!data) return navigate('/rooms')
    setBooking(data)
  }, [])

  const handlePayment = () => {
    // Mock payment success
    alert(`Payment successful via ${method.toUpperCase()}!`)
    navigate('/review')
  }

  if (!booking) return <p className="container">Loading payment info...</p>

  const { room, fullName, email, guests, checkIn, checkOut } = booking

  return (
    <div className="container">
      <h2>💳 Payment</h2>

      <div className="payment-summary">
        <img src={room.image} alt={room.name} style={{ width: '100%', maxWidth: 400, borderRadius: 8 }} />
        <h3>{room.name}</h3>
        <p><strong>Guest:</strong> {fullName} ({email})</p>
        <p><strong>Guests:</strong> {guests}</p>
        <p><strong>Stay:</strong> {checkIn} → {checkOut}</p>
        <p><strong>Total:</strong> ${room.price} / night</p>
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
