import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getDepartments as getDepartmentsFs } from '../../../lib/data';

export async function GET() {
	try {
		const supabase = getSupabaseServerClient();
		const { data, error } = await supabase.from('departments').select('*').order('created_at', { ascending: false });
		if (error) throw error;
		return NextResponse.json(data ?? []);
	} catch (_) {
		const fsDepartments = await getDepartmentsFs();
		return NextResponse.json(fsDepartments ?? []);
	}
}
