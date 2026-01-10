# Role-Based Access Control Setup Guide

## Overview

This system implements role-based access control (RBAC) where:
- **HR/Admin users** (`role: 'hr'`) can see and manage all employee data
- **Employee users** (`role: 'employee'`) can only see their own data

## Database Setup

### Step 1: Update Users Table

Run this SQL in your Supabase SQL Editor to add the `role` and `employee_id` columns:

```sql
-- Add role and employee_id columns to users table
alter table users 
  add column if not exists role text not null default 'employee',
  add column if not exists employee_id uuid references employees(id) on delete set null;
```

### Step 2: Link Existing Users to Employees

If you have existing users, you'll need to link them to employees. You can do this by:

1. Finding the employee ID that matches the user
2. Updating the user record:

```sql
-- Example: Link a user to an employee
update users 
set employee_id = 'EMPLOYEE_UUID_HERE'
where email = 'user@example.com';
```

### Step 3: Create HR Accounts

To create an HR/admin account, you can either:

**Option A: Direct SQL**
```sql
-- Create HR user directly
insert into users (email, password, full_name, position, role)
values (
  'hr@starbucks.com',
  'hashed_password_here', -- Use SHA-256 hash
  'HR Manager',
  'HR Manager',
  'hr'
);
```

**Option B: Sign up normally, then update role**
```sql
-- After signup, update role to 'hr'
update users 
set role = 'hr'
where email = 'hr@starbucks.com';
```

## How It Works

### Authentication Flow

1. User signs up → Default role is `'employee'`
2. User logs in → Role and `employee_id` are included in the session
3. All API requests include user info in headers:
   - `x-user-id`: User's UUID
   - `x-user-role`: 'hr' or 'employee'
   - `x-user-employee-id`: Employee UUID (if employee)

### API Filtering

All API routes automatically filter data based on role:
- **HR users**: See all data (no filtering)
- **Employee users**: Only see data where `employee_id` matches their own

### Protected Routes

- `/employee-dashboard`: Only accessible to employees
- `/employee-records`, `/payroll`, `/recruitment`, `/time-attendance`: Only accessible to HR (or show filtered data)

## Frontend Changes

### Overview Page
- **HR users**: See all management modules
- **Employee users**: See link to "My Dashboard"

### Employee Dashboard
- Shows only the employee's own:
  - Profile information
  - Attendance records
  - Leave requests
  - Payslips

### Navigation
- HR users see: Overview, Partner Records, Payroll, Recruitment, Time & Attendance
- Employee users see: Overview, My Dashboard

## Testing

1. **Create an employee account:**
   - Sign up normally
   - Link to an employee record (update `employee_id` in database)
   - Login → Should see "My Dashboard" option

2. **Create an HR account:**
   - Sign up normally
   - Update role to 'hr' in database
   - Login → Should see all management modules

3. **Test data filtering:**
   - Login as employee
   - Check API responses → Should only return their own data
   - Login as HR
   - Check API responses → Should return all data

## Security Notes

- All filtering happens on the **server side** - never trust client-side checks
- API routes validate access before returning data
- Employees cannot access other employees' data
- HR can access all data

## Troubleshooting

**Issue: Employee sees no data**
- Check that `employee_id` is set in the `users` table
- Verify the `employee_id` matches an actual employee record
- Check API headers are being sent correctly

**Issue: HR sees no data**
- Verify role is set to `'hr'` (not `'HR'` or `'Hr'`)
- Check that API routes are receiving user info correctly

**Issue: Can't access employee dashboard**
- Verify user role is `'employee'`
- Check that route protection is working

