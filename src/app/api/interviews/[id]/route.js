import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

export async function GET(request, { params }) {
	try {
		const { id } = await params;
		const supabase = getSupabaseServerClient();
		
		const { data, error } = await supabase
			.from('interviews')
			.select(`
				*,
				applicant:applicant_id (
					full_name,
					email,
					phone
				),
				recruitment:vacancy_id (
					job_title
				)
			`)
			.eq('id', id)
			.single();

		if (error) throw error;
		return NextResponse.json(data);
	} catch (err) {
		console.error('Interview fetch error:', err);
		return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
	}
}

export async function PUT(request, { params }) {
	try {
		const { id } = await params;
		const body = await request.json();
		const supabase = getSupabaseServerClient();
		
		// Map the data to match database columns
		const mappedData = {
			candidate: body.candidate,
			position: body.position,
			interview_date: body.date || body.interview_date,
			interview_time: body.time || body.interview_time,
			interview_type: body.type || body.interview_type,
			interviewer: body.interviewer,
			location: body.location,
			status: body.status,
			notes: body.notes,
			feedback: body.feedback,
			result: body.result,
			updated_at: new Date().toISOString()
		};

		// Remove undefined values
		Object.keys(mappedData).forEach(key => {
			if (mappedData[key] === undefined || mappedData[key] === null) {
				delete mappedData[key];
			}
		});

		const { data, error } = await supabase
			.from('interviews')
			.update(mappedData)
			.eq('id', id)
			.select(`
				*,
				applicant:applicant_id (
					full_name,
					email,
					phone
				),
				recruitment:vacancy_id (
					job_title
				)
			`)
			.single();

		if (error) throw error;
		return NextResponse.json(data);
	} catch (err) {
		console.error('Interview update error:', err);
		return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 });
	}
}

export async function DELETE(request, { params }) {
	try {
		const { id } = await params;
		const supabase = getSupabaseServerClient();
		
		const { error } = await supabase
			.from('interviews')
			.delete()
			.eq('id', id);

		if (error) throw error;
		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('Interview delete error:', err);
		return NextResponse.json({ error: 'Failed to delete interview' }, { status: 500 });
	}
}

