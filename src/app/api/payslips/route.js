import { NextResponse } from 'next/server';
import { getPayslips, addPayslip, savePayslips } from '../../../lib/data';
import { getUserFromRequest, isHR } from '../../../lib/auth-helpers';

export async function GET(request) {
	const user = getUserFromRequest(request);
	const payslips = await getPayslips();
	
	// Apply role-based filtering
	if (isHR(user)) {
		return NextResponse.json(payslips);
	} else if (user && user.employee_id) {
		// Employees see only their own payslips
		const filtered = payslips.filter(p => p.employee_id === user.employee_id);
		return NextResponse.json(filtered);
	}
	
	return NextResponse.json([]);
}

export async function POST(request) {
	const body = await request.json();
	const created = await addPayslip(body);
	return NextResponse.json(created, { status: 201 });
}

// Delete duplicates: keeps the most recent record per (payroll_id) or (employee_id + issue_date)
export async function DELETE() {
    const payslips = await getPayslips();
    const latestByKey = new Map();
    for (const slip of payslips) {
        const key = slip.payroll_id ? `payroll:${slip.payroll_id}` : `emp:${slip.employee_id}|date:${slip.issue_date}`;
        const prev = latestByKey.get(key);
        const prevTime = prev ? Date.parse(prev.created_at || 0) : -1;
        const currTime = Date.parse(slip.created_at || 0);
        if (!prev || currTime >= prevTime) {
            latestByKey.set(key, slip);
        }
    }
    const deduped = Array.from(latestByKey.values());
    await savePayslips(deduped);
    return NextResponse.json({ removed: payslips.length - deduped.length, remaining: deduped.length });
}

