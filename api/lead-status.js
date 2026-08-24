// PATCH /api/lead-status
// Body: { id: 123, status: "contacted" }
// Updates a lead's status. Protected by the same ADMIN_TOKEN as /api/leads.

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, status } = req.body || {};
  if (!id || !status) {
    return res.status(400).json({ error: 'id and status are required.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ status }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Supabase update failed:', errText);
      return res.status(502).json({ error: 'Could not update lead.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead-status.js error:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
