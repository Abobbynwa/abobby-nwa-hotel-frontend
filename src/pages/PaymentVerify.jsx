import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import API from '../services/api'

const PaymentVerify = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your payment...')
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference') || searchParams.get('trxref')

      if (!reference) {
        setStatus('failed')
        setMessage('Payment reference was not found.')
        return
      }

      try {
        const res = await API.get(`/payments/verify/${reference}`)

        if (res.data?.success) {
          const storedBooking = JSON.parse(localStorage.getItem('bookingData'))
          setBooking(storedBooking)
          setStatus('success')
          setMessage('Payment verified successfully. Your booking is confirmed.')
        } else {
          setStatus('failed')
          setMessage(res.data?.message || 'Payment verification failed.')
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        setStatus('failed')
        setMessage('Unable to verify payment. Please contact support with your payment reference.')
      }
    }

    verifyPayment()
  }, [searchParams])

  return (
    <div className="container review-page">
      <h2 className="section-title">
        {status === 'verifying' && '⏳ Verifying Payment'}
        {status === 'success' && '✅ Booking Confirmed'}
        {status === 'failed' && '⚠️ Payment Verification Failed'}
      </h2>

      <div className="review-box">
        <div className="review-summary">
          <p>{message}</p>

          {booking && (
            <>
              <p><strong>Guest:</strong> {booking.fullName}</p>
              <p><strong>Email:</strong> {booking.email}</p>
              <p><strong>Reference:</strong> {booking.reference}</p>
              <p><strong>Total:</strong> ₦{Number(booking.total).toLocaleString()}</p>
            </>
          )}

          <Link to="/rooms" className="btn btn-outline">Back to Rooms</Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentVerify
