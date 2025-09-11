import { NextResponse } from 'next/server';
import { getEmployees, saveEmployees } from '../../../lib/data';

export async function GET() {
	const employees = await getEmployees();
	return NextResponse.json(employees);
}

export async function POST(request) {
	const body = await request.json();
	if (!body || !body.name || !body.email) {
		return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
	}
	const employees = await getEmployees();
	const newEmployee = {
		id: Date.now(),
		status: 'Active',
		avatar: '👤',
		...body
	};
	employees.push(newEmployee);
	await saveEmployees(employees);
	return NextResponse.json(newEmployee, { status: 201 });
}


