import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getAttendance as getAttendanceFs, calculateOvertimeForEmployee } from '../../../lib/data';
import { getUserFromRequest, applyRoleBasedFilter, isHR, validateEmployeeAccess } from '../../../lib/auth-helpers';

export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const employeeId = searchParams.get('employee_id');
	const startDate = searchParams.get('start_date');
	const endDate = searchParams.get('end_date');
	const date = searchParams.get('date');

	try {
		const user = getUserFromRequest(request);
		const supabase = getSupabaseServerClient();

		// Overtime calculator
		if (employeeId && startDate && endDate) {
			// Validate access to this employee's data
			if (!validateEmployeeAccess(user, employeeId)) {
				return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
			}
			const overtimeAmount = await calculateOvertimeForEmployee(employeeId, startDate, endDate);
			return NextResponse.json({ overtime_amount: overtimeAmount });
		}

    let query = supabase
            .from('attendance')
            .select('id, employee_id, date, time_in, time_out, hours_worked')
			.order('date', { ascending: false })
			.limit(1000);

		// Apply role-based filtering
		query = applyRoleBasedFilter(query, user, 'employee_id');

		if (employeeId) {
			// Validate access if specific employee requested
			if (!validateEmployeeAccess(user, employeeId)) {
				return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
			}
			query = query.eq('employee_id', employeeId);
		}
		if (date) query = query.eq('date', date);
		if (startDate && endDate) query = query.gte('date', startDate).lte('date', endDate);

		const { data, error } = await query;
		if (error) throw error;
		if (Array.isArray(data)) return NextResponse.json(data);

		// Fallback to filesystem (dev/demo)
		const attendance = await getAttendanceFs();
		// Apply role-based filtering to file-based data
		if (isHR(user)) {
			return NextResponse.json(attendance);
		} else if (user && user.employee_id) {
			const filtered = attendance.filter(a => a.employee_id === user.employee_id);
			return NextResponse.json(filtered);
		}
		return NextResponse.json([]);
	} catch (_err) {
		const attendance = await getAttendanceFs();
		// Apply role-based filtering even on error
		const user = getUserFromRequest(request);
		if (isHR(user)) {
			return NextResponse.json(attendance);
		} else if (user && user.employee_id) {
			const filtered = attendance.filter(a => a.employee_id === user.employee_id);
			return NextResponse.json(filtered);
		}
		return NextResponse.json([]);
	}
}

export async function POST(request) {
	try {
		const user = getUserFromRequest(request);
		const supabase = getSupabaseServerClient();
		const body = await request.json();
		
		// Validate access - employees can only create their own attendance
		if (!validateEmployeeAccess(user, body.employee_id)) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
		}
		
		const insert = {
			employee_id: body.employee_id,
			date: body.date,
			time_in: body.time_in ?? null,
			time_out: body.time_out ?? null,
			hours_worked: body.hours_worked ?? null,
			attendance_id: body.attendance_id ?? null
		};
		const { data, error } = await supabase.from('attendance').insert(insert).select('*').single();
		if (error) throw error;
		return NextResponse.json(data, { status: 201 });
	} catch (err) {
		return NextResponse.json({ error: String(err.message || err) }, { status: 400 });
	}
}

export async function PUT(request) {
	try {
		const user = getUserFromRequest(request);
		const supabase = getSupabaseServerClient();
		const body = await request.json();
		const { id, updates } = body || {};
		if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
		
		// First get the attendance record to check employee_id
		const { data: existing } = await supabase.from('attendance').select('employee_id').eq('id', id).single();
		if (existing && !validateEmployeeAccess(user, existing.employee_id)) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
		}
		
		// If updating employee_id, validate access to new employee_id
		if (updates.employee_id && !validateEmployeeAccess(user, updates.employee_id)) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
		}
		
		const { data, error } = await supabase.from('attendance').update(updates).eq('id', id).select('*').single();
		if (error) throw error;
		return NextResponse.json(data);
	} catch (err) {
		return NextResponse.json({ error: String(err.message || err) }, { status: 400 });
	}
}

export async function DELETE(request) {
	try {
		const user = getUserFromRequest(request);
		const supabase = getSupabaseServerClient();
		const { searchParams } = new URL(request.url);
		const id = searchParams.get('id');
		if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
		
		// First get the attendance record to check employee_id
		const { data: existing } = await supabase.from('attendance').select('employee_id').eq('id', id).single();
		if (existing && !validateEmployeeAccess(user, existing.employee_id)) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
		}
		
		const { error } = await supabase.from('attendance').delete().eq('id', id);
		if (error) throw error;
		return NextResponse.json({ ok: true });
	} catch (err) {
		return NextResponse.json({ error: String(err.message || err) }, { status: 400 });
	}
}
