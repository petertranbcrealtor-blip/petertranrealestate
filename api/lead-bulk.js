// POST /api/lead-bulk
// Body: { leads: [ { name, email, phone, source, status, message, notes }, ... ] }
// Bulk-inserts leads (e.g. from a CSV import in the CRM dashboard) in a single database call.
// Protected by ADMIN_TOKEN — same as the other admin-only endpoints.

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

  const { leads } = req.body || {};
  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'leads must be a non-empty array.' });
  }
  if (leads.length > 1000) {
    return res.status(400).json({ error: 'Max 1000 leads per import — split into smaller files.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  // Validate + normalize each row; anything missing name/email is skipped, not fatal.
  const records = [];
  let skipped = 0;
  for (const row of leads) {
    const name = (row.name || '').toString().trim();
    const email = (row.email || '').toString().trim();
    if (!name || !email) { skipped++; continue; }
    records.push({
      name,
      email,
      phone: row.phone ? String(row.phone).trim() : null,
      message: row.message ? String(row.message).trim() : null,
      source: row.source ? String(row.source).trim() : 'csv-import',
      page: null,
      status: row.status ? String(row.status).trim().toLowerCase() : 'new',
      notes: row.notes ? String(row.notes).trim() : null,
      details: {},
      created_at: new Date().toISOString(),
    });
  }

  if (records.length === 0) {
    return res.status(400).json({ error: 'No valid rows — every row needs at least a name and email.', skipped });
  }

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(records),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Supabase bulk insert failed:', errText);
      return res.status(502).json({ error: 'Could not save leads.' });
    }
    return res.status(200).json({ ok: true, inserted: records.length, skipped });
  } catch (err) {
    console.error('lead-bulk.js error:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
