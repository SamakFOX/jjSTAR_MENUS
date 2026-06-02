create table if not exists access_logs (
  id uuid primary key default gen_random_uuid(),
  auth_code text,
  event_type text not null default 'visit',
  user_agent text,
  path text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists access_logs_auth_code_created_at_idx
  on access_logs (auth_code, created_at desc);

create index if not exists access_logs_created_at_idx
  on access_logs (created_at desc);
