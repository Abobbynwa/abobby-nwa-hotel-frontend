import nodemailer from 'nodemailer';

const getEmailUser = () => (process.env.EMAIL_USER || '').trim();
const getEmailPass = () => (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

const hasEmailConfig = () => {
  return Boolean(getEmailUser() && getEmailPass());
};

const createTransporter = () => {
  if (!hasEmailConfig()) return null;

  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    auth: {
      user: getEmailUser(),
      pass: getEmailPass()
    }
  });
};

const sendSafeMail = async (mailOptions) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('Email config missing. Skipping email.');
    return { sent: false, reason: 'missing_email_config' };
  }

  await transporter.sendMail(mailOptions);
  return { sent: true };
};

export const sendTransferEvidenceConfirmation = async (booking) => {
  const emailUser = getEmailUser();
  const subject = `Payment Evidence Received - ${booking.reference}`;

  const text = `Hello ${booking.full_name},

We have received your payment evidence for your booking at Abobby Nwa Hotel & Suites.

Booking Reference: ${booking.reference}
Payment Status: Pending Review
Booking Status: Pending
Amount: ₦${Number(booking.total || 0).toLocaleString()}
Check-in: ${booking.check_in}
Check-out: ${booking.check_out}

Our admin will review your evidence and confirm your booking once payment is verified.

Thank you,
Abobby Nwa Hotel & Suites`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2>Payment Evidence Received</h2>
      <p>Hello <strong>${booking.full_name}</strong>,</p>
      <p>We have received your payment evidence for your booking at <strong>Abobby Nwa Hotel & Suites</strong>.</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Booking Reference</td><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>${booking.reference}</strong></td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Payment Status</td><td style="padding: 8px; border: 1px solid #e5e7eb;">Pending Review</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Amount</td><td style="padding: 8px; border: 1px solid #e5e7eb;">₦${Number(booking.total || 0).toLocaleString()}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Check-in</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${booking.check_in}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Check-out</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${booking.check_out}</td></tr>
      </table>
      <p>Our admin will review your evidence and confirm your booking once payment is verified.</p>
      <p>Thank you,<br/><strong>Abobby Nwa Hotel & Suites</strong></p>
    </div>
  `;

  return sendSafeMail({
    from: `Abobby Nwa Hotel & Suites <${emailUser}>`,
    to: booking.email,
    subject,
    text,
    html
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
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${contactSubject}</p>
        <p><strong>Message:</strong></p>
        <div style="padding: 12px; background: #f3f4f6; border-radius: 8px;">${message}</div>
      </div>
    `
  });

  const customerEmail = sendSafeMail({
    from: `Abobby Nwa Hotel & Suites <${emailUser}>`,
    to: email,
    subject: 'We received your message - Abobby Nwa Hotel & Suites',
    text: `Hello ${name},\n\nThank you for contacting Abobby Nwa Hotel & Suites.\n\nWe have received your message and our team will get back to you as soon as possible.\n\nYour message:\n${message}\n\nThank you,\nAbobby Nwa Hotel & Suites`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Message Received</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for contacting <strong>Abobby Nwa Hotel & Suites</strong>.</p>
        <p>We have received your message and our team will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <div style="padding: 12px; background: #f3f4f6; border-radius: 8px;">${message}</div>
        <p>Thank you,<br/><strong>Abobby Nwa Hotel & Suites</strong></p>
      </div>
    `
  });

  const results = await Promise.allSettled([adminEmail, customerEmail]);

  return {
    adminSent: results[0].status === 'fulfilled' && results[0].value.sent,
    customerSent: results[1].status === 'fulfilled' && results[1].value.sent,
    errors: results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason?.message || 'Email failed')
  };
};

export const sendContactReplyEmail = async ({ to, name, replyMessage }) => {
  const emailUser = getEmailUser();

  return sendSafeMail({
    from: `Abobby Nwa Hotel & Suites <${emailUser}>`,
    to,
    subject: 'Reply from Abobby Nwa Hotel & Suites',
    text: `Hello ${name},\n\n${replyMessage}\n\nThank you,\nAbobby Nwa Hotel & Suites`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <p>Hello <strong>${name}</strong>,</p>
        <div style="padding: 12px; background: #f3f4f6; border-radius: 8px;">${replyMessage}</div>
        <p>Thank you,<br/><strong>Abobby Nwa Hotel & Suites</strong></p>
      </div>
    `
  });
};
