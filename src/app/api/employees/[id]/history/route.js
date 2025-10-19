import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../../lib/supabaseServer';

export async function GET(_req, { params }) {
	const { id } = params;
	const supabase = getSupabaseServerClient();
	const { data, error } = await supabase
		.from('employee_history')
		.select('*')
		.eq('employee_id', id)
		.order('date', { ascending: false });
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json(data ?? []);
}

export async function POST(request, { params }) {
	const { id } = params;
	const body = await request.json();
	if (!body || !body.action || !body.description) {
		return NextResponse.json({ error: 'action and description are required' }, { status: 400 });
	}
	const supabase = getSupabaseServerClient();
	const payload = { employee_id: id, status: body.status || 'info', action: body.action, description: body.description, date: body.date };
	const { data, error } = await supabase.from('employee_history').insert(payload).select('*').single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json(data, { status: 201 });
}


