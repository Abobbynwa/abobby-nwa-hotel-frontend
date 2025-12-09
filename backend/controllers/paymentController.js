import axios from 'axios';
import pool from '../config/db.js';

// @desc    Initialize payment
// @route   POST /api/payments/initialize
// @access  Public
export const initializePayment = async (req, res) => {
  try {
    const { bookingReference, email, amount } = req.body;

    // Verify booking exists
    const booking = await pool.query(
      'SELECT * FROM bookings WHERE reference = $1',
      [bookingReference]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Initialize Paystack payment
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Paystack uses kobo (smallest currency unit)
        reference: `PAY-${bookingReference}`,
        callback_url: `${process.env.FRONTEND_URL}/payment/verify`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference
    });
  } catch (error) {
    console.error('Payment initialization error:', error.response?.data || error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment initialization failed',
      error: error.response?.data || error.message
    });
  }
};

// @desc    Verify payment
// @route   GET /api/payments/verify/:reference
// @access  Public
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const { status, amount, reference: paymentRef } = response.data.data;

    if (status === 'success') {
      // Extract booking reference from payment reference
      const bookingRef = paymentRef.replace('PAY-', '');

      // Update booking
      await pool.query(
        `UPDATE bookings SET payment_status = $1, status = $2, payment_reference = $3 WHERE reference = $4`,
        ['paid', 'confirmed', paymentRef, bookingRef]
      );

      res.json({
        success: true,
        status: 'success',
        amount: amount / 100,
        bookingReference: bookingRef
      });
    } else {
      res.json({
        success: false,
        status: 'failed',
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed',
      error: error.response?.data || error.message
    });
  }
};