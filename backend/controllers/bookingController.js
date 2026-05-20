import pool from '../config/db.js';

const generateReference = () => {
  return `ABH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

const ensureGuestColumns = async () => {
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`);
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gender VARCHAR(50);`);
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS next_of_kin_name VARCHAR(255);`);
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS next_of_kin_phone VARCHAR(50);`);
};

export const createBooking = async (req, res) => {
  try {
    await ensureGuestColumns();

    const {
      fullName,
      email,
      phone,
      gender,
      nextOfKinName,
      nextOfKinPhone,
      roomId,
      roomType,
      checkIn,
      checkOut,
      guests,
      total
    } = req.body;

    const reference = generateReference();

    const result = await pool.query(
      `INSERT INTO bookings (
        reference,
        full_name,
        email,
        phone,
        gender,
        next_of_kin_name,
        next_of_kin_phone,
        room_id,
        room_type,
        check_in,
        check_out,
        guests,
        total
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        reference,
        fullName,
        email,
        phone,
        gender,
        nextOfKinName || null,
        nextOfKinPhone || null,
        roomId,
        roomType,
        checkIn,
        checkOut,
        guests,
        total
      ]
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

export const getBookings = async (req, res) => {
  try {
    await ensureGuestColumns();

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

export const getBooking = async (req, res) => {
  try {
    await ensureGuestColumns();

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

export const submitTransferProof = async (req, res) => {
  try {
    const { reference, paymentProof, paymentNote } = req.body;

    if (!reference || !paymentProof) {
      return res.status(400).json({
        success: false,
        message: 'Booking reference and payment proof are required'
      });
    }

    const result = await pool.query(
      `UPDATE bookings
       SET payment_method = $1,
           payment_status = $2,
           status = $3,
           transfer_bank = $4,
           transfer_account_name = $5,
           transfer_account_number = $6,
           payment_proof = $7,
           payment_note = $8
       WHERE reference = $9
       RETURNING *`,
      [
        'bank_transfer',
        'pending_review',
        'pending',
        'Opay / Palmpay / Moniepoint',
        'Valentine Agaba',
        '8149642220',
        paymentProof,
        paymentNote || '',
        reference
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({
      success: true,
      message: 'Transfer proof submitted successfully. Admin will review your payment.',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Submit transfer proof error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};