import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';

// Timesheets are computed aggregates from attendance between a date range per employee
export async function GET(request) {
	try {
		const supabase = getSupabaseServerClient();
		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get('start_date');
		const endDate = searchParams.get('end_date');
		if (!startDate || !endDate) return NextResponse.json({ error: 'start_date and end_date required' }, { status: 400 });

		// Fetch attendance with employees
		const { data, error } = await supabase
			.from('attendance')
			.select('employee_id, hours_worked, date, employee:employee_id (id, first_name, last_name, job_title, department)')
			.gte('date', startDate)
			.lte('date', endDate);
		if (error) throw error;

		// Aggregate by employee
		const map = new Map();
		for (const row of data || []) {
			const key = row.employee_id;
			const prev = map.get(key) || { employee_id: key, employee: row.employee, total_hours: 0, days: 0 };
			const hours = Number(row.hours_worked || 0);
			prev.total_hours += hours;
			prev.days += 1;
			map.set(key, prev);
		}
		const result = Array.from(map.values()).map(r => ({ ...r, avg_hours: r.days ? +(r.total_hours / r.days).toFixed(2) : 0 }));
		return NextResponse.json(result);
	} catch (err) {
		return NextResponse.json({ error: String(err.message || err) }, { status: 400 });
	}
}


