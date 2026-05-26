const clean = (value) => String(value ?? '').trim();

const getBrevoKey = () => clean(process.env.BREVO_API_KEY);
const getSenderEmail = () => clean(process.env.EMAIL_FROM || process.env.EMAIL_USER);
const getSenderName = () => clean(process.env.EMAIL_FROM_NAME || 'Abobby Nwa Hotel & Suites');

export const hasBrevo = () => Boolean(getBrevoKey() && getSenderEmail());

export const sendViaBrevo = async ({ to, subject, html, text, replyTo }) => {
  if (!hasBrevo()) return { sent: false, reason: 'missing_brevo_config' };

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
  headers['api-key'] = getBrevoKey();

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sender: {
        name: getSenderName(),
        email: getSenderEmail()
      },
      to: (Array.isArray(to) ? to : [to]).map((email) => ({ email })),
      subject,
      htmlContent: html || `<pre>${String(text || '')}</pre>`,
      textContent: text || undefined,
      replyTo: replyTo ? { email: replyTo } : undefined
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Brevo failed: ${response.status} ${data.message || data.error || JSON.stringify(data)}`);
  }

  console.log('Email sent with Brevo:', { to, subject, messageId: data.messageId });
  return { sent: true, provider: 'brevo', messageId: data.messageId };
};
