import pool from '../config/db.js';

const viewRoles = ['admin', 'accountant', 'manager', 'housekeeping', 'maintenance'];
const manageRoles = ['admin', 'manager'];
const issueRoles = ['admin', 'manager', 'housekeeping', 'maintenance'];

const hasViewAccess = (user) => viewRoles.includes(String(user?.role || '').toLowerCase());
const hasManageAccess = (user) => manageRoles.includes(String(user?.role || '').toLowerCase());
const hasIssueAccess = (user) => issueRoles.includes(String(user?.role || '').toLowerCase());

const ensureInventoryTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      unit VARCHAR(50) DEFAULT 'pcs',
      quantity INTEGER DEFAULT 0,
      minimum_stock INTEGER DEFAULT 0,
      location VARCHAR(150),
      note TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id SERIAL PRIMARY KEY,
      item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
      movement_type VARCHAR(50) NOT NULL,
      quantity INTEGER NOT NULL,
      previous_quantity INTEGER DEFAULT 0,
      new_quantity INTEGER DEFAULT 0,
      reason VARCHAR(255),
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const recordPerformance = async (staffId, actionType, actionNote, score = 1) => {
  if (!staffId) return;
  await pool.query(
    `INSERT INTO staff_performance (staff_id, action_type, action_note, score)
     VALUES ($1, $2, $3, $4)`,
    [staffId, actionType, actionNote, score]
  ).catch(() => null);
};

export const createInventoryItem = async (req, res) => {
  try {
    await ensureInventoryTables();

    if (!hasManageAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Only admin/manager can create inventory items' });
    }

    const { name, category, unit, quantity, minimum_stock, location, note, status } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Item name and category are required' });
    }

    const qty = Number(quantity || 0);
    const result = await pool.query(
      `INSERT INTO inventory_items (name, category, unit, quantity, minimum_stock, location, note, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        name.trim(),
        category.trim(),
        unit || 'pcs',
        qty,
        Number(minimum_stock || 0),
        location || null,
        note || null,
        status || 'active',
        req.user.id
      ]
    );

    if (qty > 0) {
      await pool.query(
        `INSERT INTO inventory_movements (item_id, movement_type, quantity, previous_quantity, new_quantity, reason, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [result.rows[0].id, 'stock_in', qty, 0, qty, 'Opening stock', req.user.id]
      );
    }

    await recordPerformance(req.user.id, 'inventory_item_created', `Created inventory item: ${name}`, 2);
    res.status(201).json({ success: true, message: 'Inventory item created successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const listInventoryItems = async (req, res) => {
  try {
    await ensureInventoryTables();

    if (!hasViewAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Not permitted to view inventory' });
    }

    const { category = 'all', status = 'all', search = '' } = req.query;
    const params = [];
    const where = [];

    if (category && category !== 'all') {
      params.push(category);
      where.push(`i.category = $${params.length}`);
    }
    if (status && status !== 'all') {
      params.push(status);
      where.push(`i.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(`(i.name ILIKE $${params.length} OR i.category ILIKE $${params.length} OR i.location ILIKE $${params.length})`);
    }

    const result = await pool.query(
      `SELECT i.*, u.name AS created_by_name,
        CASE WHEN i.quantity <= i.minimum_stock THEN true ELSE false END AS low_stock
       FROM inventory_items i
       LEFT JOIN users u ON u.id = i.created_by
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY low_stock DESC, i.category ASC, i.name ASC`,
      params
    );

    res.json({ success: true, count: result.rows.length, items: result.rows });
  } catch (error) {
    console.error('List inventory error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    await ensureInventoryTables();

    if (!hasManageAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Only admin/manager can update inventory items' });
    }

    const { id } = req.params;
    const { name, category, unit, minimum_stock, location, note, status } = req.body;

    const current = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
    if (!current.rows.length) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    const old = current.rows[0];
    const result = await pool.query(
      `UPDATE inventory_items
       SET name=$1, category=$2, unit=$3, minimum_stock=$4, location=$5, note=$6, status=$7, updated_at=CURRENT_TIMESTAMP
       WHERE id=$8
       RETURNING *`,
      [
        name ?? old.name,
        category ?? old.category,
        unit ?? old.unit,
        minimum_stock !== undefined ? Number(minimum_stock || 0) : old.minimum_stock,
        location ?? old.location,
        note ?? old.note,
        status ?? old.status,
        id
      ]
    );

    await recordPerformance(req.user.id, 'inventory_item_updated', `Updated inventory item: ${result.rows[0].name}`, 1);
    res.json({ success: true, message: 'Inventory item updated successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const moveInventoryStock = async (req, res) => {
  try {
    await ensureInventoryTables();

    if (!hasIssueAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Not permitted to move inventory stock' });
    }

    const { id } = req.params;
    const { movement_type, quantity, reason } = req.body;
    const movement = String(movement_type || '').toLowerCase();
    const qty = Number(quantity || 0);

    if (!['stock_in', 'stock_out', 'adjustment'].includes(movement)) {
      return res.status(400).json({ success: false, message: 'Movement type must be stock_in, stock_out, or adjustment' });
    }
    if (!qty || qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
    }

    const current = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
    if (!current.rows.length) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    const item = current.rows[0];
    const previous = Number(item.quantity || 0);
    let next = previous;

    if (movement === 'stock_in') next = previous + qty;
    if (movement === 'stock_out') next = previous - qty;
    if (movement === 'adjustment') next = qty;

    if (next < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot go below zero' });
    }

    const updated = await pool.query(
      `UPDATE inventory_items SET quantity=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *`,
      [next, id]
    );

    await pool.query(
      `INSERT INTO inventory_movements (item_id, movement_type, quantity, previous_quantity, new_quantity, reason, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, movement, qty, previous, next, reason || null, req.user.id]
    );

    await recordPerformance(req.user.id, `inventory_${movement}`, `${movement} ${qty} ${item.unit || ''} for ${item.name}`, 2);
    res.json({ success: true, message: 'Inventory stock updated successfully', item: updated.rows[0] });
  } catch (error) {
    console.error('Move inventory stock error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deleteInventoryItem = async (req, res) => {
  try {
    await ensureInventoryTables();

    if (!hasManageAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Only admin/manager can delete inventory items' });
    }

    const result = await pool.query('DELETE FROM inventory_items WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    await recordPerformance(req.user.id, 'inventory_item_deleted', `Deleted inventory item: ${result.rows[0].name}`, 1);
    res.json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const inventoryMovements = async (req, res) => {
  try {
    await ensureInventoryTables();

    if (!hasViewAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Not permitted to view inventory movements' });
    }

    const result = await pool.query(
      `SELECT m.*, i.name AS item_name, i.category, i.unit, u.name AS created_by_name
       FROM inventory_movements m
       LEFT JOIN inventory_items i ON i.id = m.item_id
       LEFT JOIN users u ON u.id = m.created_by
       ORDER BY m.created_at DESC
       LIMIT 100`
    );

    res.json({ success: true, movements: result.rows });
  } catch (error) {
    console.error('Inventory movements error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const inventorySummary = async (req, res) => {
  try {
    await ensureInventoryTables();

    if (!hasViewAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Not permitted to view inventory summary' });
    }

    const summary = await pool.query(`
      SELECT
        COUNT(*)::int AS total_items,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_items,
        COUNT(*) FILTER (WHERE quantity <= minimum_stock)::int AS low_stock_items,
        COALESCE(SUM(quantity),0)::int AS total_quantity
      FROM inventory_items
    `);

    const byCategory = await pool.query(`
      SELECT category, COUNT(*)::int AS items, COALESCE(SUM(quantity),0)::int AS quantity
      FROM inventory_items
      GROUP BY category
      ORDER BY items DESC, category ASC
    `);

    const lowStock = await pool.query(`
      SELECT id, name, category, unit, quantity, minimum_stock
      FROM inventory_items
      WHERE quantity <= minimum_stock
      ORDER BY quantity ASC, name ASC
      LIMIT 20
    `);

    res.json({ success: true, summary: summary.rows[0], categories: byCategory.rows, lowStock: lowStock.rows });
  } catch (error) {
    console.error('Inventory summary error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
