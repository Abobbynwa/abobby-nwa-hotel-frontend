import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import '../styles/payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('bookingData'));
    if (!data) return navigate('/rooms');

    const start = new Date(data.checkIn);
    const end = new Date(data.checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const total = data.room.price * nights;

    setBooking({ ...data, nights, total });
  }, [navigate]);

  const handlePayment = async () => {
    try {
      setProcessing(true);

      const res = await API.post('/payments/initialize', {
        bookingReference: booking.reference,
        email: booking.email,
        amount: booking.total
      });

      if (res.data.success && res.data.authorizationUrl) {
        window.location.href = res.data.authorizationUrl;
      } else {
        alert(res.data.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const message = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Payment failed. Please try again.';
      alert('Payment failed: ' + message);
    } finally {
      setProcessing(false);
    }
  };

  if (!booking) return <p className="container">Loading payment info...</p>;

  const { room, fullName, email, guests, checkIn, checkOut, nights, total } = booking;

  return (
    <div className="container">
      <h2>💳 Payment</h2>

      <div className="payment-summary">
        <img src={room.images?.[0]} alt={room.name} style={{ maxWidth: 400, borderRadius: 8 }} />
        <h3>{room.name}</h3>
        <p><strong>Guest:</strong> {fullName} ({email})</p>
        <p><strong>Guests:</strong> {guests}</p>
        <p><strong>Stay:</strong> {checkIn} → {checkOut} ({nights} nights)</p>
        <p><strong>Total:</strong> ₦{room.price.toLocaleString()} x {nights} = <b>₦{total.toLocaleString()}</b></p>
      </div>

      <button
        className="btn btn-glow"
        onClick={handlePayment}
        disabled={processing}
      >
        {processing ? 'Processing...' : 'Pay with Paystack'}
      </button>
    </div>
  );
};

export default Payment;
