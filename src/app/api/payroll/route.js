import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getPayrolls as getPayrollsFs, savePayrolls as savePayrollsFs } from '../../../lib/data';

export async function GET() {
	try {
		const supabase = getSupabaseServerClient();
		const { data, error } = await supabase.from('payroll').select('*').order('created_at', { ascending: false });
		if (error) throw error;
		if (Array.isArray(data) && data.length > 0) return NextResponse.json(data);
		const fsData = await getPayrollsFs();
		return NextResponse.json(fsData ?? []);
	} catch (err) {
		const fsData = await getPayrollsFs();
		return NextResponse.json(fsData ?? []);
	}
}

export async function POST(request) {
	const body = await request.json();
	// Prepare mapped payload
	const payload = {
		payroll_id: body.payroll_id,
		employee_id: body.employee_id,
		salary_base: String(body.salary_base ?? ''),
		bonus: String(body.bonus ?? ''),
		overtime: String(body.overtime ?? '')
	};
	try {
		const supabase = getSupabaseServerClient();
		// If the column is case-sensitive, also set Payroll_date
		const sbPayload = { ...payload };
		// Your table uses capitalized column name: "Payroll_date"
		sbPayload['payroll_date'] = body.Payroll_date || body.payroll_date || null;
		const { data, error } = await supabase.from('payroll').insert(sbPayload).select('*').single();
		if (error) throw error;
		return NextResponse.json(data, { status: 201 });
	} catch (err) {
		console.error('Supabase insert payroll failed:', err?.message || err);
		return NextResponse.json({ error: 'Supabase insert failed', details: String(err?.message || err) }, { status: 500 });
	}
}

