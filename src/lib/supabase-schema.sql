-- Core reference tables
create table if not exists departments (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	created_at timestamptz not null default now()
);

create table if not exists employees (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	first_name text not null,
	last_name text not null,
	status text not null default 'Active',
	employment_type text not null default 'Full-time',
	department_id uuid references departments(id) on delete set null,
	employee_id text unique
);

create table if not exists employee_history (
	id uuid primary key default gen_random_uuid(),
	employee_id uuid not null references employees(id) on delete cascade,
	date date not null default now(),
	action text not null,
	description text not null,
	status text not null default 'info'
);

create table if not exists employee_documents (
	id uuid primary key default gen_random_uuid(),
	employee_id uuid not null references employees(id) on delete cascade,
	name text not null,
	url text not null,
	uploaded_at timestamptz not null default now()
);

-- Time & Attendance
create table if not exists attendance (
	id uuid primary key default gen_random_uuid(),
	employee_id uuid not null references employees(id) on delete cascade,
	date date not null,
	hours numeric,
	overtime_hours numeric default 0
);

-- Payroll and payslips
create table if not exists payroll (
	id uuid primary key default gen_random_uuid(),
	period_start date not null,
	period_end date not null,
	status text not null default 'Draft'
);

create table if not exists payslips (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	employee_id uuid not null references employees(id) on delete cascade,
	payroll_id uuid references payroll(id) on delete cascade,
	amount numeric not null,
	currency text not null default 'USD'
);

-- Recruitment
create table if not exists recruitment_vacancies (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	department_id uuid references departments(id) on delete set null,
	status text not null default 'Open',
	created_at timestamptz not null default now()
);

create table if not exists applicants (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	full_name text not null,
	email text,
	phone text,
	position text,
	experience text,
	status text not null default 'Under Review',
	rating int not null default 0,
	vacancy_id uuid references recruitment_vacancies(id) on delete set null
);

create table if not exists interviews (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	applicant_id uuid references applicants(id) on delete cascade,
	scheduled_at timestamptz,
	interviewer text,
	notes text,
	result text
);

create table if not exists offers (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	applicant_id uuid references applicants(id) on delete cascade,
	status text not null default 'Pending',
	amount numeric,
	currency text default 'USD'
);

-- Candidate evaluations
create table if not exists evaluations (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	applicant_id uuid not null references applicants(id) on delete cascade,
	reviewer text not null,
	communication int check (communication between 1 and 5),
	technical int check (technical between 1 and 5),
	culture_fit int check (culture_fit between 1 and 5),
	comments text
);

create table if not exists onboarding_tasks (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	employee_id uuid references employees(id) on delete cascade,
	title text not null,
	completed boolean not null default false
);

-- Basic RLS toggles; adjust as needed
alter table departments enable row level security;
alter table employees enable row level security;
alter table employee_history enable row level security;
alter table employee_documents enable row level security;
alter table attendance enable row level security;
alter table payroll enable row level security;
alter table payslips enable row level security;
alter table recruitment_vacancies enable row level security;
alter table applicants enable row level security;
alter table interviews enable row level security;
alter table offers enable row level security;
alter table evaluations enable row level security;
alter table onboarding_tasks enable row level security;

-- Permissive anon policies (tighten in production)
create policy if not exists "anon read all" on departments for select using (true);
create policy if not exists "anon read all" on employees for select using (true);
create policy if not exists "anon read all" on employee_history for select using (true);
create policy if not exists "anon read all" on employee_documents for select using (true);
create policy if not exists "anon read all" on attendance for select using (true);
create policy if not exists "anon read all" on payroll for select using (true);
create policy if not exists "anon read all" on payslips for select using (true);
create policy if not exists "anon read all" on recruitment_vacancies for select using (true);
create policy if not exists "anon read all" on applicants for select using (true);
create policy if not exists "anon read all" on interviews for select using (true);
create policy if not exists "anon read all" on offers for select using (true);
create policy if not exists "anon read all" on evaluations for select using (true);
create policy if not exists "anon read all" on onboarding_tasks for select using (true);

create policy if not exists "anon insert" on applicants for insert with check (true);
create policy if not exists "anon insert" on interviews for insert with check (true);
create policy if not exists "anon insert" on offers for insert with check (true);
create policy if not exists "anon insert" on evaluations for insert with check (true);
create policy if not exists "anon insert" on onboarding_tasks for insert with check (true);
create policy if not exists "anon insert" on employees for insert with check (true);
create policy if not exists "anon insert" on payslips for insert with check (true);


