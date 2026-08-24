-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)
-- to create the leads table that powers your own CRM.

create table if not exists leads (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  phone text,
  message text,
  source text,           -- e.g. 'homepage', 'sell.html', 'buyer-criteria', 'contact-page'
  page text,              -- URL path the form was submitted from
  status text default 'new',   -- new | contacted | qualified | client | closed | lost — edit freely in the dashboard
  details jsonb,          -- catches any extra form fields (interest, propertyType, budget, timeline, etc.)
  notes text,             -- your private follow-up notes
  created_at timestamptz default now()
);

-- Row Level Security: locked down by default. The API only ever talks to Supabase
-- using the service_role key (server-side, never exposed to the browser), so RLS
-- can stay strict — no public read/write policies are needed.
alter table leads enable row level security;

create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_status_idx on leads (status);
