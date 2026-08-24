// GET /api/leads
// Returns stored leads for the admin CRM dashboard. Protected with a simple bearer token
// so your lead data isn't publicly readable.
//
// Required environment variables:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   ADMIN_TOKEN   — a long random string you choose. The admin dashboard asks for this
//                   once and sends it as "Authorization: Bearer <token>" on every request.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  try {
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/leads?select=*&order=created_at.desc&limit=500`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Supabase fetch failed:', errText);
      return res.status(502).json({ error: 'Could not load leads.' });
    }
    const data = await resp.json();
    return res.status(200).json({ leads: data });
  } catch (err) {
    console.error('leads.js error:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
