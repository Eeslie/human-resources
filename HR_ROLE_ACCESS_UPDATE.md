# HR Role-Based Access Control Update

## Summary

The system has been updated so that **only users with "HR CEO" or "HR Manager" roles** can access all HR management pages and data. All other users (employees) can only see their own data.

## Changes Made

### 1. Role System Update
- Changed from generic `'hr'` role to specific roles: **"HR CEO"** and **"HR Manager"**
- Updated `isHR()` function to check for these specific roles
- All role checks now verify: `user.role === 'HR CEO' || user.role === 'HR Manager'`

### 2. Signup Page
- Changed position field from text input to **dropdown select**
- Options include:
  - HR CEO
  - HR Manager
  - Employee
  - Barista
  - Shift Supervisor
  - Store Manager
  - Other
- If user selects "HR CEO" or "HR Manager", their role is automatically set to that position

### 3. Protected Pages
All HR management pages are now protected with `HROnlyRoute` component:
- ✅ `/employee-records` - Partner Records
- ✅ `/payroll` - Payroll Management
- ✅ `/recruitment` - Recruitment & Onboarding
- ✅ `/time-attendance` - Time & Attendance Management

**Access Control:**
- **HR CEO & HR Manager**: Full access to all pages and all employee data
- **All other roles**: Redirected to `/employee-dashboard` with access denied message

### 4. API Routes
All API routes filter data based on role:
- **HR CEO & HR Manager**: See all data (no filtering)
- **All other roles**: Only see their own data (filtered by `employee_id`)

### 5. Navigation
- Overview page shows different navigation based on role
- HR roles see: Partner Records, Payroll, Recruitment, Time & Attendance
- Other roles see: My Dashboard link

## How to Set Up HR Accounts

### Option 1: During Signup
1. Go to `/signup`
2. Select "HR CEO" or "HR Manager" from the Position dropdown
3. Complete signup
4. Role will be automatically set to the selected position

### Option 2: Update Existing User
Run this SQL in Supabase:

```sql
-- Update user role to HR CEO
update users 
set role = 'HR CEO'
where email = 'hr@example.com';

-- Or update to HR Manager
update users 
set role = 'HR Manager'
where email = 'hr@example.com';
```

## Testing

1. **Test HR Access:**
   - Login with HR CEO or HR Manager account
   - Should see all navigation links
   - Should access all pages
   - Should see all employee data

2. **Test Employee Access:**
   - Login with employee account
   - Should only see "My Dashboard" link
   - Should be redirected if trying to access HR pages
   - Should only see their own data in API responses

## Security

- ✅ All access checks happen on **server-side** (API routes)
- ✅ Frontend protection with `HROnlyRoute` component
- ✅ Employees cannot access other employees' data
- ✅ Only HR CEO and HR Manager can see all data

## Important Notes

- Role names are **case-sensitive**: "HR CEO" and "HR Manager" (not "hr ceo" or "Hr Manager")
- Position field in signup determines the role automatically
- Existing users with `role = 'hr'` need to be updated to "HR CEO" or "HR Manager"

