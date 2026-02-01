const SENDGRID_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON' }) };
  }

  const {
    html = '',
    text = '',
    subjectLovelyn = 'A message just for you — Will you be my Val? 💌',
    subjectOwner = "Lovelyn accepted — You're now official! 🎉",
    ownerText = "lovelyn has accepted to be your val, treat her nice!"
  } = payload;

  const apiKey = process.env.SENDGRID_API_KEY;
  const senderEmail = process.env.SENDGRID_SENDER_EMAIL;
  const senderName = process.env.SENDGRID_SENDER_NAME || '';
  const recipientLovelyn = process.env.RECIPIENT_LOVELYN || 'lovelynfriday575@gmail.com';
  const recipientMe = process.env.RECIPIENT_ME || 'ibevictory50@gmail.com';

  if (!apiKey || !senderEmail) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Missing SendGrid configuration on server.' }) };
  }

  const toFetch = async (mailPayload) => {
    const res = await fetch(SENDGRID_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mailPayload)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`SendGrid error ${res.status}: ${txt}`);
    }
    return res;
  };

  const mailToLovelyn = {
    personalizations: [{ to: [{ email: recipientLovelyn }] }],
    from: { email: senderEmail, name: senderName },
    subject: subjectLovelyn,
    content: [
      { type: 'text/plain', value: text || 'You have a message!' },
      { type: 'text/html', value: html || '<p>You have a message!</p>' }
    ]
  };

  const mailToOwner = {
    personalizations: [{ to: [{ email: recipientMe }] }],
    from: { email: senderEmail, name: senderName },
    subject: subjectOwner,
    content: [
      { type: 'text/plain', value: ownerText }
    ]
  };

  try {
    await toFetch(mailToLovelyn);
    await toFetch(mailToOwner);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('SendGrid send failed:', err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
