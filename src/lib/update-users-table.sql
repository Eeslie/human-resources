-- Step 1: First, ensure the employees table exists (or check if it's named 'employee')
-- If your table is named 'employee' (singular), use that instead

-- Option A: If your employees table is named 'employees' (plural)
-- First create it if it doesn't exist:
create table if not exists employees (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	first_name text not null,
	last_name text not null,
	status text not null default 'Active',
	employment_type text not null default 'Full-time',
	department_id uuid,
	employee_id text unique
);

-- Option B: If your employees table is named 'employee' (singular), use this instead:
-- (Uncomment if needed)
-- create table if not exists employee (
-- 	id uuid primary key default gen_random_uuid(),
-- 	created_at timestamptz not null default now(),
-- 	first_name text not null,
-- 	last_name text not null,
-- 	status text not null default 'Active',
-- 	employment_type text not null default 'Full-time',
-- 	department_id uuid,
-- 	employee_id text unique
-- );

-- Step 2: Add columns to users table
-- If your employees table is 'employees' (plural):
alter table users
add column if not exists role text not null default 'employee',
add column if not exists employee_id uuid references employees(id) on delete set null;

-- If your employees table is 'employee' (singular), use this instead:
-- alter table users
-- add column if not exists role text not null default 'employee',
-- add column if not exists employee_id uuid references employee(id) on delete set null;

-- Step 3: If you get an error about the foreign key constraint, you can add it without the constraint first:
-- (Run this if the above fails)
-- alter table users
-- add column if not exists role text not null default 'employee',
-- add column if not exists employee_id uuid;

-- Then add the foreign key constraint later:
-- alter table users
-- add constraint fk_users_employee_id 
-- foreign key (employee_id) references employees(id) on delete set null;

