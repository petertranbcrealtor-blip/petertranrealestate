// POST /api/lead
// Receives a lead form submission from the website and stores it in Supabase (your own CRM database).
// Deploy target: Vercel serverless function (Node.js runtime).
//
// Required environment variables (set in Vercel project settings):
//   SUPABASE_URL              e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY the "service_role" secret key from Supabase project settings > API
//
// Optional: set NOTIFY_EMAIL_WEBHOOK to any webhook URL (e.g. a Zapier/Make webhook, or a
// Resend/SendGrid endpoint) if you want an email/SMS alert whenever a new lead comes in.

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

    // Optional: fire a notification webhook so you know immediately when a lead comes in
    if (process.env.NOTIFY_EMAIL_WEBHOOK) {
      fetch(process.env.NOTIFY_EMAIL_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `New lead: ${name} (${email}) — ${source}` }),
      }).catch((e) => console.error('Notify webhook failed', e));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead.js error:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
