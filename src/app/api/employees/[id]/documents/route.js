import { NextResponse } from 'next/server';
import { addDocument, getDocuments, ensureUploadsDir } from '../../../../../lib/data';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
	const { id } = params;
	const docs = await getDocuments(id);
	return NextResponse.json(docs);
}

export async function POST(request, { params }) {
	const { id } = params;
	const form = await request.formData();
	const file = form.get('file');
	if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const uploadsDir = await ensureUploadsDir();
	const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
	const filePath = path.join(uploadsDir, safeName);
	await fs.writeFile(filePath, buffer);
	const publicUrl = `/uploads/${safeName}`;
	const meta = {
		name: file.name,
		size: buffer.length,
		type: file.type || 'application/octet-stream',
		url: publicUrl,
		date: new Date().toISOString().slice(0, 10)
	};
	const saved = await addDocument(id, meta);
	return NextResponse.json(saved, { status: 201 });
}


