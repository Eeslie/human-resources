import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getPayrolls as getPayrollsFs, savePayrolls as savePayrollsFs, upsertPayroll as upsertPayrollFs } from '../../../lib/data';

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
	
	// Prepare payload with all fields for file-based storage
	// If salary_base is set, automatically set status to 'Approved'
	const hasSalary = body.salary_base !== undefined && body.salary_base !== null && Number(body.salary_base) > 0;
	const defaultStatus = hasSalary ? 'Approved' : (body.status || 'Pending');
	
	const payload = {
		id: crypto.randomUUID(),
		created_at: new Date().toISOString(),
		payroll_id: body.payroll_id || crypto.randomUUID(),
		employee_id: body.employee_id,
		salary_base: Number(body.salary_base) || 0,
		bonus: Number(body.bonus) || 0,
		overtime: Number(body.overtime) || 0,
		deductions: Number(body.deductions) || 0,
		payroll_date: body.Payroll_date || body.payroll_date || null,
		status: body.status || defaultStatus
	};
	
	// Use file-based storage directly since it supports all fields including deductions
	try {
		const saved = await upsertPayrollFs(payload);
		return NextResponse.json(saved, { status: 201 });
	} catch (err) {
		console.error('Failed to save payroll:', err?.message || err);
		return NextResponse.json({ error: 'Failed to save payroll', details: String(err?.message || err) }, { status: 500 });
	}
}

