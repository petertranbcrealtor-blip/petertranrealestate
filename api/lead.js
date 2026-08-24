// POST /api/lead
// Receives a lead form submission from the website and stores it in Supabase (your own CRM database).
// Deploy target: Vercel serverless function (Node.js runtime).
//
// Required environment variables (set in Vercel project settings):
//   SUPABASE_URL              e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY the "service_role" secret key from Supabase project settings > API
//
// Optional — email notification on every new lead (via Resend, resend.com, free tier):
//   RESEND_API_KEY            your Resend API key
//   NOTIFY_TO_EMAIL           the address that should receive lead alerts, e.g. petertran.bcrealtor@gmail.com

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const { name, email, phone, message, source, page } = body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    // Collect any extra fields (interest, propertyType, budget, address, etc.)
    // into a JSON "details" column so every form on the site can reuse this one endpoint.
    const knownKeys = ['name', 'email', 'phone', 'message', 'source', 'page'];
    const details = {};
    for (const key of Object.keys(body)) {
      if (!knownKeys.includes(key)) details[key] = body[key];
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
      return res.status(500).json({ error: 'Server not configured.' });
    }

    const record = {
      name,
      email,
      phone: phone || null,
      message: message || null,
      source: source || 'unknown',
      page: page || null,
      details,
      created_at: new Date().toISOString(),
    };

    const resp = await fetch(`${supabaseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(record),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Supabase insert failed:', errText);
      return res.status(502).json({ error: 'Could not save lead.' });
    }

    // Email notification — sends you an alert the moment a new lead comes in
    console.log('Email env check — RESEND_API_KEY present:', !!process.env.RESEND_API_KEY, '| NOTIFY_TO_EMAIL present:', !!process.env.NOTIFY_TO_EMAIL);

    if (process.env.RESEND_API_KEY && process.env.NOTIFY_TO_EMAIL) {
      const detailLines = Object.entries(details)
        .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0; color:#5B6B70;">${k}</td><td style="padding:4px 0;">${v}</td></tr>`)
        .join('');

      const emailHtml = `
        <div style="font-family:Arial,sans-serif; max-width:520px;">
          <h2 style="margin-bottom:4px;">New lead: ${name}</h2>
          <p style="color:#5B6B70; margin-top:0;">Source: ${source || 'unknown'}${page ? ' · ' + page : ''}</p>
          <table style="border-collapse:collapse; margin:16px 0;">
            <tr><td style="padding:4px 12px 4px 0; color:#5B6B70;">Email</td><td style="padding:4px 0;">${email}</td></tr>
            ${phone ? `<tr><td style="padding:4px 12px 4px 0; color:#5B6B70;">Phone</td><td style="padding:4px 0;">${phone}</td></tr>` : ''}
            ${detailLines}
          </table>
          ${message ? `<p><strong>Message:</strong><br>${message}</p>` : ''}
        </div>`;

      try {
        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Peter Tran Real Estate <onboarding@resend.dev>',
            to: process.env.NOTIFY_TO_EMAIL,
            subject: `New lead: ${name} (${source || 'website'})`,
            html: emailHtml,
          }),
        });
        const emailResult = await emailResp.text();
        console.log('Resend response status:', emailResp.status, '| body:', emailResult);
      } catch (emailErr) {
        console.error('Email notification threw an error:', emailErr);
      }
    } else {
      console.warn('Skipping email notification — RESEND_API_KEY or NOTIFY_TO_EMAIL not set.');
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead.js error:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
