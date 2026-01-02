import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';

export async function GET(request, { params }) {
	try {
		const { id } = await params;
		const supabase = getSupabaseServerClient();
		
		const { data, error } = await supabase
			.from('recruitment')
			.select(`
				*,
				departments:department_id (
					department_name
				)
			`)
			.eq('id', id)
			.single();

		if (error) throw error;
		return NextResponse.json(data);
	} catch (err) {
		console.error('Recruitment fetch error:', err);
		return NextResponse.json({ error: 'Job not found' }, { status: 404 });
	}
}

export async function PUT(request, { params }) {
	try {
		const { id } = await params;
		const body = await request.json();
		const supabase = getSupabaseServerClient();
		
		// Handle department_id - if it's not a valid UUID, try to find department by name
		let departmentId = body.department_id || body.department;
		if (departmentId && !isValidUUID(departmentId)) {
			// Try to find department by name
			const { data: deptData } = await supabase
				.from('departments')
				.select('id')
				.eq('department_name', departmentId)
				.single();
			
			if (deptData) {
				departmentId = deptData.id;
			} else {
				// If department doesn't exist, set to null
				departmentId = null;
			}
		}
		
		// Map the data to match database columns
		const mappedData = {
			job_title: body.job_title || body.title,
			department_id: departmentId,
			status: body.status,
			updated_at: new Date().toISOString()
		};

		// Add optional fields only if they exist
		if (body.employment_type || body.type) mappedData.employment_type = body.employment_type || body.type;
		if (body.experience_required) mappedData.experience_required = body.experience_required;
		if (body.job_description) mappedData.job_description = body.job_description;
		if (body.requirements) mappedData.requirements = body.requirements;
		if (body.benefits) mappedData.benefits = body.benefits;
		if (body.closing_date) mappedData.closing_date = body.closing_date;
		if (body.location) mappedData.location = body.location;
		if (body.salary_range) mappedData.salary_range = body.salary_range;

		// Remove undefined values
		Object.keys(mappedData).forEach(key => {
			if (mappedData[key] === undefined) {
				delete mappedData[key];
			}
		});

		const { data, error } = await supabase
			.from('recruitment')
			.update(mappedData)
			.eq('id', id)
			.select(`
				*,
				departments:department_id (
					department_name
				)
			`)
			.single();

		if (error) throw error;
		return NextResponse.json(data);
	} catch (err) {
		console.error('Recruitment update error:', err);
		return NextResponse.json({ error: 'Failed to update job posting' }, { status: 500 });
	}
}

// Helper function to validate UUID
function isValidUUID(uuid) {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

export async function DELETE(request, { params }) {
	try {
		const { id } = await params;
		const supabase = getSupabaseServerClient();
		
		const { error } = await supabase
			.from('recruitment')
			.delete()
			.eq('id', id);

		if (error) throw error;
		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('Recruitment delete error:', err);
		return NextResponse.json({ error: 'Failed to delete job posting' }, { status: 500 });
	}
}

