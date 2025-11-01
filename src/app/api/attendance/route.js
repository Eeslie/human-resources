import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getAttendance as getAttendanceFs, calculateOvertimeForEmployee } from '../../../lib/data';

export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const employeeId = searchParams.get('employee_id');
	const startDate = searchParams.get('start_date');
	const endDate = searchParams.get('end_date');
	const date = searchParams.get('date');

	try {
		const supabase = getSupabaseServerClient();

		// Overtime calculator
		if (employeeId && startDate && endDate) {
			const overtimeAmount = await calculateOvertimeForEmployee(employeeId, startDate, endDate);
			return NextResponse.json({ overtime_amount: overtimeAmount });
		}

    let query = supabase
            .from('attendance')
            .select('id, employee_id, date, time_in, time_out, hours_worked')
			.order('date', { ascending: false })
			.limit(1000);

		if (employeeId) query = query.eq('employee_id', employeeId);
		if (date) query = query.eq('date', date);
		if (startDate && endDate) query = query.gte('date', startDate).lte('date', endDate);

		const { data, error } = await query;
		if (error) throw error;
		if (Array.isArray(data)) return NextResponse.json(data);

		// Fallback to filesystem (dev/demo)
		const attendance = await getAttendanceFs();
		return NextResponse.json(attendance);
	} catch (_err) {
		const attendance = await getAttendanceFs();
		return NextResponse.json(attendance);
	}
}

export async function POST(request) {
	try {
		const supabase = getSupabaseServerClient();
		const body = await request.json();
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
		const supabase = getSupabaseServerClient();
		const body = await request.json();
		const { id, updates } = body || {};
		if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
		const { data, error } = await supabase.from('attendance').update(updates).eq('id', id).select('*').single();
		if (error) throw error;
		return NextResponse.json(data);
	} catch (err) {
		return NextResponse.json({ error: String(err.message || err) }, { status: 400 });
	}
}

export async function DELETE(request) {
	try {
		const supabase = getSupabaseServerClient();
		const { searchParams } = new URL(request.url);
		const id = searchParams.get('id');
		if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
		const { error } = await supabase.from('attendance').delete().eq('id', id);
		if (error) throw error;
		return NextResponse.json({ ok: true });
	} catch (err) {
		return NextResponse.json({ error: String(err.message || err) }, { status: 400 });
	}
}
