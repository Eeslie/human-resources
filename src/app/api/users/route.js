import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getUserFromRequest, isHR } from '../../../lib/auth-helpers';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    
    // Only HR can view all users
    if (!isHR(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, position, employee_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Users fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = getUserFromRequest(request);
    
    // Only HR can update user accounts
    if (!isHR(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, employeeId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Update user's employee_id
    const { data, error } = await supabase
      .from('users')
      .update({ employee_id: employeeId || null })
      .eq('id', userId)
      .select('id, email, full_name, position, employee_id')
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('User update error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 });
  }
}

