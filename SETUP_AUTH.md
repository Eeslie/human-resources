# Authentication Setup Guide

## Step 1: Create the Users Table in Supabase

You need to create the `users` table in your Supabase database. Follow these steps:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Users table for authentication
create table if not exists users (
	id uuid primary key default gen_random_uuid(),
	email text not null unique,
	password text not null,
	full_name text not null,
	position text not null,
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
```

5. Click **Run** to execute the SQL
6. You should see a success message confirming the table was created

## Step 2: Verify the Table

1. Go to **Table Editor** in Supabase
2. You should now see the `users` table listed
3. The table should have the following columns:
   - `id` (uuid, primary key)
   - `email` (text, unique)
   - `password` (text)
   - `full_name` (text)
   - `position` (text)
   - `created_at` (timestamptz)

## Step 3: Test the Authentication

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
   - You should be redirected to `/login`

3. Click "Signup here at Starbucks!" to create a new account
   - Fill in: Email, Password, Full Name, and Position
   - Click "SIGNUP"

4. After successful signup, you'll be redirected to the overview page
   - Your name and position should appear in the top navigation bar

## Troubleshooting

If you still get errors about the table not existing:
- Make sure you ran the SQL in the correct Supabase project
- Check that you're using the correct database (not a different project)
- Verify the table exists in the Table Editor
- Try refreshing your browser or restarting the dev server

## Security Note

The current setup uses SHA-256 for password hashing, which is basic. For production, consider:
- Using bcrypt or Argon2 for password hashing
- Implementing proper JWT tokens
- Adding rate limiting for login attempts
- Implementing password reset functionality

