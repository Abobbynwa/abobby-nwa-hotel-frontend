import pool from '../config/db.js';
import { sendContactEmails, sendContactReplyEmail, sendAdminDirectEmail } from '../utils/emailService.js';

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

  await pool.query(`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`);
};

const normalizeEmailStatus = (value) => value || { sent: false, reason: 'not_attempted' };

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
      `INSERT INTO contact_messages (name, email, phone, subject, message, is_deleted)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING *`,
      [name, email, phone || null, subject || 'Contact Message', message]
    );

    let emailStatus = { adminSent: false, customerSent: false, errors: [] };

    try {
      emailStatus = await sendContactEmails({
        name,
        email,
        phone,
        subject: subject || 'Contact Message',
        message
      });
      console.log('Contact email status:', emailStatus);
    } catch (emailError) {
      console.error('Contact email error:', emailError.message);
      emailStatus = { adminSent: false, customerSent: false, errors: [emailError.message] };
    }

    res.status(201).json({
      success: true,
      message: emailStatus.customerSent
        ? 'Message received successfully. Confirmation email sent.'
        : 'Message saved, but confirmation email was not delivered. Check Render logs/email config.',
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

    const trash = String(req.query.trash || '').toLowerCase() === 'true';

    const result = await pool.query(
      `SELECT * FROM contact_messages
       WHERE COALESCE(is_deleted, FALSE) = $1
       ORDER BY ${trash ? 'deleted_at DESC NULLS LAST, created_at DESC' : 'created_at DESC'}`,
      [trash]
    );

    const counts = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(is_deleted, FALSE) = FALSE) AS inbox,
        COUNT(*) FILTER (WHERE COALESCE(is_deleted, FALSE) = TRUE) AS trash,
        COUNT(*) FILTER (WHERE COALESCE(is_deleted, FALSE) = FALSE AND COALESCE(status, 'new') = 'new') AS new,
        COUNT(*) FILTER (WHERE COALESCE(is_deleted, FALSE) = FALSE AND status = 'replied') AS replied
      FROM contact_messages
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      trash,
      counts: counts.rows[0] || {},
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

    const existing = await pool.query(
      'SELECT * FROM contact_messages WHERE id = $1 AND COALESCE(is_deleted, FALSE) = FALSE',
      [contactId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact message not found or is in trash' });
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

    let emailStatus = { sent: false };

    try {
      emailStatus = await sendContactReplyEmail({
        to: existing.rows[0].email,
        name: existing.rows[0].name,
        replyMessage
      });
      console.log('Contact reply email status:', emailStatus);
    } catch (emailError) {
      console.error('Contact reply email error:', emailError.message);
      emailStatus = { sent: false, reason: emailError.message };
    }

    res.json({
      success: true,
      message: emailStatus.sent
        ? 'Reply saved and email sent successfully.'
        : 'Reply saved, but email was not delivered. Check Render logs/email config.',
      contact: result.rows[0],
      emailStatus: normalizeEmailStatus(emailStatus)
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

export const sendAdminMessage = async (req, res) => {
  try {
    await ensureContactTable();

    const { name, email, subject, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Customer email and message are required'
      });
    }

    const safeName = name || 'Guest';
    const safeSubject = subject || 'Message from Abobby Nwa Hotel & Suites';

    const result = await pool.query(
      `INSERT INTO contact_messages (name, email, phone, subject, message, status, admin_reply, replied_at, is_deleted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, FALSE)
       RETURNING *`,
      [safeName, email, null, safeSubject, 'Admin direct message', 'replied', message]
    );

    let emailStatus = { sent: false };

    try {
      emailStatus = await sendAdminDirectEmail({
        to: email,
        name: safeName,
        subject: safeSubject,
        message
      });
      console.log('Admin direct email status:', emailStatus);
    } catch (emailError) {
      console.error('Admin direct email error:', emailError.message);
      emailStatus = { sent: false, reason: emailError.message };
    }

    res.status(201).json({
      success: true,
      message: emailStatus.sent
        ? 'Admin message saved and email sent successfully.'
        : 'Admin message saved, but email was not delivered. Check Render logs/email config.',
      contact: result.rows[0],
      emailStatus: normalizeEmailStatus(emailStatus)
    });
  } catch (error) {
    console.error('Admin direct message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to send admin message',
      error: error.message
    });
  }
};

export const moveContactToTrash = async (req, res) => {
  try {
    await ensureContactTable();
    const contactId = Number(req.params.id);

    if (!Number.isInteger(contactId) || contactId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid contact message ID' });
    }

    const result = await pool.query(
      `UPDATE contact_messages
       SET is_deleted = TRUE,
           deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [contactId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }

    return res.json({ success: true, message: 'Message moved to Trash', contact: result.rows[0] });
  } catch (error) {
    console.error('Move contact to trash error:', error);
    return res.status(500).json({ success: false, message: 'Unable to move message to Trash', error: error.message });
  }
};

export const restoreContactFromTrash = async (req, res) => {
  try {
    await ensureContactTable();
    const contactId = Number(req.params.id);

    if (!Number.isInteger(contactId) || contactId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid contact message ID' });
    }

    const result = await pool.query(
      `UPDATE contact_messages
       SET is_deleted = FALSE,
           deleted_at = NULL,
           status = CASE WHEN admin_reply IS NOT NULL AND admin_reply <> '' THEN 'replied' ELSE 'new' END
       WHERE id = $1
       RETURNING *`,
      [contactId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }

    return res.json({ success: true, message: 'Message restored from Trash', contact: result.rows[0] });
  } catch (error) {
    console.error('Restore contact error:', error);
    return res.status(500).json({ success: false, message: 'Unable to restore message', error: error.message });
  }
};

export const permanentlyDeleteContact = async (req, res) => {
  try {
    await ensureContactTable();
    const contactId = Number(req.params.id);

    if (!Number.isInteger(contactId) || contactId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid contact message ID' });
    }

    const result = await pool.query(
      `DELETE FROM contact_messages
       WHERE id = $1 AND COALESCE(is_deleted, FALSE) = TRUE
       RETURNING *`,
      [contactId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Message must be in Trash before permanent delete' });
    }

    return res.json({ success: true, message: 'Message permanently deleted', contact: result.rows[0] });
  } catch (error) {
    console.error('Permanent delete contact error:', error);
    return res.status(500).json({ success: false, message: 'Unable to permanently delete message', error: error.message });
  }
};

export const testAdminEmail = async (req, res) => {
  try {
    const to = req.body?.to || process.env.CONTACT_RECEIVER_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    if (!to) {
      return res.status(400).json({ success: false, message: 'No test recipient found. Add CONTACT_RECEIVER_EMAIL or send { to }.' });
    }

    const emailStatus = await sendAdminDirectEmail({
      to,
      name: 'Admin',
      subject: 'Abobby Hotel SMTP Test',
      message: `This is a test email from Abobby Nwa Hotel backend at ${new Date().toISOString()}. If you received this, SMTP is working.`
    });

    return res.json({
      success: true,
      message: emailStatus.sent ? 'SMTP test email sent.' : 'SMTP test did not send.',
      to,
      emailStatus
    });
  } catch (error) {
    console.error('SMTP test error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'SMTP test failed',
      error: error.message,
      hint: 'Check EMAIL_USER, EMAIL_PASS app password, SMTP_HOST, SMTP_PORT, and Gmail security settings in Render Environment.'
    });
  }
};
