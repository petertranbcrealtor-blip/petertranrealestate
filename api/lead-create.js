// POST /api/lead-create
// Lets you manually add a lead from the CRM dashboard (e.g. from a phone call, open house,
// or referral) rather than only from website form submissions. Protected by ADMIN_TOKEN —
// no spam checks here, since only you can reach this endpoint.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, email, phone, message, source, status, notes } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  const record = {
    name,
    email,
    phone: phone || null,
    message: message || null,
    source: source || 'manual',
    page: null,
    status: status || 'new',
    notes: notes || null,
    details: {},
    created_at: new Date().toISOString(),
  };

  try {
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
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead-create.js error:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
