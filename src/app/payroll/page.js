'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import jsPDF from 'jspdf';

export default function Payroll() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    salary_base: '',
    bonus: '',
    overtime: '',
    deductions: ''
  });
  const [adding, setAdding] = useState(false);
  const [overviewPage, setOverviewPage] = useState(1);
  const [payslipsPage, setPayslipsPage] = useState(1);
  const pageSize = 6;
  const modalCheckId = useRef(0);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Fetch helpers
  async function fetchEmployees() {
    const res = await fetch('/api/employees', { cache: 'no-store' });
    const data = await res.json();
    setEmployees(data);
  }
  async function fetchPayrolls() {
    const res = await fetch('/api/payroll', { cache: 'no-store' });
    const data = await res.json();
    setPayrolls(data);
  }
  async function fetchPayslips() {
    const res = await fetch('/api/payslips', { cache: 'no-store' });
    const data = await res.json();
    setPayslips(data);
  }

  async function fetchAttendance() {
    const res = await fetch('/api/attendance', { cache: 'no-store' });
    const data = await res.json();
    setAttendanceData(data);
  }

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
    fetchPayslips();
    fetchAttendance();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'process', label: 'Process Payroll', icon: '⚡' },
    { id: 'payslips', label: 'Payslips', icon: '📄' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  // Calculation: derive table rows from payrolls and ensure every employee shows up
  const payrollRows = useMemo(() => {
    const employeeById = new Map(employees.map(e => [String(e.id), e]));
    const rows = payrolls.map(p => {
      const emp = employeeById.get(String(p.employee_id));
      const basicSalary = Number(p.salary_base || 0);
      const bonus = Number(p.bonus || 0);
      const overtime = Number(p.overtime || 0);
      const deductions = Number(p.deductions || 0);
      const netPay = basicSalary + bonus + overtime - deductions;
      return {
        id: p.id,
        employee_id: p.employee_id,
        employee: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
        position: emp?.job_title || '',
        basicSalary,
        overtime,
        bonuses: bonus,
        deductions,
        netPay,
        status: p.status || 'Pending',
        payPeriod: p.payroll_date || p.created_at?.slice(0,10) || '',
        hasPayroll: true,
        avatar: '💵'
      };
    });
    const existing = new Set(rows.map(r => String(r.employee_id)));
    for (const emp of employees) {
      const empId = String(emp.id);
      if (!existing.has(empId)) {
        rows.push({
          id: empId,
          employee_id: empId,
          employee: `${emp.first_name} ${emp.last_name}`,
          position: emp.job_title || '',
          basicSalary: 0,
          overtime: 0,
          bonuses: 0,
          deductions: 0,
          netPay: 0,
          status: 'Pending',
          payPeriod: '',
          hasPayroll: false,
          avatar: '💵'
        });
      }
    }
    return rows;
  }, [payrolls, employees]);

  // Helper to calculate overtime from attendance
  async function calculateOvertimeFromAttendance(employeeId, startDate, endDate) {
    try {
      const res = await fetch(`/api/attendance?employee_id=${employeeId}&start_date=${startDate}&end_date=${endDate}`);
      const data = await res.json();
      return data.overtime_amount || 0;
    } catch (error) {
      console.error('Failed to calculate overtime:', error);
      return 0;
    }
  }

  // Helpers to add/edit payroll lines and process
  async function addPayrollLine() {
    setAddForm({
      employee_id: employees[0]?.id || '',
      start_date: '',
      end_date: '',
      salary_base: '',
      bonus: '',
      overtime: '',
      deductions: ''
    });
    setShowAddModal(true);
    // Fallback: if portal/modal fails to render for any reason, use prompt-based flow after a short delay
    const checkId = ++modalCheckId.current;
    setTimeout(async () => {
      const isStillLatest = checkId === modalCheckId.current;
      const modalExists = !!document.querySelector('[data-payroll-add-modal]');
      if (!modalExists && isStillLatest) {
        if (!employees.length) return alert('No employees found');
        const empIdx = prompt(`Select employee by index:\n${employees.map((e,i)=>`${i+1}. ${e.first_name} ${e.last_name}`).join('\n')}`);
        const index = Number(empIdx) - 1;
        if (Number.isNaN(index) || index < 0 || index >= employees.length) return;
        const employee = employees[index];
        const startDate = prompt('Pay period start date (YYYY-MM-DD)', '2024-01-01') || '2024-01-01';
        const endDate = prompt('Pay period end date (YYYY-MM-DD)', '2024-01-31') || '2024-01-31';
        const salary = prompt('Salary base amount', '50000') || '50000';
        const bonus = prompt('Bonus amount', '0') || '0';
        const overtimeFromAttendance = await calculateOvertimeFromAttendance(employee.id, startDate, endDate);
        const overtime = prompt(`Overtime amount (calculated from attendance: $${overtimeFromAttendance})`, overtimeFromAttendance.toString()) || '0';
        const deductions = prompt('Deductions amount', '500') || '500';
        const body = {
          payroll_id: crypto.randomUUID(),
          employee_id: employee.id,
          salary_base: Number(salary),
          bonus: Number(bonus),
          overtime: Number(overtime),
          deductions: Number(deductions),
          payroll_date: endDate,
          status: 'Pending'
        };
        const res = await fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) fetchPayrolls();
      }
    }, 250);
  }

  useEffect(() => {
    if (showAddModal && !addForm.employee_id && employees.length) {
      setAddForm((f) => ({ ...f, employee_id: employees[0].id }));
    }
  }, [employees, showAddModal]);

  async function submitAddPayroll(e) {
    e?.preventDefault?.();
    if (!addForm.employee_id || !addForm.end_date || !addForm.salary_base) return;
    setAdding(true);
    try {
      let overtimeVal = addForm.overtime;
      if (overtimeVal === '' && addForm.start_date && addForm.end_date) {
        overtimeVal = await calculateOvertimeFromAttendance(addForm.employee_id, addForm.start_date, addForm.end_date);
      }
      const body = {
        payroll_id: crypto.randomUUID(),
        employee_id: addForm.employee_id,
        salary_base: Number(addForm.salary_base || 0),
        bonus: Number(addForm.bonus || 0),
        overtime: Number(overtimeVal || 0),
        deductions: Number(addForm.deductions || 0),
        payroll_date: addForm.end_date,
        status: 'Pending'
      };
      const res = await fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed');
      const created = await res.json();
      // Immediately create a payslip so it appears under Payslips
      const payslipPayload = {
        payslip_id: crypto.randomUUID(),
        payroll_id: created.id || created.payroll_id || body.payroll_id,
        employee_id: body.employee_id,
        issue_date: body.payroll_date,
        amounts: {
          basic: body.salary_base,
          bonus: body.bonus,
          overtime: body.overtime,
          deductions: body.deductions,
          net: body.salary_base + body.bonus + body.overtime - body.deductions
        }
      };
      await fetch('/api/payslips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payslipPayload) });
      setShowAddModal(false);
      await Promise.all([fetchPayrolls(), fetchPayslips()]);
    } catch (_e) {
      alert('Failed to add payroll entry');
    } finally {
      setAdding(false);
    }
  }

  async function generatePayslipFor(row) {
    let payrollId = row.id;
    let payrollDate = row.payPeriod || new Date().toISOString().slice(0,10);
    // If this row is a placeholder without a payroll record, create one first
    if (!row.hasPayroll) {
      const createBody = {
        payroll_id: crypto.randomUUID(),
        employee_id: row.employee_id,
        salary_base: Number(row.basicSalary || 0),
        bonus: Number(row.bonuses || 0),
        overtime: Number(row.overtime || 0),
        deductions: Number(row.deductions || 0),
        payroll_date: payrollDate,
        status: 'Pending'
      };
      const createRes = await fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createBody) });
      if (createRes.ok) {
        const created = await createRes.json();
        payrollId = created.id || created.payroll_id || payrollId;
        payrollDate = created.payroll_date || payrollDate;
      }
    }

    const payload = {
      payslip_id: crypto.randomUUID(),
      payroll_id: payrollId,
      employee_id: row.employee_id,
      issue_date: payrollDate,
      amounts: {
        basic: row.basicSalary,
        bonus: row.bonuses,
        overtime: row.overtime,
        deductions: row.deductions,
        net: row.netPay
      }
    };
    const res = await fetch('/api/payslips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) fetchPayslips();
  }

  async function processPayrollRun() {
    if (!payrollRows.length) return alert('No payroll entries to process');
    setProcessing(true);
    try {
      let totalAmount = 0;
      for (const row of payrollRows) {
        await generatePayslipFor(row);
        // Only update status for real payroll rows; placeholders will have been created inside generatePayslipFor
        if (row.hasPayroll) {
          await fetch(`/api/payroll/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Approved' }) });
          totalAmount += row.netPay;
        }
      }
      await fetchPayrolls();
      alert(`Payroll processed successfully. Total amount: $${totalAmount.toLocaleString()}`);
    } finally {
      setProcessing(false);
    }
  }

  function exportPayrollToPDF(type) {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPos = 20;

    // Add header
    pdf.setFontSize(18);
    pdf.text('Payroll Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    pdf.setFontSize(12);
    pdf.text('November 2024', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    if (type === 'overview') {
      // Export overview payroll data
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Employee', 14, yPos);
      pdf.text('Basic Salary', 60, yPos);
      pdf.text('Overtime', 100, yPos);
      pdf.text('Bonuses', 130, yPos);
      pdf.text('Deductions', 160, yPos);
      pdf.text('Net Pay', 190, yPos);
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');

      payrollRows.forEach((row) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(row.employee || 'Unknown', 14, yPos, { maxWidth: 45 });
        pdf.text(`$${row.basicSalary.toLocaleString()}`, 60, yPos);
        pdf.text(`$${row.overtime.toLocaleString()}`, 100, yPos);
        pdf.text(`$${row.bonuses.toLocaleString()}`, 130, yPos);
        pdf.text(`-$${row.deductions.toLocaleString()}`, 160, yPos);
        pdf.text(`$${row.netPay.toLocaleString()}`, 190, yPos);
        yPos += 8;
      });

      pdf.save('payroll-overview-november.pdf');
    } else if (type === 'payslips') {
      // Export payslips
      payslips.forEach((payslip, index) => {
        if (index > 0) pdf.addPage();
        yPos = 20;
        const employee = employees.find(e => e.id === payslip.employee_id);
        const amounts = payslip.amounts || {};
        
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text('PAYSLIP', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Employee: ${employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}`, 14, yPos);
        yPos += 5;
        pdf.text(`Employee ID: ${employee?.employee_id || 'N/A'}`, 14, yPos);
        yPos += 5;
        pdf.text(`Issue Date: ${payslip.issue_date}`, 14, yPos);
        yPos += 5;
        pdf.text(`Payslip ID: ${payslip.payslip_id}`, 14, yPos);
        yPos += 10;

        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('EARNINGS:', 14, yPos);
        yPos += 8;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Basic Pay: $${(amounts.basic || 0).toLocaleString()}`, 20, yPos);
        yPos += 5;
        pdf.text(`Overtime: $${(amounts.overtime || 0).toLocaleString()}`, 20, yPos);
        yPos += 5;
        pdf.text(`Bonus: $${(amounts.bonus || 0).toLocaleString()}`, 20, yPos);
        yPos += 5;
        pdf.text(`Total Earnings: $${((amounts.basic || 0) + (amounts.overtime || 0) + (amounts.bonus || 0)).toLocaleString()}`, 20, yPos);
        yPos += 10;

        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('DEDUCTIONS:', 14, yPos);
        yPos += 8;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Deductions: -$${(amounts.deductions || 0).toLocaleString()}`, 20, yPos);
        yPos += 10;

        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(`NET PAY: $${(amounts.net || 0).toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
      });

      pdf.save('payslips-november.pdf');
    }
  }

  const payrollStats = useMemo(() => {
    const totalEmployees = employees.length;
    const totalPayroll = payrollRows.reduce((sum, r) => sum + r.netPay, 0);
    const averageSalary = payrollRows.length ? Math.round(totalPayroll / payrollRows.length) : 0;
    const processedThisMonth = payrollRows.filter(r => r.status === 'Processed' || r.status === 'Approved').length;
    const pendingApproval = payrollRows.filter(r => r.status !== 'Processed' && r.status !== 'Approved').length;
    return { totalEmployees, totalPayroll, averageSalary, processedThisMonth, pendingApproval };
  }, [employees, payrollRows]);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">HR</span>
              </div>
              <h1 className="text-xl font-bold text-black">Partner Payroll & Compensation</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/" className="text-black hover:text-gray-600 font-medium text-black">
                Overview
              </Link>
              <Link href="/employee-records" className="text-black hover:text-gray-600 font-medium text-black">
                Partner Records
              </Link>
              <Link href="/payroll" className="text-black hover:text-gray-600 font-medium text-black">
                Payroll
              </Link>
              <Link href="/recruitment" className="text-black hover:text-gray-600 font-medium text-black">
                Recruitment
              </Link>
              <Link href="/time-attendance" className="text-black hover:text-gray-600 font-medium text-black ">
                Time & Attendance
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-800 to-orange-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-4xl mr-4">
              💰
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Partner Payroll & Compensation</h2>
              <p className="text-orange-100 text-lg">Automate partner salary processing, deductions, benefits, and compliance with tax regulations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Employees</p>
                <p className="text-2xl font-bold text-slate-800">{payrollStats.totalEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Monthly Payroll</p>
                <p className="text-2xl font-bold text-slate-800">${(payrollStats.totalPayroll / 1000).toFixed(0)}k</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Salary</p>
                <p className="text-2xl font-bold text-slate-800">${(payrollStats.averageSalary / 1000).toFixed(0)}k</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">{payrollStats.processedThisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{payrollStats.pendingApproval}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg">
          {/* Tabs */}
          <div className="border-b border-slate-200">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center relative z-10">
                  <h3 className="text-xl font-bold text-slate-800">November</h3>
                  <div className="flex space-x-3">
                    <button type="button" onClick={() => addPayrollLine()} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 pointer-events-auto">
                      + Add Entry
                    </button>
                    <button onClick={processPayrollRun} disabled={processing} className={`px-4 py-2 rounded-lg text-white ${processing ? 'bg-orange-400' : 'bg-orange-600 hover:bg-orange-700'}`}>
                      {processing ? 'Processing…' : 'Process Payroll'}
                    </button>
                    <button onClick={() => exportPayrollToPDF('overview')} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50">
                      Export Data
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Basic Salary</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Overtime</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bonuses</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deductions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Net Pay</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {payrollRows.slice((overviewPage-1)*pageSize, overviewPage*pageSize).map((employee) => (
                        <tr key={employee.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-xl mr-3">
                                {employee.avatar}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">{employee.employee}</div>
                                <div className="text-sm text-slate-500">{employee.position}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            ${employee.basicSalary.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            ${employee.overtime.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            ${employee.bonuses.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            -${employee.deductions.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            ${employee.netPay.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              employee.status === 'Approved' || employee.status === 'Processed'
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {employee.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onClick={() => setSelectedPayroll(employee)} className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                            <button onClick={() => generatePayslipFor(employee)} className="text-green-600 hover:text-green-900">Generate Payslip</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination - Overview */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-slate-600 order-2 sm:order-1">
                    Page {overviewPage} of {Math.max(1, Math.ceil((payrollRows?.length || 0)/pageSize))}
                  </div>
                  <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 order-1 sm:order-2">
                    <button onClick={()=>setOverviewPage(p=>Math.max(1,p-1))} disabled={overviewPage===1} className={`flex-1 sm:flex-none px-4 py-2 rounded-md border font-medium transition-colors ${overviewPage===1?'border-slate-200 text-slate-300':'border-orange-700 text-orange-800 hover:bg-orange-50'}`}>‹ Prev</button>
                    <button onClick={()=>setOverviewPage(p=>Math.min(Math.max(1,Math.ceil((payrollRows?.length||0)/pageSize)),p+1))} disabled={overviewPage>=Math.max(1,Math.ceil((payrollRows?.length||0)/pageSize))} className={`flex-1 sm:flex-none px-4 py-2 rounded-md border font-medium transition-colors ${overviewPage>=Math.max(1,Math.ceil((payrollRows?.length||0)/pageSize))?'border-slate-200 text-slate-300':'border-orange-700 text-orange-800 hover:bg-orange-50'}`}>Next ›</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'process' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-orange-50 to-orange-50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Process Payroll - November 2024</h3>
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg text-slate-700">Total Employees:</span>
                        <span className="text-2xl font-bold text-black">{payrollStats.totalEmployees}</span>
                        </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg text-slate-700">Total Gross Pay:</span>
                        <span className="text-2xl font-bold text-black">${payrollStats.totalPayroll.toLocaleString()}</span>
                        </div>
                      <div className="flex justify-between items-center border-t pt-4">
                        <span className="text-xl font-bold text-slate-800">Net Pay:</span>
                        <span className="text-3xl font-bold text-orange-700">${payrollStats.totalPayroll.toLocaleString()}</span>
                      </div>
                      <button onClick={processPayrollRun} disabled={processing} className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 text-lg font-semibold mt-6 disabled:opacity-50">
                        {processing ? 'Processing...' : 'Process Payroll & Export All Salaries'}
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payslips' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">Generated Payslips</h3>
                  <div className="flex space-x-3">
                    <button onClick={() => fetchPayslips()} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50">
                      Refresh
                    </button>
                    <button onClick={() => exportPayrollToPDF('payslips')} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                      Export All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Payslip ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Issue Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Basic Pay</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Overtime</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bonus</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deductions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Net Pay</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {payslips.slice((payslipsPage-1)*pageSize, payslipsPage*pageSize).map((payslip) => {
                        const employee = employees.find(e => e.id === payslip.employee_id);
                        const amounts = payslip.amounts || {};
                        return (
                          <tr key={payslip.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900">
                              {payslip.payslip_id?.slice(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-sm text-white mr-3">
                                  💵
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-900">
                                    {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
                                  </div>
                                  <div className="text-sm text-slate-500">{employee?.employee_id || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {payslip.issue_date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              ${(amounts.basic || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              ${(amounts.overtime || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              ${(amounts.bonus || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              -${(amounts.deductions || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              ${(amounts.net || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => {
                                  // Create a simple text-based payslip download
                                  const payslipText = `
PAYSLIP
========
Employee: ${employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}
Employee ID: ${employee?.employee_id || 'N/A'}
Issue Date: ${payslip.issue_date}
Payslip ID: ${payslip.payslip_id}

EARNINGS:
---------
Basic Pay:     $${(amounts.basic || 0).toLocaleString()}
Overtime:      $${(amounts.overtime || 0).toLocaleString()}
Bonus:         $${(amounts.bonus || 0).toLocaleString()}
Total Earnings: $${((amounts.basic || 0) + (amounts.overtime || 0) + (amounts.bonus || 0)).toLocaleString()}

DEDUCTIONS:
-----------
Deductions:    -$${(amounts.deductions || 0).toLocaleString()}

NET PAY:       $${(amounts.net || 0).toLocaleString()}
                                  `;
                                  const blob = new Blob([payslipText], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `payslip-${payslip.payslip_id}.txt`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Download
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedPayslip(payslip);
                                  setShowPayslipModal(true);
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {payslips.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-slate-500 text-lg mb-2">No payslips generated yet</div>
                      <div className="text-slate-400">Process payroll to generate payslips for employees</div>
                    </div>
                  )}
                </div>
                {/* Pagination - Payslips */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-slate-600 order-2 sm:order-1">
                    Page {payslipsPage} of {Math.max(1, Math.ceil((payslips?.length || 0)/pageSize))}
                  </div>
                  <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 order-1 sm:order-2">
                    <button onClick={()=>setPayslipsPage(p=>Math.max(1,p-1))} disabled={payslipsPage===1} className={`flex-1 sm:flex-none px-4 py-2 rounded-md border font-medium transition-colors ${payslipsPage===1?'border-slate-200 text-slate-300':'border-green-700 text-green-800 hover:bg-green-50'}`}>‹ Prev</button>
                    <button onClick={()=>setPayslipsPage(p=>Math.min(Math.max(1,Math.ceil((payslips?.length||0)/pageSize)),p+1))} disabled={payslipsPage>=Math.max(1,Math.ceil((payslips?.length||0)/pageSize))} className={`flex-1 sm:flex-none px-4 py-2 rounded-md border font-medium transition-colors ${payslipsPage>=Math.max(1,Math.ceil((payslips?.length||0)/pageSize))?'border-slate-200 text-slate-300':'border-green-700 text-green-800 hover:bg-green-50'}`}>Next ›</button>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">Payroll Settings</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                      <h4 className="font-semibold text-slate-800 mb-4">Payroll Schedule</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Pay Frequency</label>
                          <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-black">
                            <option>Monthly</option>
                            <option>Bi-weekly</option>
                            <option>Weekly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Pay Day</label>
                          <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-black">
                            <option>Last day of month</option>
                            <option>15th of month</option>
                            <option>1st of month</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                      <h4 className="font-semibold text-slate-800 mb-4">Tax Settings</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Federal Tax Rate (%)</label>
                          <input type="number" defaultValue="22" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-black" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">State Tax Rate (%)</label>
                          <input type="number" defaultValue="5" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-black" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Social Security Rate (%)</label>
                          <input type="number" defaultValue="6.2" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-black" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                      <h4 className="font-semibold text-slate-800 mb-4">Deduction Categories</h4>
                      <div className="space-y-3">
                        {[
                          'Health Insurance',
                          'Dental Insurance',
                          '401(k) Contribution',
                          'Life Insurance',
                          'Parking',
                          'Meal Plans'
                        ].map((deduction, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">{deduction}</span>
                            <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                      <h4 className="font-semibold text-slate-800 mb-4">Bank Integration</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Bank Name</label>
                          <input type="text" defaultValue="Chase Bank" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-black" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Account Number</label>
                          <input type="password" defaultValue="****1234" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-black" />
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" className="rounded border-slate-300 text-black" />
                          <label className="ml-2 text-sm text-slate-700">Enable automatic transfers</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50">
                    Cancel
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    {/* Add Payroll Entry Modal via Portal - moved outside tab content to ensure visibility */}
    {showAddModal && typeof window !== 'undefined' && createPortal(
      <div className="fixed inset-0 z-[2000] flex items-center justify-center" data-payroll-add-modal>
        <div className="absolute inset-0 bg-black/50" onClick={()=>setShowAddModal(false)}></div>
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">Add Payroll Entry</h3>
            <button onClick={()=>setShowAddModal(false)} className="text-slate-600 hover:text-slate-900">✖</button>
          </div>
          <form onSubmit={submitAddPayroll} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Employee</label>
                <select value={addForm.employee_id} onChange={(e)=>setAddForm({...addForm, employee_id: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black">
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Salary Base</label>
                <input type="number" min="0" value={addForm.salary_base} onChange={(e)=>setAddForm({...addForm, salary_base: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black" placeholder="50000" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Start Date</label>
                <input type="date" value={addForm.start_date} onChange={(e)=>setAddForm({...addForm, start_date: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">End Date (Pay Date)</label>
                <input type="date" value={addForm.end_date} onChange={(e)=>setAddForm({...addForm, end_date: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={async()=>{
                  if (!addForm.employee_id || !addForm.start_date || !addForm.end_date) return;
                  const o = await calculateOvertimeFromAttendance(addForm.employee_id, addForm.start_date, addForm.end_date);
                  setAddForm({...addForm, overtime: String(o)});
                }} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Calc Overtime</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Bonus</label>
                <input type="number" min="0" value={addForm.bonus} onChange={(e)=>setAddForm({...addForm, bonus: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Overtime</label>
                <input type="number" min="0" value={addForm.overtime} onChange={(e)=>setAddForm({...addForm, overtime: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Deductions</label>
                <input type="number" min="0" value={addForm.deductions} onChange={(e)=>setAddForm({...addForm, deductions: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black" placeholder="0" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={()=>setShowAddModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={adding} className="px-4 py-2 bg-orange-700 text-white rounded-md hover:bg-orange-800 disabled:opacity-50">{adding? 'Adding…' : 'Add Entry'}</button>
            </div>
          </form>
        </div>
      </div>, document.body)
    }
    {/* Payslip View Modal */}
    {showPayslipModal && selectedPayslip && typeof window !== 'undefined' && createPortal(
      <div className="fixed inset-0 z-[2000] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowPayslipModal(false)}></div>
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">Payslip Details</h3>
            <button onClick={() => setShowPayslipModal(false)} className="text-slate-600 hover:text-slate-900">✖</button>
          </div>
          {(() => {
            const employee = employees.find(e => e.id === selectedPayslip.employee_id);
            const amounts = selectedPayslip.amounts || {};
            return (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="text-2xl font-bold text-center mb-4">PAYSLIP</div>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Employee:</span> {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}</p>
                    <p><span className="font-medium">Employee ID:</span> {employee?.employee_id || 'N/A'}</p>
                    <p><span className="font-medium">Issue Date:</span> {selectedPayslip.issue_date}</p>
                    <p><span className="font-medium">Payslip ID:</span> {selectedPayslip.payslip_id}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">EARNINGS:</h4>
                    <div className="space-y-1 ml-4">
                      <div className="flex justify-between">
                        <span>Basic Pay:</span>
                        <span className="font-medium">${(amounts.basic || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime:</span>
                        <span className="font-medium">${(amounts.overtime || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonus:</span>
                        <span className="font-medium">${(amounts.bonus || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-medium">Total Earnings:</span>
                        <span className="font-bold">${((amounts.basic || 0) + (amounts.overtime || 0) + (amounts.bonus || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">DEDUCTIONS:</h4>
                    <div className="ml-4">
                      <div className="flex justify-between">
                        <span>Deductions:</span>
                        <span className="font-medium text-red-600">-${(amounts.deductions || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t-2 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">NET PAY:</span>
                      <span className="text-2xl font-bold text-green-600">${(amounts.net || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setShowPayslipModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Close</button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>, document.body)
    }
  </>);
}
