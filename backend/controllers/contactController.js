import pool from '../config/db.js';
import { sendContactEmails, sendContactReplyEmail } from '../utils/emailService.js';

const ensureContactTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      subject VARCHAR(255),
      message TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'new',
      admin_reply TEXT,
      replied_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const sendContactMessage = async (req, res) => {
  try {
    await ensureContactTable();

    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, phone || null, subject || 'Contact Message', message]
    );

    let emailStatus = { adminSent: false, customerSent: false };

    try {
      emailStatus = await sendContactEmails({
        name,
        email,
        phone,
        subject: subject || 'Contact Message',
        message
      });
    } catch (emailError) {
      console.error('Contact email error:', emailError.message);
      emailStatus = { adminSent: false, customerSent: false, reason: emailError.message };
    }

    return res.status(201).json({
      success: true,
      message: 'Message received successfully. A confirmation has been sent to your email if email service is active.',
      contact: result.rows[0],
      emailStatus
    });
  } catch (error) {
    console.error('Contact message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to process contact message',
      error: error.message
    });
  }
};

export const getContactMessages = async (req, res) => {
  try {
    await ensureContactTable();

    const result = await pool.query(
      `SELECT * FROM contact_messages ORDER BY created_at DESC`
    );

    return res.json({
      success: true,
      count: result.rows.length,
      messages: result.rows
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch contact messages',
      error: error.message
    });
  }
};

export const replyContactMessage = async (req, res) => {
  try {
    await ensureContactTable();

    const contactId = Number(req.params.id);
    const { replyMessage } = req.body;

    if (!Number.isInteger(contactId) || contactId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid contact message ID' });
    }

    if (!replyMessage) {
      return res.status(400).json({ success: false, message: 'Reply message is required' });
    }

    const existing = await pool.query('SELECT * FROM contact_messages WHERE id = $1', [contactId]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }

    let emailStatus = { sent: false };

    try {
      emailStatus = await sendContactReplyEmail({
        to: existing.rows[0].email,
        name: existing.rows[0].name,
        replyMessage
      });
    } catch (emailError) {
      console.error('Contact reply email error:', emailError.message);
      emailStatus = { sent: false, reason: emailError.message };
    }

    const result = await pool.query(
      `UPDATE contact_messages
       SET admin_reply = $1,
           status = $2,
           replied_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [replyMessage, 'replied', contactId]
    );

    return res.json({
      success: true,
      message: 'Reply saved and email sent if email service is active.',
      contact: result.rows[0],
      emailStatus
    });
  } catch (error) {
    console.error('Reply contact message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to reply contact message',
      error: error.message
    });
  }
};
