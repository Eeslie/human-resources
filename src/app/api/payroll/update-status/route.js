import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabaseServer';
import { getPayrolls, savePayrolls } from '../../../../lib/data';

export async function POST() {
	try {
		// Try Supabase first
		try {
			const supabase = getSupabaseServerClient();
			const { data, error } = await supabase
				.from('payroll')
				.update({ status: 'Approved' })
				.eq('status', 'Pending')
				.select();
			
			if (error) throw error;
			
			return NextResponse.json({ 
				success: true, 
				message: `Updated ${data?.length || 0} payroll records from Pending to Approved`,
				count: data?.length || 0
			});
		} catch (err) {
			// Fallback to file-based storage
			const payrolls = await getPayrolls();
			let updatedCount = 0;
			
			payrolls.forEach(payroll => {
				if (payroll.status === 'Pending') {
					payroll.status = 'Approved';
					updatedCount++;
				}
			});
			
			if (updatedCount > 0) {
				await savePayrolls(payrolls);
			}
			
			return NextResponse.json({ 
				success: true, 
				message: `Updated ${updatedCount} payroll records from Pending to Approved`,
				count: updatedCount
			});
		}
	} catch (error) {
		console.error('Error updating payroll status:', error);
		return NextResponse.json({ 
			error: 'Failed to update payroll status', 
			details: error.message 
		}, { status: 500 });
	}
}

