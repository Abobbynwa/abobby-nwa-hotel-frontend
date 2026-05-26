import pool from '../config/db.js';

const moneyRoles = ['admin', 'accountant'];
const allowedRoles = ['admin', 'accountant', 'manager'];

const canSeeFinancials = (user) => moneyRoles.includes(String(user?.role || '').toLowerCase());
const canManageExpenses = (user) => allowedRoles.includes(String(user?.role || '').toLowerCase());

const ensureExpenseTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount INTEGER NOT NULL,
      expense_date DATE DEFAULT CURRENT_DATE,
      note TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);`);
  await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved';`);
};

const recordPerformance = async (staffId, actionType, actionNote, score = 1) => {
  if (!staffId) return;
  await pool.query(
    `INSERT INTO staff_performance (staff_id, action_type, action_note, score)
     VALUES ($1, $2, $3, $4)`,
    [staffId, actionType, actionNote, score]
  ).catch(() => null);
};

export const createExpense = async (req, res) => {
  try {
    await ensureExpenseTables();

    if (!canManageExpenses(req.user)) {
      return res.status(403).json({ success: false, message: 'Not permitted to create expenses' });
    }

    const { title, category, amount, expense_date, note, status } = req.body;

    if (!title || !category || !amount) {
      return res.status(400).json({ success: false, message: 'Title, category, and amount are required' });
    }

    const result = await pool.query(
      `INSERT INTO expenses (title, category, amount, expense_date, note, created_by, approved_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        title.trim(),
        category.trim(),
        Number(amount),
        expense_date || new Date().toISOString().slice(0, 10),
        note || null,
        req.user.id,
        req.user.role === 'admin' || req.user.role === 'accountant' ? req.user.id : null,
        status || 'approved'
      ]
    );

    await recordPerformance(req.user.id, 'expense_created', `Created expense: ${title}`, 2);

    res.status(201).json({ success: true, message: 'Expense recorded successfully', expense: result.rows[0] });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const listExpenses = async (req, res) => {
  try {
    await ensureExpenseTables();

    if (!canManageExpenses(req.user)) {
      return res.status(403).json({ success: false, message: 'Not permitted to view expenses' });
    }

    const { category = 'all', from, to } = req.query;
    const params = [];
    const where = [];

    if (category && category !== 'all') {
      params.push(category);
      where.push(`e.category = $${params.length}`);
    }
    if (from) {
      params.push(from);
      where.push(`e.expense_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      where.push(`e.expense_date <= $${params.length}`);
    }

    const query = `
      SELECT e.*, u.name AS created_by_name, a.name AS approved_by_name
      FROM expenses e
      LEFT JOIN users u ON u.id = e.created_by
      LEFT JOIN users a ON a.id = e.approved_by
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY e.expense_date DESC, e.created_at DESC
    `;

    const result = await pool.query(query, params);
    res.json({ success: true, expenses: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('List expenses error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateExpense = async (req, res) => {
  try {
    await ensureExpenseTables();

    if (!canSeeFinancials(req.user)) {
      return res.status(403).json({ success: false, message: 'Only admin/accountant can update expenses' });
    }

    const { id } = req.params;
    const { title, category, amount, expense_date, note, status } = req.body;

    const current = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    if (!current.rows.length) return res.status(404).json({ success: false, message: 'Expense not found' });

    const old = current.rows[0];
    const result = await pool.query(
      `UPDATE expenses
       SET title=$1, category=$2, amount=$3, expense_date=$4, note=$5, status=$6, approved_by=$7
       WHERE id=$8
       RETURNING *`,
      [
        title ?? old.title,
        category ?? old.category,
        amount !== undefined ? Number(amount) : old.amount,
        expense_date ?? old.expense_date,
        note ?? old.note,
        status ?? old.status,
        req.user.id,
        id
      ]
    );

    await recordPerformance(req.user.id, 'expense_updated', `Updated expense: ${result.rows[0].title}`, 1);
    res.json({ success: true, message: 'Expense updated successfully', expense: result.rows[0] });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    await ensureExpenseTables();

    if (!canSeeFinancials(req.user)) {
      return res.status(403).json({ success: false, message: 'Only admin/accountant can delete expenses' });
    }

    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Expense not found' });

    await recordPerformance(req.user.id, 'expense_deleted', `Deleted expense: ${result.rows[0].title}`, 1);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const erpSummary = async (req, res) => {
  try {
    await ensureExpenseTables();

    if (!canManageExpenses(req.user)) {
      return res.status(403).json({ success: false, message: 'Not permitted to view ERP summary' });
    }

    const { from, to } = req.query;
    const params = [];
    const bookingWhere = [];
    const expenseWhere = [];

    if (from) {
      params.push(from);
      bookingWhere.push(`created_at::date >= $${params.length}`);
      expenseWhere.push(`expense_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      bookingWhere.push(`created_at::date <= $${params.length}`);
      expenseWhere.push(`expense_date <= $${params.length}`);
    }

    const bookingQuery = `
      SELECT
        COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'),0)::int AS confirmed_revenue,
        COALESCE(SUM(total),0)::int AS total_booking_value,
        COUNT(*)::int AS total_bookings,
        COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid_bookings,
        COUNT(*) FILTER (WHERE payment_status <> 'paid')::int AS pending_bookings
      FROM bookings
      ${bookingWhere.length ? 'WHERE ' + bookingWhere.join(' AND ') : ''}
    `;

    const expenseQuery = `
      SELECT COALESCE(SUM(amount),0)::int AS total_expenses, COUNT(*)::int AS expense_count
      FROM expenses
      ${expenseWhere.length ? 'WHERE ' + expenseWhere.join(' AND ') : ''}
    `;

    const byCategoryQuery = `
      SELECT category, COALESCE(SUM(amount),0)::int AS total, COUNT(*)::int AS count
      FROM expenses
      ${expenseWhere.length ? 'WHERE ' + expenseWhere.join(' AND ') : ''}
      GROUP BY category
      ORDER BY total DESC
    `;

    const [booking, expense, categories] = await Promise.all([
      pool.query(bookingQuery, params),
      pool.query(expenseQuery, params),
      pool.query(byCategoryQuery, params)
    ]);

    const revenue = booking.rows[0]?.confirmed_revenue || 0;
    const expenses = expense.rows[0]?.total_expenses || 0;
    const profit = revenue - expenses;

    const financialsAllowed = canSeeFinancials(req.user);

    res.json({
      success: true,
      canSeeFinancials: financialsAllowed,
      summary: {
        totalBookings: booking.rows[0]?.total_bookings || 0,
        paidBookings: booking.rows[0]?.paid_bookings || 0,
        pendingBookings: booking.rows[0]?.pending_bookings || 0,
        totalBookingValue: financialsAllowed ? booking.rows[0]?.total_booking_value || 0 : null,
        confirmedRevenue: financialsAllowed ? revenue : null,
        totalExpenses: financialsAllowed ? expenses : null,
        profitLoss: financialsAllowed ? profit : null,
        expenseCount: expense.rows[0]?.expense_count || 0
      },
      categories: financialsAllowed ? categories.rows : []
    });
  } catch (error) {
    console.error('ERP summary error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
