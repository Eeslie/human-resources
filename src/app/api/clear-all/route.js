import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';

export async function DELETE() {
	try {
		const supabase = getSupabaseServerClient();
		
		// Delete in order to respect foreign key constraints
		// Delete child tables first, then parent tables
		
		const results = {};
		
		// Helper function to delete all records from a table
		const deleteAll = async (tableName, dateColumn = 'created_at') => {
			try {
				// First, get all IDs to delete
				const { data, error: selectError } = await supabase.from(tableName).select('id');
				if (selectError) {
					// If table doesn't exist or has no records, that's okay
					if (selectError.message.includes('Could not find the table')) {
						return { success: true, skipped: true, message: 'Table does not exist' };
					}
					throw selectError;
				}
				
				if (!data || data.length === 0) {
					return { success: true, message: 'Table already empty' };
				}
				
				// Delete all records
				const { error: deleteError } = await supabase.from(tableName).delete().in('id', data.map(r => r.id));
				if (deleteError) throw deleteError;
				
				return { success: true, deleted: data.length };
			} catch (error) {
				return { error: error.message };
			}
		};
		
		// 1. Delete evaluations (depends on applicants)
		results.evaluations = await deleteAll('evaluations');
		
		// 2. Delete offers (depends on applicants)
		results.offers = await deleteAll('offers');
		
		// 3. Delete interviews (depends on applicants)
		results.interviews = await deleteAll('interviews');
		
		// 4. Delete applicants (depends on recruitment_vacancies)
		results.applicants = await deleteAll('applicant');
		
		// 5. Delete recruitment vacancies
		results.recruitment = await deleteAll('recruitment');
		
		// 6. Delete onboarding tasks (depends on employees)
		results.onboarding_tasks = await deleteAll('onboarding_tasks');
		
		// 7. Delete payslips (if table exists - might be file-based only)
		results.payslips = await deleteAll('payslips');
		
		// 8. Delete attendance (depends on employees)
		results.attendance = await deleteAll('attendance', 'date');
		
		// 9. Delete leave requests (depends on employees)
		results.leave_request = await deleteAll('leave_request');
		
		// 10. Delete employee documents (if table exists - might be file-based only)
		results.employee_documents = await deleteAll('employee_documents', 'uploaded_at');
		
		// 11. Delete employee history (depends on employees)
		results.employee_history = await deleteAll('employee_history', 'date');
		
		// 12. Delete payroll BEFORE employees (has foreign key to employees)
		results.payroll = await deleteAll('payroll');
		
		// 13. Delete employees (must be last due to foreign key constraints)
		results.employees = await deleteAll('employee');
		
		// Check if there were any critical errors (ignore skipped tables)
		const criticalErrors = Object.entries(results)
			.filter(([_, r]) => r.error && !r.skipped)
			.map(([table, r]) => `${table}: ${r.error}`);
		
		if (criticalErrors.length > 0) {
			return NextResponse.json({ 
				success: false,
				message: 'Some tables could not be cleared',
				errors: criticalErrors,
				results 
			}, { status: 500 });
		}
		
		return NextResponse.json({ 
			success: true, 
			message: 'All data cleared from database successfully',
			results
		});
	} catch (error) {
		console.error('Error clearing database:', error);
		return NextResponse.json({ 
			error: 'Failed to clear database', 
			details: error.message 
		}, { status: 500 });
	}
}

