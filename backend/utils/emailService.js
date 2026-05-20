import nodemailer from 'nodemailer';

const hasEmailConfig = () => {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

const createTransporter = () => {
  if (!hasEmailConfig()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

export const sendTransferEvidenceConfirmation = async (booking) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('Email config missing. Skipping customer confirmation email.');
    return { sent: false, reason: 'missing_email_config' };
  }

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

  await transporter.sendMail({
    from: `Abobby Nwa Hotel & Suites <${process.env.EMAIL_USER}>`,
    to: booking.email,
    subject,
    text,
    html
  });

  return { sent: true };
};
