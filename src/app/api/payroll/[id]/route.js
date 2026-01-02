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
	
	// Try Supabase first
	try {
		const supabase = getSupabaseServerClient();
		const updates = {};
		
		// Only include fields that are provided
		// If salary_base is being set/updated, automatically set status to 'Approved'
		if (body.salary_base !== undefined) {
			updates.salary_base = String(body.salary_base);
			// If salary is being set and status is not explicitly provided, set to Approved
			if (body.status === undefined && Number(body.salary_base) > 0) {
				updates.status = 'Approved';
			}
		}
		if (body.status !== undefined) updates.status = body.status;
		if (body.bonus !== undefined) updates.bonus = String(body.bonus);
		if (body.overtime !== undefined) updates.overtime = String(body.overtime);
		if (body.deductions !== undefined) updates.deductions = String(body.deductions);
		if (body.payroll_date || body.Payroll_date) updates.payroll_date = body.payroll_date || body.Payroll_date;
		
		const { data, error } = await supabase
			.from('payroll')
			.update(updates)
			.eq('id', id)
			.select('*')
			.single();
		if (error) throw error;
		return NextResponse.json(data);
	} catch (err) {
		// Fallback to file-based storage
		const { getPayrolls, savePayrolls } = await import('../../../../lib/data');
		const payrolls = await getPayrolls();
		const index = payrolls.findIndex(p => String(p.id) === String(id));
		
		if (index === -1) {
			return NextResponse.json({ error: 'Payroll entry not found' }, { status: 404 });
		}
		
		// Update the payroll entry
		// If salary_base is being set/updated, automatically set status to 'Approved'
		if (body.salary_base !== undefined) {
			payrolls[index].salary_base = Number(body.salary_base);
			// If salary is being set and status is not explicitly provided, set to Approved
			if (body.status === undefined && Number(body.salary_base) > 0) {
				payrolls[index].status = 'Approved';
			}
		}
		if (body.bonus !== undefined) payrolls[index].bonus = Number(body.bonus);
		if (body.overtime !== undefined) payrolls[index].overtime = Number(body.overtime);
		if (body.deductions !== undefined) payrolls[index].deductions = Number(body.deductions);
		if (body.status !== undefined) payrolls[index].status = body.status;
		if (body.payroll_date || body.Payroll_date) payrolls[index].payroll_date = body.payroll_date || body.Payroll_date;
		
		await savePayrolls(payrolls);
		return NextResponse.json(payrolls[index]);
	}
}

export async function DELETE(_req, { params }) {
	const { id } = await params;
	const supabase = getSupabaseServerClient();
	const { error } = await supabase.from('payroll').delete().eq('id', id);
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ ok: true });
}

