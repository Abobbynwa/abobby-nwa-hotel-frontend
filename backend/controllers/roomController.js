import pool from '../config/db.js';

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
export const getRooms = async (req, res) => {
  try {
    const { type, maxPrice } = req.query;
    
    let query = 'SELECT * FROM rooms WHERE available = true';
    const params = [];
    let paramCount = 1;

    if (type && type !== 'all') {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (maxPrice) {
      query += ` AND price <= $${paramCount}`;
      params.push(parseInt(maxPrice));
    }

    query += ' ORDER BY price ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      rooms: result.rows
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
export const getRoom = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({
      success: true,
      room: result.rows[0]
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create room (Admin only)
// @route   POST /api/rooms
// @access  Private/Admin
export const createRoom = async (req, res) => {
  try {
    const { name, type, price, capacity, description, amenities, images } = req.body;

    const result = await pool.query(
      `INSERT INTO rooms (name, type, price, capacity, description, amenities, images) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, type, price, capacity, description, amenities, images]
    );

    res.status(201).json({
      success: true,
      room: result.rows[0]
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update room (Admin only)
// @route   PUT /api/rooms/:id
// @access  Private/Admin
export const updateRoom = async (req, res) => {
  try {
    const { name, type, price, capacity, description, amenities, images, available } = req.body;

    const result = await pool.query(
      `UPDATE rooms SET name = $1, type = $2, price = $3, capacity = $4, 
       description = $5, amenities = $6, images = $7, available = $8
       WHERE id = $9 RETURNING *`,
      [name, type, price, capacity, description, amenities, images, available, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({
      success: true,
      room: result.rows[0]
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete room (Admin only)
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
export const deleteRoom = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};