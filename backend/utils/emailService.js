import nodemailer from 'nodemailer';

const getEmailUser = () => (process.env.EMAIL_USER || '').trim();
const getEmailPass = () => (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

const hasEmailConfig = () => Boolean(getEmailUser() && getEmailPass());

const getTransportConfigs = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = getEmailUser();
  const pass = getEmailPass();

  if (process.env.SMTP_PORT) {
    const port = Number(process.env.SMTP_PORT);
    return [{ host, port, secure: port === 465, auth: { user, pass } }];
  }

  return [
    { host, port: 465, secure: true, auth: { user, pass } },
    { host, port: 587, secure: false, auth: { user, pass }, requireTLS: true }
  ];
};

const createTransporter = (config) => nodemailer.createTransport({
  ...config,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
  tls: {
    rejectUnauthorized: true,
    servername: config.host
  }
});

const safeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}[m]));

const formatMoney = (value) => `₦${Number(value || 0).toLocaleString()}`;

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const sendSafeMail = async (mailOptions) => {
  if (!hasEmailConfig()) {
    console.log('Email config missing. Skipping email.', {
      hasUser: Boolean(getEmailUser()),
      hasPass: Boolean(getEmailPass())
    });
    return { sent: false, reason: 'missing_email_config' };
  }

  const configs = getTransportConfigs();
  const errors = [];

  for (const config of configs) {
    const safeConfig = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth?.user
    };

    try {
      console.log('Trying email transport:', safeConfig);
      const transporter = createTransporter(config);
      await transporter.verify();
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        messageId: info.messageId,
        transport: safeConfig
      });
      return { sent: true, messageId: info.messageId, transport: safeConfig };
    } catch (error) {
      const msg = `${safeConfig.host}:${safeConfig.port} - ${error.code || error.name || 'Error'} - ${error.message}`;
      console.error('Email transport failed:', msg);
      errors.push(msg);
    }
  }

  const finalError = new Error(`All email transports failed: ${errors.join(' | ')}`);
  finalError.emailErrors = errors;
  throw finalError;
};

const bookingTableHtml = (booking) => `
  <table style="border-collapse: collapse; width: 100%; max-width: 620px; margin: 14px 0;">
    <tr><td style="padding: 10px; border: 1px solid #e5e7eb; background:#f8fafc;">Booking Reference</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>${safeHtml(booking.reference)}</strong></td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e7eb; background:#f8fafc;">Guest Name</td><td style="padding: 10px; border: 1px solid #e5e7eb;">${safeHtml(booking.full_name || booking.fullName)}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e7eb; background:#f8fafc;">Room</td><td style="padding: 10px; border: 1px solid #e5e7eb;">${safeHtml(booking.room_name || booking.room_type || booking.roomType || 'Selected room')}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e7eb; background:#f8fafc;">Check-in</td><td style="padding: 10px; border: 1px solid #e5e7eb;">${safeHtml(formatDate(booking.check_in || booking.checkIn))}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e7eb; background:#f8fafc;">Check-out</td><td style="padding: 10px; border: 1px solid #e5e7eb;">${safeHtml(formatDate(booking.check_out || booking.checkOut))}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e7eb; background:#f8fafc;">Guests</td><td style="padding: 10px; border: 1px solid #e5e7eb;">${safeHtml(booking.guests || booking.number_of_guests || '-')}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e7eb; background:#f8fafc;">Total</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>${formatMoney(booking.total)}</strong></td></tr>
  </table>
`;

export const sendBookingCreatedEmail = async (booking) => {
  const emailUser = getEmailUser();
  const guestName = booking.full_name || booking.fullName || 'Guest';

  return sendSafeMail({
    from: `Abobby Nwa Hotel & Suites <${emailUser}>`,
    to: booking.email,
    subject: `Booking Received - ${booking.reference}`,
    text: `Hello ${guestName},\n\nThank you for booking with Abobby Nwa Hotel & Suites.\n\nYour booking has been received and is awaiting payment/confirmation.\n\nBooking Reference: ${booking.reference}\nRoom: ${booking.room_name || booking.room_type || booking.roomType || 'Selected room'}\nCheck-in: ${formatDate(booking.check_in || booking.checkIn)}\nCheck-out: ${formatDate(booking.check_out || booking.checkOut)}\nGuests: ${booking.guests || '-'}\nTotal: ${formatMoney(booking.total)}\n\nPlease keep your booking reference safe.\n\nThank you,\nAbobby Nwa Hotel & Suites`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;"><h2>Booking Received</h2><p>Hello <strong>${safeHtml(guestName)}</strong>,</p><p>Thank you for booking with <strong>Abobby Nwa Hotel & Suites</strong>.</p><p>Your booking has been received and is awaiting payment/confirmation.</p>${bookingTableHtml(booking)}<p>Please keep your booking reference safe.</p><p>Thank you,<br/><strong>Abobby Nwa Hotel & Suites</strong></p></div>`
  });
};

export const sendBookingStatusEmail = async (booking, statusType = 'updated') => {
  const emailUser = getEmailUser();
  const guestName = booking.full_name || booking.fullName || 'Guest';
  const statusText = statusType === 'confirmed' ? 'Your booking has been confirmed.' : statusType === 'cancelled' ? 'Your booking has been cancelled.' : 'Your booking has been updated.';

  return sendSafeMail({
    from: `Abobby Nwa Hotel & Suites <${emailUser}>`,
    to: booking.email,
    subject: `Booking ${statusType === 'confirmed' ? 'Confirmed' : statusType === 'cancelled' ? 'Cancelled' : 'Updated'} - ${booking.reference}`,
    text: `Hello ${guestName},\n\n${statusText}\n\nBooking Reference: ${booking.reference}\nRoom: ${booking.room_name || booking.room_type || booking.roomType || 'Selected room'}\nCheck-in: ${formatDate(booking.check_in || booking.checkIn)}\nCheck-out: ${formatDate(booking.check_out || booking.checkOut)}\nTotal: ${formatMoney(booking.total)}\n\nThank you,\nAbobby Nwa Hotel & Suites`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;"><h2>Booking ${safeHtml(statusType === 'confirmed' ? 'Confirmed' : statusType === 'cancelled' ? 'Cancelled' : 'Updated')}</h2><p>Hello <strong>${safeHtml(guestName)}</strong>,</p><p>${safeHtml(statusText)}</p>${bookingTableHtml(booking)}<p>Thank you,<br/><strong>Abobby Nwa Hotel & Suites</strong></p></div>`
  });
};

export const sendTransferEvidenceConfirmation = async (booking) => {
  const emailUser = getEmailUser();
  return sendSafeMail({
    from: `Abobby Nwa Hotel & Suites <${emailUser}>`,
    to: booking.email,
    subject: `Payment Evidence Received - ${booking.reference}`,
    text: `Hello ${booking.full_name},\n\nWe have received your payment evidence for your booking at Abobby Nwa Hotel & Suites.\n\nBooking Reference: ${booking.reference}\nPayment Status: Pending Review\nBooking Status: Pending\nAmount: ${formatMoney(booking.total)}\nCheck-in: ${formatDate(booking.check_in)}\nCheck-out: ${formatDate(booking.check_out)}\n\nOur admin will review your evidence and confirm your booking once payment is verified.\n\nThank you,\nAbobby Nwa Hotel & Suites`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;"><h2>Payment Evidence Received</h2><p>Hello <strong>${safeHtml(booking.full_name)}</strong>,</p><p>We have received your payment evidence for your booking at <strong>Abobby Nwa Hotel & Suites</strong>.</p>${bookingTableHtml(booking)}<p>Our admin will review your evidence and confirm your booking once payment is verified.</p><p>Thank you,<br/><strong>Abobby Nwa Hotel & Suites</strong></p></div>`
  });
};

export const sendContactEmails = async ({ name, email, phone, subject, message }) => {
  const emailUser = getEmailUser();
  const adminRecipient = process.env.CONTACT_RECEIVER_EMAIL || process.env.ADMIN_EMAIL || emailUser;
  const contactSubject = subject || 'Contact Message';

  const adminEmail = sendSafeMail({
    from: `Abobby Nwa Hotel Website <${emailUser}>`,
    to: adminRecipient,
    replyTo: email,
    subject: `New Contact Message - ${contactSubject}`,
    text: `New contact message from Abobby Nwa Hotel website.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nSubject: ${contactSubject}\n\nMessage:\n${message}`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;"><h2>New Contact Message</h2><p><strong>Name:</strong> ${safeHtml(name)}</p><p><strong>Email:</strong> ${safeHtml(email)}</p><p><strong>Phone:</strong> ${safeHtml(phone || 'Not provided')}</p><p><strong>Subject:</strong> ${safeHtml(contactSubject)}</p><p><strong>Message:</strong></p><div style="padding: 12px; background: #f3f4f6; border-radius: 8px;">${safeHtml(message)}</div></div>`
  });

  const customerEmail = sendSafeMail({
    from: `Abobby Nwa Hotel & Suites <${emailUser}>`,
    to: email,
    subject: 'We received your message - Abobby Nwa Hotel & Suites',
    text: `Hello ${name},\n\nThank you for contacting Abobby Nwa Hotel & Suites.\n\nWe have received your message and our team will get back to you as soon as possible.\n\nYour message:\n${message}\n\nThank you,\nAbobby Nwa Hotel & Suites`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;"><h2>Message Received</h2><p>Hello <strong>${safeHtml(name)}</strong>,</p><p>Thank you for contacting <strong>Abobby Nwa Hotel & Suites</strong>.</p><p>We have received your message and our team will get back to you as soon as possible.</p><p><strong>Your message:</strong></p><div style="padding: 12px; background: #f3f4f6; border-radius: 8px;">${safeHtml(message)}</div><p>Thank you,<br/><strong>Abobby Nwa Hotel & Suites</strong></p></div>`
  });

  const results = await Promise.allSettled([adminEmail, customerEmail]);
  return {
    adminSent: results[0].status === 'fulfilled' && results[0].value.sent,
    customerSent: results[1].status === 'fulfilled' && results[1].value.sent,
    errors: results.filter((result) => result.status === 'rejected').map((result) => result.reason?.message || 'Email failed')
  };
};

export const sendContactReplyEmail = async ({ to, name, replyMessage }) => {
  const emailUser = getEmailUser();
  return sendSafeMail({
    from: `Abobby Nwa Hotel & Suites <${emailUser}>`,
    to,
    subject: 'Reply from Abobby Nwa Hotel & Suites',
    text: `Hello ${name},\n\n${replyMessage}\n\nThank you,\nAbobby Nwa Hotel & Suites`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;"><p>Hello <strong>${safeHtml(name)}</strong>,</p><div style="padding: 12px; background: #f3f4f6; border-radius: 8px;">${safeHtml(replyMessage)}</div><p>Thank you,<br/><strong>Abobby Nwa Hotel & Suites</strong></p></div>`
  });
};

export const sendAdminDirectEmail = async ({ to, name, subject, message }) => {
  const emailUser = getEmailUser();
  const safeSubject = subject || 'Message from Abobby Nwa Hotel & Suites';
  const safeName = name || 'Guest';
  return sendSafeMail({
    from: `Abobby Nwa Hotel & Suites <${emailUser}>`,
    to,
    subject: safeSubject,
    text: `Hello ${safeName},\n\n${message}\n\nThank you,\nAbobby Nwa Hotel & Suites`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;"><h2>${safeHtml(safeSubject)}</h2><p>Hello <strong>${safeHtml(safeName)}</strong>,</p><div style="padding: 14px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px;">${safeHtml(message)}</div><p>Thank you,<br/><strong>Abobby Nwa Hotel & Suites</strong></p></div>`
  });
};
