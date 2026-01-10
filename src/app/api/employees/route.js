import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getEmployees as getEmployeesFs, saveEmployees as saveEmployeesFs } from '../../../lib/data';
import { getUserFromRequest, applyRoleBasedFilter, isHR } from '../../../lib/auth-helpers';

function isUuid(value) {
	return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request) {
	try {
		const user = getUserFromRequest(request);
		const supabase = getSupabaseServerClient();
		
		let query = supabase.from('employee').select('*');
		
		// Apply role-based filtering - for employees table, filter by id matching employee_id
		if (!user) {
			// No user = no access
			return NextResponse.json([]);
		}
		
		if (isHR(user)) {
			// HR sees everything - no filter
			query = query.order('created_at', { ascending: false });
		} else if (user.employee_id) {
			// Employee sees only their own record - match employee.id with user.employee_id
			query = query.eq('id', user.employee_id).order('created_at', { ascending: false });
		} else {
			// No employee_id = no access
			return NextResponse.json([]);
		}
		
		const { data, error } = await query;
		if (error) throw error;
		if (Array.isArray(data) && data.length > 0) {
			const mapped = data.map(e => ({ ...e, full_name: `${e.first_name || ''} ${e.last_name || ''}`.trim() }));
			return NextResponse.json(mapped);
		}
		// If no data from Supabase, try file-based storage
	} catch (err) {
		console.log('Supabase fetch failed, using file-based storage:', err?.message || err);
	}
	// Always check file-based storage as well and merge results
	try {
		const fsEmployees = await getEmployeesFs();
		if (Array.isArray(fsEmployees) && fsEmployees.length > 0) {
			// Apply role-based filtering to file-based data too
			const user = getUserFromRequest(request);
			if (isHR(user)) {
				return NextResponse.json(fsEmployees);
			} else if (user && user.employee_id) {
				// Filter to only the employee's own record
				const filtered = fsEmployees.filter(emp => emp.id === user.employee_id);
				return NextResponse.json(filtered);
			}
			return NextResponse.json([]);
		}
	} catch (fsErr) {
		console.error('File-based storage fetch failed:', fsErr?.message || fsErr);
	}
	// Return empty array if both fail
	return NextResponse.json([]);
}

export async function POST(request) {
	const body = await request.json();
	if (!body || !body.first_name || !body.last_name) {
		return NextResponse.json({ error: 'first_name and last_name are required' }, { status: 400 });
	}
	
	const payload = {
		id: body.id || crypto.randomUUID(),
		created_at: body.created_at || new Date().toISOString(),
		first_name: body.first_name,
		last_name: body.last_name,
		job_title: body.job_title ?? null,
		contact_info: body.contact_info ?? null,
		hire_date: body.hire_date ?? null,
		department_id: null,
		department: body.department ?? null,
		address: body.address ?? null,
		employment_type: body.employment_type || 'Full-time',
		status: body.status || 'Active',
		employee_id: body.employee_id ?? crypto.randomUUID()
	};
	
	// Try Supabase first
	try {
		const supabase = getSupabaseServerClient();
		const { data, error } = await supabase.from('employee').insert(payload).select('*').single();
		if (!error && data) {
			// Also save to file-based storage for consistency
			try {
				const employees = await getEmployeesFs();
				employees.push({ ...payload, ...data });
				await saveEmployeesFs(employees);
			} catch (fsErr) {
				console.log('File-based save failed (non-critical):', fsErr?.message);
			}
			return NextResponse.json(data, { status: 201 });
		}
		throw error;
	} catch (err) {
		console.log('Supabase insert failed, using file-based storage:', err?.message || err);
		// Fallback to file-based storage
		try {
			const employees = await getEmployeesFs();
			employees.push(payload);
			await saveEmployeesFs(employees);
			return NextResponse.json(payload, { status: 201 });
		} catch (fsErr) {
			console.error('File-based storage failed:', fsErr?.message || fsErr);
			return NextResponse.json({ error: 'Failed to save employee', details: String(fsErr?.message || fsErr) }, { status: 500 });
		}
	}
}


