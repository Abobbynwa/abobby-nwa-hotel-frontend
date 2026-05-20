import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import '../styles/payment.css';

const BANK_DETAILS = {
  accountNumber: '8149642220',
  accountName: 'Valentine Agaba',
  banks: 'Opay, Palmpay, Moniepoint'
};

const Payment = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [paymentProof, setPaymentProof] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('bookingData'));
    if (!data) return navigate('/rooms');

    const start = new Date(data.checkIn);
    const end = new Date(data.checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const total = data.room.price * nights;

    setBooking({ ...data, nights, total });
  }, [navigate]);

  const handlePaystackPayment = async () => {
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

  const handleProofUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 900000) {
      alert('Evidence image is too large. Please upload an image below 900KB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPaymentProof(reader.result);
    reader.readAsDataURL(file);
  };

  const handleTransferSubmit = async () => {
    if (!paymentProof) {
      alert('Please upload payment evidence before submitting.');
      return;
    }

    try {
      setProcessing(true);

      const res = await API.post('/bookings/transfer-proof', {
        reference: booking.reference,
        paymentProof,
        paymentNote
      });

      if (res.data.success) {
        localStorage.setItem('bookingData', JSON.stringify({
          ...booking,
          paymentMethod: 'bank_transfer',
          paymentStatus: 'pending_review'
        }));
        alert('Payment evidence submitted successfully. Admin will review and confirm your booking.');
        navigate('/review');
      } else {
        alert(res.data.message || 'Unable to submit payment evidence.');
      }
    } catch (error) {
      console.error('Transfer proof error:', error);
      const message = error.response?.data?.message || error.message || 'Unable to submit evidence.';
      alert('Transfer evidence failed: ' + message);
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
        <p><strong>Booking Reference:</strong> {booking.reference}</p>
        <p><strong>Total:</strong> ₦{room.price.toLocaleString()} x {nights} = <b>₦{total.toLocaleString()}</b></p>
      </div>

      <div className="payment-summary" style={{ marginTop: 20 }}>
        <h3>Choose Payment Method</h3>
        <label style={{ display: 'block', marginBottom: 10 }}>
          <input
            type="radio"
            name="paymentMethod"
            value="transfer"
            checked={paymentMethod === 'transfer'}
            onChange={() => setPaymentMethod('transfer')}
          />{' '}
          Bank Transfer / Opay / Palmpay / Moniepoint
        </label>
        <label style={{ display: 'block' }}>
          <input
            type="radio"
            name="paymentMethod"
            value="paystack"
            checked={paymentMethod === 'paystack'}
            onChange={() => setPaymentMethod('paystack')}
          />{' '}
          Paystack Online Payment
        </label>
      </div>

      {paymentMethod === 'transfer' && (
        <div className="payment-summary" style={{ marginTop: 20 }}>
          <h3>Bank Transfer Details</h3>
          <p><strong>Account Number:</strong> {BANK_DETAILS.accountNumber}</p>
          <p><strong>Bank Name:</strong> {BANK_DETAILS.banks}</p>
          <p><strong>Account Name:</strong> {BANK_DETAILS.accountName}</p>
          <p><strong>Amount:</strong> ₦{total.toLocaleString()}</p>
          <p><strong>Use your booking reference as narration:</strong> {booking.reference}</p>

          <label><strong>Upload Payment Evidence</strong></label>
          <input type="file" accept="image/*" onChange={handleProofUpload} />

          {paymentProof && (
            <div style={{ marginTop: 12 }}>
              <img src={paymentProof} alt="Payment proof preview" style={{ maxWidth: 260, borderRadius: 8 }} />
            </div>
          )}

          <label style={{ display: 'block', marginTop: 12 }}><strong>Optional Note</strong></label>
          <textarea
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder="Example: I transferred from my Opay account by 2:30pm"
            rows={4}
            style={{ width: '100%', padding: 10, borderRadius: 8 }}
          />

          <button
            className="btn btn-glow"
            onClick={handleTransferSubmit}
            disabled={processing}
            style={{ marginTop: 12 }}
          >
            {processing ? 'Submitting Evidence...' : 'Submit Transfer Evidence'}
          </button>
        </div>
      )}

      {paymentMethod === 'paystack' && (
        <button
          className="btn btn-glow"
          onClick={handlePaystackPayment}
          disabled={processing}
          style={{ marginTop: 20 }}
        >
          {processing ? 'Processing...' : 'Pay with Paystack'}
        </button>
      )}
    </div>
  );
};

export default Payment;
