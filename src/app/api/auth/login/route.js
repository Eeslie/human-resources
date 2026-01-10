import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';
import crypto from 'crypto';

// Simple password hashing function (same as signup)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const hashedPassword = hashPassword(password);

    // Find user by email and password
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, position, employee_id')
      .eq('email', email)
      .eq('password', hashedPassword)
      .maybeSingle();

    if (error) {
      console.error('Login error:', error);
      return NextResponse.json(
        { error: 'Login failed. Please check your credentials.' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // If user doesn't have employee_id linked, try to auto-link by email
    if (!user.employee_id) {
      try {
        const { data: employee } = await supabase
          .from('employee')
          .select('id')
          .ilike('contact_info', email) // Case-insensitive match
          .maybeSingle();
        
        if (employee) {
          // Update user with employee_id
          const { error: updateError } = await supabase
            .from('users')
            .update({ employee_id: employee.id })
            .eq('id', user.id);
          
          if (!updateError) {
            user.employee_id = employee.id;
          }
        }
      } catch (empErr) {
        // If employee table doesn't exist or query fails, continue without linking
        console.log('Could not check employee table:', empErr?.message);
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        position: user.position,
        employeeId: user.employee_id
      },
      token: 'authenticated'
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: err.message || 'Login failed' },
      { status: 500 }
    );
  }
}

