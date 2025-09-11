import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src', 'data');
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

async function ensureDirExists(dirPath) {
	try {
		await fs.mkdir(dirPath, { recursive: true });
	} catch (_) {
		// ignore
	}
}

async function readJson(fileName, fallback) {
	await ensureDirExists(dataDir);
	const filePath = path.join(dataDir, fileName);
	try {
		const raw = await fs.readFile(filePath, 'utf-8');
		return JSON.parse(raw);
	} catch (err) {
		if (err.code === 'ENOENT') {
			await writeJson(fileName, fallback);
			return fallback;
		}
		throw err;
	}
}

async function writeJson(fileName, data) {
	await ensureDirExists(dataDir);
	const filePath = path.join(dataDir, fileName);
	const content = JSON.stringify(data, null, 2);
	await fs.writeFile(filePath, content, 'utf-8');
}

export async function getEmployees() {
	return readJson('employees.json', []);
}

export async function saveEmployees(employees) {
	return writeJson('employees.json', employees);
}

export async function getEmployeeById(id) {
	const employees = await getEmployees();
	return employees.find((e) => String(e.id) === String(id)) || null;
}

export async function upsertEmployee(employee) {
	const employees = await getEmployees();
	const idx = employees.findIndex((e) => String(e.id) === String(employee.id));
	if (idx >= 0) {
		employees[idx] = { ...employees[idx], ...employee };
	} else {
		employees.push(employee);
	}
	await saveEmployees(employees);
	return employee;
}

export async function deleteEmployee(id) {
	const employees = await getEmployees();
	const filtered = employees.filter((e) => String(e.id) !== String(id));
	await saveEmployees(filtered);
	return employees.length !== filtered.length;
}

export async function getHistory(id) {
	return readJson(`history-${id}.json`, []);
}

export async function addHistory(id, event) {
	const history = await getHistory(id);
	const newEvent = { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), ...event };
	const updated = [newEvent, ...history];
	await writeJson(`history-${id}.json`, updated);
	return newEvent;
}

export async function getDocuments(id) {
	return readJson(`documents-${id}.json`, []);
}

export async function addDocument(id, docMeta) {
	const docs = await getDocuments(id);
	const newDoc = { id: crypto.randomUUID(), ...docMeta };
	const updated = [newDoc, ...docs];
	await writeJson(`documents-${id}.json`, updated);
	return newDoc;
}

export async function ensureUploadsDir() {
	await ensureDirExists(uploadsDir);
	return uploadsDir;
}

export const paths = { dataDir, uploadsDir };


