import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';

export async function GET() {
	try {
		const supabase = getSupabaseServerClient();
		const { data, error } = await supabase
			.from('recruitment')
			.select(`
				*,
				departments:department_id (
					department_name
				)
			`)
			.order('created_at', { ascending: false });
		
		if (error) throw error;
		return NextResponse.json(data ?? []);
	} catch (err) {
		console.error('Recruitment fetch error:', err);
		return NextResponse.json({ error: 'Failed to fetch recruitment data' }, { status: 500 });
	}
}

export async function POST(request) {
	try {
		const body = await request.json();
		const supabase = getSupabaseServerClient();
		
		// Handle department_id - if it's not a valid UUID, try to find department by name
		let departmentId = body.department_id;
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
		
		// Prepare the data for insertion - using only basic fields that exist
		const insertData = {
			job_title: body.job_title,
			department_id: departmentId,
			status: body.status || 'Active'
		};

		// Add optional fields only if they exist
		if (body.employment_type || body.type) insertData.employment_type = body.employment_type || body.type;
		if (body.experience_required) insertData.experience_required = body.experience_required;
		if (body.job_description) insertData.job_description = body.job_description;
		if (body.requirements) insertData.requirements = body.requirements;
		if (body.benefits) insertData.benefits = body.benefits;
		if (body.vacancy_date) insertData.vacancy_date = body.vacancy_date;
		if (body.closing_date) insertData.closing_date = body.closing_date;
		if (body.created_by) insertData.created_by = body.created_by;
		if (body.location) insertData.location = body.location;
		if (body.salary_range) insertData.salary_range = body.salary_range;
		if (body.vacancy_id) insertData.vacancy_id = body.vacancy_id;

		const { data, error } = await supabase
			.from('recruitment')
			.insert(insertData)
			.select(`
				*,
				departments:department_id (
					department_name
				)
			`)
			.single();

		if (error) throw error;
		return NextResponse.json(data, { status: 201 });
	} catch (err) {
		console.error('Recruitment create error:', err);
		return NextResponse.json({ error: 'Failed to create job posting' }, { status: 500 });
	}
}

// Helper function to validate UUID
function isValidUUID(uuid) {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

export async function PUT(request) {
	try {
		const body = await request.json();
		const { id, ...updateData } = body;
		
		if (!id) {
			return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
		}

		const supabase = getSupabaseServerClient();
		
		// Handle department_id - if it's not a valid UUID, try to find department by name
		let departmentId = updateData.department_id || updateData.department;
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
			job_title: updateData.job_title || updateData.title,
			department_id: departmentId,
			status: updateData.status,
			updated_at: new Date().toISOString()
		};

		// Add optional fields only if they exist
		if (updateData.employment_type || updateData.type) mappedData.employment_type = updateData.employment_type || updateData.type;
		if (updateData.experience_required) mappedData.experience_required = updateData.experience_required;
		if (updateData.job_description) mappedData.job_description = updateData.job_description;
		if (updateData.requirements) mappedData.requirements = updateData.requirements;
		if (updateData.benefits) mappedData.benefits = updateData.benefits;
		if (updateData.closing_date) mappedData.closing_date = updateData.closing_date;
		if (updateData.location) mappedData.location = updateData.location;
		if (updateData.salary_range) mappedData.salary_range = updateData.salary_range;

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

export async function DELETE(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get('id');
		
		if (!id) {
			return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
		}

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

