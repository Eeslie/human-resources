import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';

export async function POST(request) {
	try {
		const { type, start_date, end_date } = await request.json();
		const supabase = getSupabaseServerClient();
		let rows = [];
		if (type === 'attendance') {
			const { data } = await supabase
				.from('attendance')
				.select('date, time_in, time_out, hours_worked, employee:employee_id (first_name, last_name, department)')
				.gte('date', start_date)
				.lte('date', end_date)
				.order('date', { ascending: true });
			rows = (data || []).map(r => ({
				Date: r.date,
				Employee: `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}`.trim(),
				Department: r.employee?.department || '',
				'Time In': r.time_in || '',
				'Time Out': r.time_out || '',
				'Hours Worked': r.hours_worked || ''
			}));
		} else if (type === 'leave') {
			const { data } = await supabase
				.from('leave_request')
				.select('leave_type, start_date, end_date, status, employee_id')
				.gte('start_date', start_date)
				.lte('end_date', end_date)
				.order('start_date', { ascending: true });
			rows = (data || []).map(r => ({
				Type: r.leave_type,
				Start: r.start_date,
				End: r.end_date,
				Status: r.status
			}));
		} else {
			return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 });
		}

		// Return normalized rows for frontend to render or export to PDF
		return NextResponse.json({ type, start_date, end_date, rows });
	} catch (err) {
		return NextResponse.json({ error: String(err.message || err) }, { status: 400 });
	}
}


