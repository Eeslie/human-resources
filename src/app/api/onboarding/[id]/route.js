import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

export async function GET(request, { params }) {
	try {
		const { id } = await params;
		const supabase = getSupabaseServerClient();
		
		const { data, error } = await supabase
			.from('onboarding_tasks')
			.select('*')
			.eq('id', id)
			.single();

		if (error) throw error;
		return NextResponse.json(data);
	} catch (err) {
		console.error('Onboarding task fetch error:', err);
		return NextResponse.json({ error: 'Onboarding task not found' }, { status: 404 });
	}
}

export async function DELETE(request, { params }) {
	try {
		const { id } = await params;
		const supabase = getSupabaseServerClient();
		
		const { error } = await supabase
			.from('onboarding_tasks')
			.delete()
			.eq('id', id);

		if (error) throw error;
		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('Onboarding task delete error:', err);
		return NextResponse.json({ error: 'Failed to delete onboarding task' }, { status: 500 });
	}
}

