import { NextResponse } from 'next/server';
import { getHistory, addHistory } from '../../../../../lib/data';

export async function GET(_req, { params }) {
	const { id } = params;
	const history = await getHistory(id);
	return NextResponse.json(history);
}

export async function POST(request, { params }) {
	const { id } = params;
	const body = await request.json();
	if (!body || !body.action || !body.description) {
		return NextResponse.json({ error: 'action and description are required' }, { status: 400 });
	}
	const event = await addHistory(id, { status: body.status || 'info', ...body });
	return NextResponse.json(event, { status: 201 });
}


