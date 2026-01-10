import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getPayrolls as getPayrollsFs, savePayrolls as savePayrollsFs, upsertPayroll as upsertPayrollFs } from '../../../lib/data';
import { getUserFromRequest, isHR } from '../../../lib/auth-helpers';

export async function GET(request) {
	try {
		const user = getUserFromRequest(request);
		const supabase = getSupabaseServerClient();
		
		let query = supabase.from('payroll').select('*');
		
		// Apply role-based filtering
		if (!user) {
			return NextResponse.json([]);
		}
		
		if (isHR(user)) {
			// HR sees all payroll data
			query = query.order('created_at', { ascending: false });
		} else if (user.employee_id) {
			// Employee sees only their own payroll
			query = query.eq('employee_id', user.employee_id).order('created_at', { ascending: false });
		} else {
			return NextResponse.json([]);
		}
		
		const { data, error } = await query;
		if (error) throw error;
		if (Array.isArray(data) && data.length > 0) return NextResponse.json(data);
		
		// Fallback to file-based storage
		const fsData = await getPayrollsFs();
		if (isHR(user)) {
			return NextResponse.json(fsData ?? []);
		} else if (user.employee_id) {
			const filtered = (fsData || []).filter(p => p.employee_id === user.employee_id);
			return NextResponse.json(filtered);
		}
		return NextResponse.json([]);
	} catch (err) {
		const fsData = await getPayrollsFs();
		const user = getUserFromRequest(request);
		if (isHR(user)) {
			return NextResponse.json(fsData ?? []);
		} else if (user && user.employee_id) {
			const filtered = (fsData || []).filter(p => p.employee_id === user.employee_id);
			return NextResponse.json(filtered);
		}
		return NextResponse.json([]);
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

