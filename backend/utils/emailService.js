import nodemailer from 'nodemailer';
import { hasBrevo, sendViaBrevo } from './brevoProvider.js';
import { hasResend, sendViaResend } from './resendProvider.js';

const getEmailUser = () => (process.env.EMAIL_USER || '').trim();
const getEmailPass = () => (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();
const getFromEmail = () => (process.env.EMAIL_FROM || process.env.EMAIL_USER || 'onboarding@resend.dev').trim();
const getFromName = () => process.env.EMAIL_FROM_NAME || 'Abobby Nwa Hotel & Suites';
const fromLine = () => `${getFromName()} <${getFromEmail()}>`;

const safeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[m]));

const money = (value) => `₦${Number(value || 0).toLocaleString()}`;
const fmtDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const bookingTable = (booking) => `
<table style="border-collapse:collapse;width:100%;max-width:620px;margin:14px 0">
<tr><td style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc">Reference</td><td style="padding:10px;border:1px solid #e5e7eb"><strong>${safeHtml(booking.reference)}</strong></td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc">Guest</td><td style="padding:10px;border:1px solid #e5e7eb">${safeHtml(booking.full_name || booking.fullName || 'Guest')}</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc">Room</td><td style="padding:10px;border:1px solid #e5e7eb">${safeHtml(booking.room_name || booking.room_type || booking.roomType || 'Selected room')}</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc">Check-in</td><td style="padding:10px;border:1px solid #e5e7eb">${safeHtml(fmtDate(booking.check_in || booking.checkIn))}</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc">Check-out</td><td style="padding:10px;border:1px solid #e5e7eb">${safeHtml(fmtDate(booking.check_out || booking.checkOut))}</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc">Total</td><td style="padding:10px;border:1px solid #e5e7eb"><strong>${money(booking.total)}</strong></td></tr>
</table>`;

const wrap = (title, body) => `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827"><h2>${safeHtml(title)}</h2>${body}<p>Thank you,<br><strong>Abobby Nwa Hotel & Suites</strong></p></div>`;

const sendSmtp = async (mailOptions) => {
  if (!getEmailUser() || !getEmailPass()) return { sent: false, reason: 'missing_smtp_config' };
  const port = Number(process.env.SMTP_PORT || 465);
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const config = {
    host,
    port,
    secure: port === 465,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    auth: { user: getEmailUser(), pass: getEmailPass() }
  };
  console.log('Trying SMTP:', { host, port, secure: config.secure, user: getEmailUser() });
  const transporter = nodemailer.createTransport(config);
  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent with SMTP:', { to: mailOptions.to, subject: mailOptions.subject, messageId: info.messageId });
  return { sent: true, provider: 'smtp', messageId: info.messageId };
};

const sendSafeMail = async (mailOptions) => {
  const finalMail = { ...mailOptions, from: mailOptions.from || fromLine() };
  if (hasBrevo()) return sendViaBrevo(finalMail);
  if (hasResend()) return sendViaResend(finalMail);
  return sendSmtp(finalMail);
};

export const sendBookingCreatedEmail = async (booking) => {
  const name = booking.full_name || booking.fullName || 'Guest';
  return sendSafeMail({
    to: booking.email,
    subject: `Booking Received - ${booking.reference}`,
    text: `Hello ${name}, your booking ${booking.reference} has been received.`,
    html: wrap('Booking Received', `<p>Hello <strong>${safeHtml(name)}</strong>,</p><p>Your booking has been received and is awaiting payment/confirmation.</p>${bookingTable(booking)}`)
  });
};

export const sendBookingStatusEmail = async (booking, statusType = 'updated') => {
  const name = booking.full_name || booking.fullName || 'Guest';
  const label = statusType === 'confirmed' ? 'confirmed' : statusType === 'cancelled' ? 'cancelled' : 'updated';
  return sendSafeMail({
    to: booking.email,
    subject: `Booking ${label} - ${booking.reference}`,
    text: `Hello ${name}, your booking ${booking.reference} has been ${label}.`,
    html: wrap(`Booking ${label}`, `<p>Hello <strong>${safeHtml(name)}</strong>,</p><p>Your booking has been ${safeHtml(label)}.</p>${bookingTable(booking)}`)
  });
};

export const sendTransferEvidenceConfirmation = async (booking) => {
  const name = booking.full_name || booking.fullName || 'Guest';
  return sendSafeMail({
    to: booking.email,
    subject: `Payment Evidence Received - ${booking.reference}`,
    text: `Hello ${name}, we received your payment evidence for booking ${booking.reference}.`,
    html: wrap('Payment Evidence Received', `<p>Hello <strong>${safeHtml(name)}</strong>,</p><p>We received your payment evidence. Admin will review and confirm once verified.</p>${bookingTable(booking)}`)
  });
};

export const sendContactEmails = async ({ name, email, phone, subject, message }) => {
  const adminRecipient = process.env.CONTACT_RECEIVER_EMAIL || process.env.ADMIN_EMAIL || getEmailUser() || getFromEmail();
  const contactSubject = subject || 'Contact Message';
  const adminEmail = sendSafeMail({
    to: adminRecipient,
    replyTo: email,
    subject: `New Contact Message - ${contactSubject}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\n${message}`,
    html: wrap('New Contact Message', `<p><strong>Name:</strong> ${safeHtml(name)}</p><p><strong>Email:</strong> ${safeHtml(email)}</p><p><strong>Phone:</strong> ${safeHtml(phone || 'Not provided')}</p><div style="padding:12px;background:#f3f4f6;border-radius:8px">${safeHtml(message)}</div>`)
  });
  const customerEmail = sendSafeMail({
    to: email,
    subject: 'We received your message - Abobby Nwa Hotel & Suites',
    text: `Hello ${name}, we received your message and will get back to you soon.`,
    html: wrap('Message Received', `<p>Hello <strong>${safeHtml(name)}</strong>,</p><p>We received your message and our team will get back to you soon.</p>`)
  });
  const results = await Promise.allSettled([adminEmail, customerEmail]);
  return {
    adminSent: results[0].status === 'fulfilled' && results[0].value.sent,
    customerSent: results[1].status === 'fulfilled' && results[1].value.sent,
    errors: results.filter((result) => result.status === 'rejected').map((result) => result.reason?.message || 'Email failed')
  };
};

export const sendContactReplyEmail = async ({ to, name, replyMessage }) => sendSafeMail({
  to,
  subject: 'Reply from Abobby Nwa Hotel & Suites',
  text: `Hello ${name},\n\n${replyMessage}`,
  html: wrap('Reply from Abobby Nwa Hotel & Suites', `<p>Hello <strong>${safeHtml(name)}</strong>,</p><div style="padding:12px;background:#f3f4f6;border-radius:8px">${safeHtml(replyMessage)}</div>`)
});

export const sendAdminDirectEmail = async ({ to, name, subject, message }) => sendSafeMail({
  to,
  subject: subject || 'Message from Abobby Nwa Hotel & Suites',
  text: `Hello ${name || 'Guest'},\n\n${message}`,
  html: wrap(subject || 'Message from Abobby Nwa Hotel & Suites', `<p>Hello <strong>${safeHtml(name || 'Guest')}</strong>,</p><div style="padding:12px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px">${safeHtml(message)}</div>`)
});
