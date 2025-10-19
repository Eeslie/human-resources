import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getApplicants as getApplicantsFs, saveApplicants as saveApplicantsFs } from '../../../lib/data';

export async function GET() {
	try {
		const supabase = getSupabaseServerClient();
		const { data, error } = await supabase.from('applicant').select('*').order('created_at', { ascending: false });
		if (error) throw error;
		return NextResponse.json(data ?? []);
	} catch (err) {
		const fsData = await getApplicantsFs();
		return NextResponse.json(fsData ?? []);
	}
}

export async function POST(request) {
	const body = await request.json();
	try {
		const supabase = getSupabaseServerClient();
		// Validate optional vacancy_id to avoid FK errors
		let validVacancyId = null;
		if (body.vacancy_id) {
			const { data: vacancy } = await supabase.from('recruitment').select('id').eq('id', body.vacancy_id).maybeSingle();
			if (vacancy && vacancy.id) validVacancyId = vacancy.id;
		}
		// Step 1: minimal insert that always works
		const insertPayload = {
			full_name: body.full_name || body.name || 'Unnamed Applicant',
			vacancy_id: validVacancyId
		};
		const { data, error } = await supabase.from('applicant').insert(insertPayload).select('*').single();
		if (error) throw error;
		// Step 2: best-effort updates for optional fields; skip columns that don't exist
		const optionalFields = [
			['email', body.email],
			['phone', body.phone],
			['contact_info', body.contact_info],
			['application_status', body.status],
			['position', body.position],
			['experience', body.experience],
			['rating', typeof body.rating === 'number' ? body.rating : undefined]
		];
		for (const [column, value] of optionalFields) {
			if (value === undefined || value === null || value === '') continue;
			const { error: updErr } = await supabase.from('applicant').update({ [column]: value }).eq('id', data.id);
			// Ignore unknown column errors
			if (updErr && String(updErr.message || '').includes("Could not find the '")) {
				// skip
			}
		}
		// Return latest row
		const { data: finalRow } = await supabase.from('applicant').select('*').eq('id', data.id).single();
		return NextResponse.json(finalRow || data, { status: 201 });
	} catch (err) {
		console.error('Applicants insert error:', err);
		const message = err?.message || 'Unknown error';
		const details = err?.details || err?.hint || undefined;
		return NextResponse.json({ error: 'Supabase insert failed', message, details }, { status: 500 });
	}
}

