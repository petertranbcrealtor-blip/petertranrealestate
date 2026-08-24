# Peter Tran Real Estate — new site + own CRM

Replaces the Lofty-hosted site and its ~$80/mo CRM. This is a static HTML/CSS/JS
site with two serverless functions for lead capture, plus a private CRM dashboard.
Realistic monthly cost once live: **$0–$20/mo** (domain renewal aside), versus $80/mo on Lofty.

## What's included

- `index.html`, `buy.html`, `sell.html`, `about.html`, `contact.html` — the site
- `calculators/` — mortgage, affordability, and BC Property Transfer Tax calculators (no email required to use)
- `blog/` — two starter SEO posts; add more the same way to build search traffic over time
- `api/lead.js` — receives every form submission and stores it in your database
- `api/leads.js` / `api/lead-status.js` — power the CRM dashboard
- `admin/index.html` — your private CRM: view leads, see submitted details, set a status per lead
- `supabase-schema.sql` — the one-time database setup
- `robots.txt`, `sitemap.xml` — basic SEO plumbing
- `.env.example` — the environment variables you'll set in Vercel

**No live MLS listings yet.** `buy.html` is built to capture buyer criteria and link out to
realtor.ca in the meantime. When you're ready, an IDX/RETS feed from your real estate board
can be added later without changing the rest of the site — flag it and this page gets rebuilt
to show live listings.

## 1. Create accounts (free tier is enough to start)

1. **GitHub** (github.com) — to hold the code
2. **Vercel** (vercel.com) — hosts the site + serverless functions, free tier
3. **Supabase** (supabase.com) — your CRM's database, free tier

## 2. Set up the database

1. In Supabase, create a new project.
2. Go to **SQL Editor > New query**, paste the contents of `supabase-schema.sql`, and run it.
3. Go to **Project Settings > API**. Copy the **Project URL** and the **service_role** secret key
   (not the `anon` key — the service_role key is what the API uses; it never touches the browser).

## 3. Push the code to GitHub

```bash
cd site
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/petertranrealestate.git
git push -u origin main
```

## 4. Deploy to Vercel

1. In Vercel, **Add New Project** → import the GitHub repo you just pushed.
2. Framework preset: **Other** (it's static HTML + serverless functions — no build step needed).
3. Before deploying, add these **Environment Variables** (Project Settings > Environment Variables):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_TOKEN` — make up a long random password, e.g. generate one at random.org
   - `NOTIFY_EMAIL_WEBHOOK` — optional, leave blank for now
4. Deploy. Vercel gives you a `*.vercel.app` URL to test everything before pointing your domain at it.

## 5. Point your domain at it

1. In Vercel, go to your project → **Settings > Domains** → add `www.petertranrealestate.com`
   and `petertranrealestate.com`.
2. Vercel shows you the DNS records to add. Log into wherever your domain is registered
   (check your Lofty account or your domain registrar — Lofty's welcome email usually says
   who registered it) and update the DNS records as shown.
3. DNS changes can take a few hours to propagate. Keep the Lofty site running until this is confirmed live.

## 6. Test the whole flow before cancelling Lofty

1. Visit the live site, submit each form (homepage contact, sell.html valuation, buy.html criteria, contact.html).
2. Go to `yourdomain.com/admin/`, enter the `ADMIN_TOKEN` you set in step 4, and confirm each test
   submission appears with its details.
3. Try the three calculators on a phone to confirm they're usable on mobile.

## 7. Cancel Lofty

Once the new site is live on your domain and lead capture is confirmed working end-to-end,
cancel the Lofty subscription. Keep a PDF/export of anything in Lofty's CRM you want to keep
(past client contacts, notes) before closing the account.

## Ongoing costs once live

| Item | Cost |
|---|---|
| Vercel hosting | $0/mo (free tier covers this easily) |
| Supabase database | $0/mo (free tier: 500MB, plenty for leads) |
| Domain renewal | Whatever you already pay — unrelated to Lofty |
| **Total vs. Lofty's $80/mo** | **~$80/mo saved** |

If traffic or lead volume grows enough to outgrow free tiers, Vercel Pro is $20/mo and Supabase
Pro is $25/mo — still well under Lofty, and only needed once the site is doing real volume.

## Adding more calculators or blog posts later

Every page is a self-contained HTML file using the shared `css/styles.css` and `js/main.js`.
Copy an existing page (e.g. a blog post or calculator) as a template, edit the content, add a
link to it from the relevant hub page (`blog/index.html` or `calculators/index.html`), and add
its URL to `sitemap.xml`.
