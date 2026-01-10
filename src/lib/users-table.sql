-- Users table for authentication
create table if not exists users (
	id uuid primary key default gen_random_uuid(),
	email text not null unique,
	password text not null,
	full_name text not null,
	position text not null,
	role text not null default 'employee', -- 'employee' or 'hr'
	employee_id uuid references employees(id) on delete set null,
	created_at timestamptz not null default now()
);

-- Enable RLS
alter table users enable row level security;

-- Drop existing policies if they exist (to avoid errors on re-run)
drop policy if exists "anon read own" on users;
drop policy if exists "anon insert" on users;
drop policy if exists "anon update own" on users;

-- Permissive policies for now (tighten in production)
create policy "anon read own" on users for select using (true);
create policy "anon insert" on users for insert with check (true);
create policy "anon update own" on users for update using (true);

