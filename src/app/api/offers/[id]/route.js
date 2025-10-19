import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

export async function PUT(request, { params }) {
	const { id } = params;
	const body = await request.json();
	const supabase = getSupabaseServerClient();

	// Update offer status
	const { data: offer, error: offerErr } = await supabase
		.from('offers')
		.update({ status: body.status })
		.eq('id', id)
		.select('*')
		.single();
	if (offerErr) return NextResponse.json({ error: offerErr.message }, { status: 500 });

	// If accepted, create employee from applicant
	if (body.status === 'Accepted') {
		const { data: applicant, error: appErr } = await supabase
			.from('applicants')
			.select('*')
			.eq('id', offer.applicant_id)
			.single();
		if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 });

		const [first_name, ...rest] = (applicant.full_name || '').split(' ');
		const last_name = rest.join(' ') || 'Candidate';
		const { error: empErr } = await supabase.from('employee').insert({
			first_name,
			last_name,
			contact_info: applicant.email || null,
			status: 'Active',
			employment_type: 'Full-time',
			employee_id: crypto.randomUUID()
		});
		if (empErr) return NextResponse.json({ error: empErr.message }, { status: 500 });
	}

	return NextResponse.json(offer);
}


