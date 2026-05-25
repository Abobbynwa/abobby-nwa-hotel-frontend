const clean = (value) => String(value ?? '').trim();

const getApiKey = () => clean(process.env.RESEND_API_KEY);
const getSender = () => clean(process.env.EMAIL_FROM || 'onboarding@resend.dev');
const getSenderName = () => clean(process.env.EMAIL_FROM_NAME || 'Abobby Nwa Hotel & Suites');

export const hasResend = () => Boolean(getApiKey());

export const sendViaResend = async ({ to, subject, html, text, replyTo }) => {
  if (!hasResend()) return { sent: false, reason: 'missing_resend_api_key' };

  const headers = {
    'Content-Type': 'application/json'
  };
  headers.Authorization = ['Bearer', getApiKey()].join(' ');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: `${getSenderName()} <${getSender()}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo || undefined
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Email API failed: ${response.status} ${data.message || data.error || JSON.stringify(data)}`);
  }

  console.log('Email sent with API:', { to, subject, id: data.id });
  return { sent: true, provider: 'resend', messageId: data.id };
};
