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

export async function getDepartments() {
	return readJson('departments.json', []);
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

// Payroll and Payslip data helpers

export async function getPayrolls() {
	return readJson('payroll.json', []);
}

export async function savePayrolls(payrolls) {
	return writeJson('payroll.json', payrolls);
}

export async function getPayrollById(id) {
	const payrolls = await getPayrolls();
	return payrolls.find((p) => String(p.id) === String(id)) || null;
}

export async function upsertPayroll(payroll) {
	const payrolls = await getPayrolls();
	const idx = payrolls.findIndex((p) => String(p.id) === String(payroll.id));
	if (idx >= 0) payrolls[idx] = { ...payrolls[idx], ...payroll };
	else payrolls.push(payroll);
	await savePayrolls(payrolls);
	return payroll;
}

export async function deletePayroll(id) {
	const payrolls = await getPayrolls();
	const filtered = payrolls.filter((p) => String(p.id) !== String(id));
	await savePayrolls(filtered);
	return filtered.length !== payrolls.length;
}

export async function getPayslips() {
	return readJson('payslips.json', []);
}

export async function savePayslips(payslips) {
	return writeJson('payslips.json', payslips);
}

export async function addPayslip(payslip) {
    const payslips = await getPayslips();
    // Use a stable identity for a payslip: prefer payroll_id if present, otherwise employee_id + issue_date
    const matches = (p) => {
        if (payslip.payroll_id && p.payroll_id) {
            return String(p.payroll_id) === String(payslip.payroll_id);
        }
        return String(p.employee_id) === String(payslip.employee_id) && String(p.issue_date) === String(payslip.issue_date);
    };
    const existingIndex = payslips.findIndex(matches);
    const upserted = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...payslip };
    if (existingIndex >= 0) {
        // Replace existing duplicate with the latest payload
        // Preserve original id if present to avoid breaking references
        upserted.id = payslips[existingIndex].id || upserted.id;
        payslips[existingIndex] = { ...payslips[existingIndex], ...upserted };
    } else {
        payslips.push(upserted);
    }
    await savePayslips(payslips);
    return upserted;
}

// Attendance data helpers
export async function getAttendance() {
	return readJson('attendance.json', []);
}

export async function getAttendanceByEmployee(employeeId, startDate, endDate) {
	const attendance = await getAttendance();
	return attendance.filter(record => 
		record.employee_id === employeeId &&
		record.date >= startDate && 
		record.date <= endDate
	);
}

export async function calculateOvertimeForEmployee(employeeId, startDate, endDate, hourlyRate = 25) {
	const records = await getAttendanceByEmployee(employeeId, startDate, endDate);
	const totalOvertimeHours = records.reduce((sum, record) => sum + (record.overtime_hours || 0), 0);
	return totalOvertimeHours * hourlyRate;
}


// Recruitment data helpers
export async function getVacancies() {
	return readJson('recruitment.json', []);
}

export async function saveVacancies(vacancies) {
	return writeJson('recruitment.json', vacancies);
}

export async function upsertVacancy(vacancy) {
	const vacancies = await getVacancies();
	const idx = vacancies.findIndex(v => String(v.id) === String(vacancy.id));
	if (idx >= 0) vacancies[idx] = { ...vacancies[idx], ...vacancy };
	else vacancies.push(vacancy);
	await saveVacancies(vacancies);
	return vacancy;
}

export async function deleteVacancy(id) {
	const vacancies = await getVacancies();
	const filtered = vacancies.filter(v => String(v.id) !== String(id));
	await saveVacancies(filtered);
	return filtered.length !== vacancies.length;
}

export async function getApplicants() {
	return readJson('applicants.json', []);
}

export async function saveApplicants(applicants) {
	return writeJson('applicants.json', applicants);
}

export async function upsertApplicant(applicant) {
	const applicants = await getApplicants();
	const idx = applicants.findIndex(a => String(a.id) === String(applicant.id));
	if (idx >= 0) applicants[idx] = { ...applicants[idx], ...applicant };
	else applicants.push(applicant);
	await saveApplicants(applicants);
	return applicant;
}

export async function deleteApplicant(id) {
	const applicants = await getApplicants();
	const filtered = applicants.filter(a => String(a.id) !== String(id));
	await saveApplicants(filtered);
	return filtered.length !== applicants.length;
}

export async function getInterviews() {
	return readJson('interviews.json', []);
}

export async function saveInterviews(interviews) {
	return writeJson('interviews.json', interviews);
}

export async function addInterview(interview) {
	const interviews = await getInterviews();
	const newInterview = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...interview };
	interviews.push(newInterview);
	await saveInterviews(interviews);
	return newInterview;
}

export async function getOffers() {
	return readJson('offers.json', []);
}

export async function saveOffers(offers) {
	return writeJson('offers.json', offers);
}

export async function addOffer(offer) {
	const offers = await getOffers();
	const newOffer = { id: crypto.randomUUID(), created_at: new Date().toISOString(), status: 'Pending', ...offer };
	offers.push(newOffer);
	await saveOffers(offers);
	return newOffer;
}

export async function getOnboardingTasks() {
	return readJson('onboarding.json', []);
}

export async function saveOnboardingTasks(tasks) {
	return writeJson('onboarding.json', tasks);
}

export async function addOnboardingTask(task) {
	const tasks = await getOnboardingTasks();
	const newTask = { id: crypto.randomUUID(), created_at: new Date().toISOString(), completed: false, ...task };
	tasks.push(newTask);
	await saveOnboardingTasks(tasks);
	return newTask;
}

