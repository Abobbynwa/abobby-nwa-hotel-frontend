import pool from '../config/db.js';

// Generate booking reference
const generateReference = () => {
  return `ABH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Public
export const createBooking = async (req, res) => {
  try {
    const { fullName, email, roomId, roomType, checkIn, checkOut, guests, total } = req.body;

    const reference = generateReference();

    const result = await pool.query(
      `INSERT INTO bookings (reference, full_name, email, room_id, room_type, check_in, check_out, guests, total) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [reference, fullName, email, roomId, roomType, checkIn, checkOut, guests, total]
    );

    res.status(201).json({
      success: true,
      reference,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Private/Admin
export const getBookings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, r.name as room_name, r.type as room_type, r.images as room_images
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      bookings: result.rows
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get booking by reference
// @route   GET /api/bookings/:reference
// @access  Public
export const getBooking = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE reference = $1',
      [req.params.reference]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({
      success: true,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update booking status
// @route   PATCH /api/bookings/:id
// @access  Private/Admin
export const updateBooking = async (req, res) => {
  try {
    const { status, payment_status } = req.body;

    const result = await pool.query(
      `UPDATE bookings SET status = $1, payment_status = $2 WHERE id = $3 RETURNING *`,
      [status, payment_status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({
      success: true,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};