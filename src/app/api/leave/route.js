import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';

export async function GET(request) {
	try {
		const supabase = getSupabaseServerClient();
		const { searchParams } = new URL(request.url);
		const employeeId = searchParams.get('employee_id');
		let query = supabase.from('leave_request').select('*').order('created_at', { ascending: false });
		if (employeeId) query = query.eq('employee_id', employeeId);
		const { data, error } = await query;
		if (error) throw error;
		return NextResponse.json(data ?? []);
	} catch (err) {
		return NextResponse.json([], { status: 200 });
	}
}

export async function POST(request) {
	try {
		const supabase = getSupabaseServerClient();
		const body = await request.json();

		// Resolve employee identifier to UUID if an external code was provided
		const isUuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
		let employeeUuid = body.employee_id;
		if (!employeeUuid) {
			throw new Error('Missing employee_id');
		}
		if (!isUuid(employeeUuid)) {
			const { data: emp, error: empErr } = await supabase.from('employee').select('id').eq('employee_id', employeeUuid).single();
			if (empErr || !emp?.id) {
				throw new Error('Invalid employee_id: no matching employee');
			}
			employeeUuid = emp.id;
		}

		const insert = {
			employee_id: employeeUuid,
			leave_type: body.leave_type,
			start_date: body.start_date,
			end_date: body.end_date,
			status: body.status ?? 'Pending'
		};

		const { data, error } = await supabase.from('leave_request').insert(insert).select('*').single();
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
		const { data, error } = await supabase.from('leave_request').update(updates).eq('id', id).select('*').single();
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
		const { error } = await supabase.from('leave_request').delete().eq('id', id);
		if (error) throw error;
		return NextResponse.json({ ok: true });
	} catch (err) {
		return NextResponse.json({ error: String(err.message || err) }, { status: 400 });
	}
}


