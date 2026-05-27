import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const allowedRoles = ['receptionist', 'housekeeping', 'accountant', 'manager', 'maintenance'];
const moneyRoles = ['admin', 'accountant'];

const publicStaffFields = `id, name, email, role, phone, department, job_title, address, emergency_contact, employment_date, status, staff_pin, created_at`;
const privateStaffFields = `id, name, email, role, phone, salary, department, job_title, address, emergency_contact, employment_date, status, staff_pin, created_at`;

const canSeeAllMoney = (user) => moneyRoles.includes(user?.role);

const ensureStaffPinColumn = async () => {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_pin VARCHAR(20);`);
};

const generateStaffPin = () => String(Math.floor(100000 + Math.random() * 900000));

const getUniqueStaffPin = async () => {
  await ensureStaffPinColumn();
  for (let i = 0; i < 10; i += 1) {
    const pin = generateStaffPin();
    const exists = await pool.query('SELECT id FROM users WHERE staff_pin = $1', [pin]);
    if (!exists.rows.length) return pin;
  }
  return `${Date.now()}`.slice(-6);
};

export const createStaff = async (req, res) => {
  try {
    await ensureStaffPinColumn();

    const {
      name,
      email,
      password,
      role,
      phone,
      salary,
      department,
      job_title,
      address,
      emergency_contact,
      employment_date,
      status
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid staff role selected' });
    }

    const exists = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (exists.rows.length) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const staffPin = await getUniqueStaffPin();

    const result = await pool.query(
      `INSERT INTO users
        (name, email, password, role, phone, salary, department, job_title, address, emergency_contact, employment_date, status, staff_pin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING ${privateStaffFields}`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
        role,
        phone || null,
        Number(salary || 0),
        department || null,
        job_title || null,
        address || null,
        emergency_contact || null,
        employment_date || null,
        status || 'active',
        staffPin
      ]
    );

    res.status(201).json({ success: true, message: 'Staff login created successfully', staff: result.rows[0] });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const listStaff = async (req, res) => {
  try {
    await ensureStaffPinColumn();
    const fields = canSeeAllMoney(req.user) ? privateStaffFields : publicStaffFields;
    const result = await pool.query(
      `SELECT ${fields} FROM users WHERE role != 'admin' ORDER BY created_at DESC`
    );
    res.json({ success: true, staff: result.rows });
  } catch (error) {
    console.error('List staff error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getMyStaffProfile = async (req, res) => {
  try {
    await ensureStaffPinColumn();
    const result = await pool.query(
      `SELECT ${privateStaffFields} FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const profile = result.rows[0];
    const performance = await pool.query(
      `SELECT action_type, COUNT(*)::int AS total, COALESCE(SUM(score),0)::int AS score
       FROM staff_performance
       WHERE staff_id = $1
       GROUP BY action_type
       ORDER BY total DESC`,
      [req.user.id]
    );

    res.json({ success: true, profile, performance: performance.rows });
  } catch (error) {
    console.error('My staff profile error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateStaff = async (req, res) => {
  try {
    await ensureStaffPinColumn();
    const { id } = req.params;
    const {
      name,
      role,
      phone,
      salary,
      department,
      job_title,
      address,
      emergency_contact,
      employment_date,
      status,
      password,
      regenerate_pin
    } = req.body;

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid staff role selected' });
    }

    const current = await pool.query('SELECT * FROM users WHERE id = $1 AND role != $2', [id, 'admin']);
    if (!current.rows.length) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    let hashedPassword = current.rows[0].password;
    if (password) hashedPassword = await bcrypt.hash(password, 10);

    const nextPin = regenerate_pin ? await getUniqueStaffPin() : current.rows[0].staff_pin;

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        password = $2,
        role = COALESCE($3, role),
        phone = COALESCE($4, phone),
        salary = COALESCE($5, salary),
        department = COALESCE($6, department),
        job_title = COALESCE($7, job_title),
        address = COALESCE($8, address),
        emergency_contact = COALESCE($9, emergency_contact),
        employment_date = COALESCE($10, employment_date),
        status = COALESCE($11, status),
        staff_pin = COALESCE($12, staff_pin)
       WHERE id = $13
       RETURNING ${privateStaffFields}`,
      [
        name || null,
        hashedPassword,
        role || null,
        phone || null,
        salary === undefined ? null : Number(salary || 0),
        department || null,
        job_title || null,
        address || null,
        emergency_contact || null,
        employment_date || null,
        status || null,
        nextPin || null,
        id
      ]
    );

    res.json({ success: true, message: 'Staff account updated successfully', staff: result.rows[0] });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const staffSummary = async (req, res) => {
  try {
    if (!canSeeAllMoney(req.user) && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Not permitted' });
    }

    const staffCount = await pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE role != 'admin'`);
    const activeCount = await pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE role != 'admin' AND status = 'active'`);
    const salaryTotal = canSeeAllMoney(req.user)
      ? await pool.query(`SELECT COALESCE(SUM(salary),0)::int AS total FROM users WHERE role != 'admin' AND status = 'active'`)
      : { rows: [{ total: null }] };
    const performance = await pool.query(
      `SELECT u.id, u.name, u.role, COUNT(p.id)::int AS actions, COALESCE(SUM(p.score),0)::int AS score
       FROM users u
       LEFT JOIN staff_performance p ON p.staff_id = u.id
       WHERE u.role != 'admin'
       GROUP BY u.id, u.name, u.role
       ORDER BY score DESC, actions DESC, u.name ASC`
    );

    res.json({
      success: true,
      summary: {
        staff: staffCount.rows[0].total,
        active: activeCount.rows[0].total,
        monthlySalaryTotal: salaryTotal.rows[0].total,
        canSeeFinancials: canSeeAllMoney(req.user)
      },
      performance: performance.rows
    });
  } catch (error) {
    console.error('Staff summary error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};