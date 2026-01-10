import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, position')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        position: user.position
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}

