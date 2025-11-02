import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

export async function GET(_req, { params }) {
	const { id } = await params;
	const supabase = getSupabaseServerClient();
	const { data, error } = await supabase.from('payroll').select('*').eq('id', id).single();
	if (error) return NextResponse.json({ error: error.message }, { status: 404 });
	return NextResponse.json(data);
}

export async function PUT(request, { params }) {
	const { id } = await params;
	const body = await request.json();
	const supabase = getSupabaseServerClient();
	const updates = {
		status: body.status,
		salary_base: body.salary_base !== undefined ? String(body.salary_base) : undefined,
		bonus: body.bonus !== undefined ? String(body.bonus) : undefined,
		overtime: body.overtime !== undefined ? String(body.overtime) : undefined,
		payroll_date: body.payroll_date || body.Payroll_date
	};
	const { data, error } = await supabase
		.from('payroll')
		.update(updates)
		.eq('id', id)
		.select('*')
		.single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json(data);
}

export async function DELETE(_req, { params }) {
	const { id } = await params;
	const supabase = getSupabaseServerClient();
	const { error } = await supabase.from('payroll').delete().eq('id', id);
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ ok: true });
}

