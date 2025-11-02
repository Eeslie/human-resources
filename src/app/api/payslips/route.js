import { NextResponse } from 'next/server';
import { getPayslips, addPayslip } from '../../../lib/data';

export async function GET() {
	const payslips = await getPayslips();
	return NextResponse.json(payslips);
}

export async function POST(request) {
	const body = await request.json();
	const created = await addPayslip(body);
	return NextResponse.json(created, { status: 201 });
}

