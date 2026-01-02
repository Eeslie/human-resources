import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';

export async function GET() {
	const supabase = getSupabaseServerClient();
	const { data, error } = await supabase
		.from('evaluations')
		.select('*, applicants:applicant_id ( id, full_name, email )')
		.order('created_at', { ascending: false });
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json(data ?? []);
}

export async function POST(request) {
	const body = await request.json();
	const supabase = getSupabaseServerClient();
	const payload = {
		applicant_id: body.applicant_id,
		reviewer: body.reviewer,
		communication: body.communication,
		technical: body.technical,
		culture_fit: body.culture_fit,
		comments: body.comments || null
	};
	const { data, error } = await supabase.from('evaluations').insert(payload).select('*').single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json(data, { status: 201 });
}


