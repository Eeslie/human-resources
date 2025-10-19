import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getEmployees as getEmployeesFs, saveEmployees as saveEmployeesFs } from '../../../lib/data';

function isUuid(value) {
	return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET() {
	try {
		const supabase = getSupabaseServerClient();
		const { data, error } = await supabase.from('employee').select('*').order('created_at', { ascending: false });
		if (error) throw error;
		if (Array.isArray(data) && data.length > 0) return NextResponse.json(data);
		// Fallback to filesystem if Supabase is empty (e.g., RLS/policies block inserts)
		const fsEmployees = await getEmployeesFs();
		return NextResponse.json(fsEmployees);
	} catch (err) {
		// Fallback to filesystem storage if Supabase is unavailable or table missing
		const fsEmployees = await getEmployeesFs();
		return NextResponse.json(fsEmployees);
	}
}

export async function POST(request) {
	const body = await request.json();
	if (!body || !body.first_name || !body.last_name) {
		return NextResponse.json({ error: 'first_name and last_name are required' }, { status: 400 });
	}
	try {
		const supabase = getSupabaseServerClient();
		// Only insert known columns in your current schema
		const payload = {
			first_name: body.first_name,
			last_name: body.last_name,
			job_title: body.job_title ?? null,
			contact_info: body.contact_info ?? null,
			hire_date: body.hire_date ?? null,
			// prefer free-text department; keep department_id null for backward compatibility
			department_id: null,
			department: body.department ?? null,
			address: body.address ?? null,
			employment_type: body.employment_type || 'Full-time',
			status: body.status || 'Active',
			employee_id: body.employee_id ?? crypto.randomUUID()
		};
		const { data, error } = await supabase.from('employee').insert(payload).select('*').single();
		if (error) throw error;
		return NextResponse.json(data, { status: 201 });
	} catch (err) {
		console.error('Supabase insert employee failed:', err?.message || err);
		return NextResponse.json({ error: 'Supabase insert failed', details: String(err?.message || err) }, { status: 500 });
	}
}


