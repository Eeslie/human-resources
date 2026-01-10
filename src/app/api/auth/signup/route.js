import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';
import crypto from 'crypto';

// Simple password hashing function
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, fullName, position } = body;

    if (!email || !password || !fullName || !position) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Check if email exists in employee table's contact_info
    // Try to find matching employee by email (case-insensitive)
    let employeeId = null;
    try {
      const { data: employee } = await supabase
        .from('employee')
        .select('id')
        .ilike('contact_info', email) // Case-insensitive match
        .maybeSingle();
      
      if (employee) {
        employeeId = employee.id;
      }
    } catch (empErr) {
      // If employee table doesn't exist or query fails, continue without linking
      console.log('Could not check employee table:', empErr?.message);
    }

    // Create user (position determines access level)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        full_name: fullName,
        position,
        employee_id: employeeId, // Auto-link if employee found
        created_at: new Date().toISOString()
      })
      .select('id, email, full_name, position, employee_id')
      .single();

    if (insertError) {
      // If table doesn't exist, create it first (for development)
      if (insertError.message?.includes('relation "users" does not exist')) {
        // Try to create the table
        await supabase.rpc('create_users_table_if_not_exists').catch(() => {});
        // Return error asking to create table manually
        return NextResponse.json(
          { error: 'Database table not found. Please create users table in Supabase.' },
          { status: 500 }
        );
      }
      throw insertError;
    }

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        position: newUser.position,
        employeeId: newUser.employee_id
      },
      token: 'authenticated'
    }, { status: 201 });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: err.message || 'Signup failed' },
      { status: 500 }
    );
  }
}

