import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

export async function GET(request, { params }) {
	try {
		const { id } = await params;
		const supabase = getSupabaseServerClient();
		
		const { data, error } = await supabase
			.from('applicant')
			.select(`
				*,
				recruitment:vacancy_id (
					job_title,
					departments:department_id (
						department_name
					)
				)
			`)
			.eq('id', id)
			.single();

		if (error) throw error;
		return NextResponse.json(data);
	} catch (err) {
		console.error('Applicant fetch error:', err);
		return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
	}
}

export async function PUT(request, { params }) {
	try {
		const { id } = await params;
		const body = await request.json();
		const supabase = getSupabaseServerClient();
		
		// Map the data to match database columns
		const mappedData = {
			full_name: body.full_name || body.name,
			email: body.email,
			phone: body.phone,
			contact_info: body.contact_info || body.phone,
			position: body.position,
			experience: body.experience,
			rating: typeof body.rating === 'number' ? body.rating : undefined,
			application_status: body.status || body.application_status,
			source: body.source,
			notes: body.notes,
			updated_at: new Date().toISOString()
		};

		// Remove undefined values
		Object.keys(mappedData).forEach(key => {
			if (mappedData[key] === undefined || mappedData[key] === null) {
				delete mappedData[key];
			}
		});

		const { data, error } = await supabase
			.from('applicant')
			.update(mappedData)
			.eq('id', id)
			.select(`
				*,
				recruitment:vacancy_id (
					job_title,
					departments:department_id (
						department_name
					)
				)
			`)
			.single();

		if (error) throw error;
		return NextResponse.json(data);
	} catch (err) {
		console.error('Applicant update error:', err);
		return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 });
	}
}

export async function DELETE(request, { params }) {
	try {
		const { id } = await params;
		const supabase = getSupabaseServerClient();
		
		const { error } = await supabase
			.from('applicant')
			.delete()
			.eq('id', id);

		if (error) throw error;
		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('Applicant delete error:', err);
		return NextResponse.json({ error: 'Failed to delete applicant' }, { status: 500 });
	}
}

