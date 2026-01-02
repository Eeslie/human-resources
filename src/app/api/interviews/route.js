import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getInterviews as getInterviewsFs, addInterview as addInterviewFs } from '../../../lib/data';

export async function GET() {
	try {
		const supabase = getSupabaseServerClient();
		const { data, error } = await supabase
			.from('interviews')
			.select('*')
			.order('created_at', { ascending: false });
		
		if (error) {
			// If table doesn't exist, return empty array
			if (error.code === 'PGRST205') {
				return NextResponse.json([]);
			}
			throw error;
		}
		return NextResponse.json(data ?? []);
	} catch (err) {
		console.error('Interviews fetch error:', err);
		// Return empty array if table doesn't exist
		return NextResponse.json([]);
	}
}

export async function POST(request) {
	try {
		const body = await request.json();
		const supabase = getSupabaseServerClient();
		
		// Prepare the data for insertion - using basic fields
		const insertData = {
			candidate: body.candidate,
			position: body.position,
			date: body.date || body.interview_date,
			time: body.time || body.interview_time,
			type: body.type || body.interview_type || 'Interview'
		};

		// Add optional fields
		if (body.applicant_id) insertData.applicant_id = body.applicant_id;
		if (body.vacancy_id) insertData.vacancy_id = body.vacancy_id;
		if (body.interviewer) insertData.interviewer = body.interviewer;
		if (body.location) insertData.location = body.location;
		if (body.status) insertData.status = body.status;
		if (body.notes) insertData.notes = body.notes;
		if (body.feedback) insertData.feedback = body.feedback;
		if (body.result) insertData.result = body.result;

		// Remove undefined values
		Object.keys(insertData).forEach(key => {
			if (insertData[key] === undefined || insertData[key] === null) {
				delete insertData[key];
			}
		});

		const { data, error } = await supabase
			.from('interviews')
			.insert(insertData)
			.select('*')
			.single();

		if (error) {
			// If table doesn't exist, fall back to file system
			if (error.code === 'PGRST205') {
				const created = await addInterviewFs(body);
				return NextResponse.json(created, { status: 201 });
			}
			throw error;
		}
		return NextResponse.json(data, { status: 201 });
	} catch (err) {
		console.error('Interview create error:', err);
		// Fall back to file system
		try {
			const created = await addInterviewFs(body);
			return NextResponse.json(created, { status: 201 });
		} catch (fallbackErr) {
			return NextResponse.json({ error: 'Failed to create interview' }, { status: 500 });
		}
	}
}

