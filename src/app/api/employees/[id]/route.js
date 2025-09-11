import { NextResponse } from 'next/server';
import { getEmployees, saveEmployees, getEmployeeById, deleteEmployee } from '../../../../lib/data';

export async function GET(_req, { params }) {
	const { id } = await params;
	const employee = await getEmployeeById(id);
	if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });
	return NextResponse.json(employee);
}

export async function PUT(request, { params }) {
	const { id } = await params;
	const body = await request.json();
	const employees = await getEmployees();
	const idx = employees.findIndex((e) => String(e.id) === String(id));
	if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
	employees[idx] = { ...employees[idx], ...body };
	await saveEmployees(employees);
	return NextResponse.json(employees[idx]);
}

export async function DELETE(_req, { params }) {
	const { id } = await params;
	const removed = await deleteEmployee(id);
	if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
	return NextResponse.json({ ok: true });
}


