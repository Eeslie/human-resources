import { NextResponse } from 'next/server';
import { getAttendance, calculateOvertimeForEmployee } from '../../../lib/data';

export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const employeeId = searchParams.get('employee_id');
	const startDate = searchParams.get('start_date');
	const endDate = searchParams.get('end_date');
	
	if (employeeId && startDate && endDate) {
		const overtimeAmount = await calculateOvertimeForEmployee(employeeId, startDate, endDate);
		return NextResponse.json({ overtime_amount: overtimeAmount });
	}
	
	const attendance = await getAttendance();
	return NextResponse.json(attendance);
}
