import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getOffers as getOffersFs, addOffer as addOfferFs } from '../../../lib/data';

export async function GET() {
	try {
		const supabase = getSupabaseServerClient();
		const { data, error } = await supabase
			.from('offers')
			.select(`
				*,
				applicant:applicant_id (
					full_name,
					email,
					phone
				)
			`)
			.order('created_at', { ascending: false });
		
		if (error) throw error;
		return NextResponse.json(data ?? []);
	} catch (err) {
		console.error('Offers fetch error:', err);
		return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
	}
}

export async function POST(request) {
	try {
		const body = await request.json();
		const supabase = getSupabaseServerClient();
		
		// Prepare the data for insertion
		const insertData = {
			candidate: body.candidate,
			position: body.position,
			salary: body.salary,
			currency: body.currency || 'USD',
			benefits: body.benefits,
			start_date: body.start_date,
			offer_date: body.offer_date || new Date().toISOString().slice(0, 10),
			expiry_date: body.expiry_date,
			status: body.status || 'Pending',
			notes: body.notes,
			created_by: body.created_by
		};

		// Handle applicant_id if provided
		if (body.applicant_id) {
			insertData.applicant_id = body.applicant_id;
		}

		// Remove undefined values
		Object.keys(insertData).forEach(key => {
			if (insertData[key] === undefined || insertData[key] === null) {
				delete insertData[key];
			}
		});

		const { data, error } = await supabase
			.from('offers')
			.insert(insertData)
			.select(`
				*,
				applicant:applicant_id (
					full_name,
					email,
					phone
				)
			`)
			.single();

		if (error) throw error;
		return NextResponse.json(data, { status: 201 });
	} catch (err) {
		console.error('Offer create error:', err);
		return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
	}
}

