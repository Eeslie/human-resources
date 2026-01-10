'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { SidebarInset } from '@humanresource/components/ui/sidebar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@humanresource/components/ui/tooltip';
import HROnlyRoute from '../../components/HROnlyRoute';
import { authFetch } from '../../lib/api-client';

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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const pageSize = 6;
  const modalCheckId = useRef(0);

  // Fetch helpers
  async function fetchEmployees() {
    const res = await authFetch('/api/employees', { cache: 'no-store' });
    const data = await res.json();
    setEmployees(Array.isArray(data) ? data : []);
  }
  async function fetchPayrolls() {
    const res = await authFetch('/api/payroll', { cache: 'no-store' });
    const data = await res.json();
    setPayrolls(Array.isArray(data) ? data : []);
  }
  async function fetchPayslips() {
    const res = await authFetch('/api/payslips', { cache: 'no-store' });
    const data = await res.json();
    setPayslips(Array.isArray(data) ? data : []);
  }

  async function fetchAttendance() {
    const res = await authFetch('/api/attendance', { cache: 'no-store' });
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
    { id: 'process', label: 'Total Payroll', icon: '⚡' },
    { id: 'payslips', label: 'Payslips', icon: '📄' }
  ];

  // Calculation: show ALL employees in payroll overview, with payroll data if available
  const payrollRows = useMemo(() => {
    // Group payrolls by employee_id - for each employee, keep only the most recent payroll
    const payrollByEmployeeId = new Map();
    
    // Process all payrolls and keep only the most recent one for each employee
    payrolls.forEach(p => {
      const empId = String(p.employee_id).trim();
      const existing = payrollByEmployeeId.get(empId);
      
      if (!existing) {
        // First payroll for this employee
        payrollByEmployeeId.set(empId, p);
      } else {
        // Compare dates to keep the most recent
        const existingDate = existing.created_at ? new Date(existing.created_at).getTime() : 0;
        const currentDate = p.created_at ? new Date(p.created_at).getTime() : 0;
        if (currentDate > existingDate) {
          payrollByEmployeeId.set(empId, p);
        }
      }
    });
    
    // Create rows for ALL employees
    const rows = employees.map(emp => {
      const empIdStr = String(emp.id).trim();
      const payroll = payrollByEmployeeId.get(empIdStr);
      
      if (payroll) {
        // Employee has payroll entry - use actual data
        // Handle both string and number formats from API - salary_base comes as string
        const basicSalary = payroll.salary_base !== undefined && payroll.salary_base !== null && String(payroll.salary_base).trim() !== ''
          ? parseFloat(String(payroll.salary_base)) || 0
          : 0;
        const bonus = payroll.bonus !== undefined && payroll.bonus !== null && String(payroll.bonus).trim() !== ''
          ? parseFloat(String(payroll.bonus)) || 0
          : 0;
        const overtime = payroll.overtime !== undefined && payroll.overtime !== null && String(payroll.overtime).trim() !== ''
          ? parseFloat(String(payroll.overtime)) || 0
          : 0;
        const deductions = payroll.deductions !== undefined && payroll.deductions !== null && String(payroll.deductions).trim() !== ''
          ? parseFloat(String(payroll.deductions)) || 0
          : 0;
        const netPay = basicSalary + bonus + overtime - deductions;
        
        return {
          id: payroll.id,
          employee_id: emp.id,
          employee: `${emp.first_name} ${emp.last_name}`,
          position: emp.job_title || '',
          basicSalary,
          overtime,
          bonuses: bonus,
          deductions,
          netPay,
          status: payroll.status || 'Approved',
          payPeriod: payroll.payroll_date || payroll.created_at?.slice(0,10) || '',
          hasPayroll: true,
          avatar: '💵'
        };
      } else {
        // Employee has NO payroll entry yet - show with 0 values
        return {
          id: `emp-${emp.id}`,
          employee_id: emp.id,
          employee: `${emp.first_name} ${emp.last_name}`,
          position: emp.job_title || '',
          basicSalary: 0,
          overtime: 0,
          bonuses: 0,
          deductions: 0,
          netPay: 0,
          status: 'No Entry',
          payPeriod: '',
          hasPayroll: false,
          avatar: '💵'
        };
      }
    });
    
    return rows;
  }, [payrolls, employees]);

  // Helper to get employee salary based on job title
  function getEmployeeSalary(jobTitle) {
    const title = (jobTitle || '').toLowerCase();
    if (title.includes('manager')) return 25000;
    if (title.includes('barista')) return 17000;
    return 15000; // Default for Employee
  }

  // Helper to format currency in peso
  function formatPeso(amount) {
    return `₱${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Editable Salary Cell Component
  function EditableSalaryCell({ value, onSave, employeeId, payrollId, field, hasPayroll }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || 0);
    const [saving, setSaving] = useState(false);

    // Update editValue when value prop changes
    useEffect(() => {
      setEditValue(value || 0);
    }, [value]);

    const handleSave = async () => {
      if (!hasPayroll) {
        // If no payroll entry exists, we need to create one first
        alert('Please add a salary entry first using "Add Salary" button');
        setIsEditing(false);
        setEditValue(value || 0);
        return;
      }

      setSaving(true);
      try {
        const numValue = parseFloat(editValue) || 0;
        
        // Update the payroll entry
        const res = await fetch(`/api/payroll/${payrollId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: payrollId,
            [field]: numValue
          })
        });

        if (res.ok) {
          setIsEditing(false);
          // Refresh data to recalculate net pay
          if (onSave) onSave();
        } else {
          const errorData = await res.json();
          alert(`Failed to update salary: ${errorData.error || 'Unknown error'}`);
          setEditValue(value || 0);
        }
      } catch (error) {
        console.error('Error updating salary:', error);
        alert('Error updating salary. Please try again.');
        setEditValue(value || 0);
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => {
      setIsEditing(false);
      setEditValue(value || 0);
    };

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.01"
            min="0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-xs w-28 text-black"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            disabled={saving}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-green-600 hover:text-green-800 text-xs font-medium px-1 disabled:opacity-50"
            title="Save"
          >
            {saving ? '...' : '✓'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="text-red-600 hover:text-red-800 text-xs font-medium px-1 disabled:opacity-50"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span>{formatPeso(value)}</span>
        {hasPayroll && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-orange-600 hover:text-orange-800 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            title={`Edit ${field.replace('_', ' ')}`}
          >
            ✏️
          </button>
        )}
      </div>
    );
  }

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

  // Helper to get attendance data for payslip
  async function getAttendanceForPayslip(employeeId, startDate, endDate) {
    try {
      const res = await fetch(`/api/attendance?employee_id=${employeeId}&start_date=${startDate}&end_date=${endDate}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const totalHours = data.reduce((sum, record) => sum + Number(record.hours_worked || 0), 0);
        const totalDays = data.filter(r => r.time_in).length;
        return { totalHours, totalDays, records: data };
      }
      return { totalHours: 0, totalDays: 0, records: [] };
    } catch (error) {
      console.error('Failed to get attendance:', error);
      return { totalHours: 0, totalDays: 0, records: [] };
    }
  }

  // Helpers to add/edit payroll lines and process
  async function addPayrollLine() {
    // Refresh employees list to include newly created employees
    await fetchEmployees();
    setAddForm({
      employee_id: '',
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
          status: 'Approved'
        };
        const res = await fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) fetchPayrolls();
      }
    }, 250);
  }

  useEffect(() => {
    if (showAddModal) {
      // Refresh employees when modal opens to include newly created ones
      fetchEmployees();
    }
  }, [showAddModal]);

  useEffect(() => {
    // Set first employee when employees load and modal is open
    if (showAddModal && !addForm.employee_id && employees.length > 0) {
      setAddForm((f) => ({ ...f, employee_id: employees[0].id }));
    }
  }, [employees, showAddModal, addForm.employee_id]);

  async function submitAddPayroll(e) {
    e?.preventDefault?.();
    
    // Validation with clear error messages
    if (!addForm.employee_id) {
      alert('Please select an employee');
      return;
    }
    if (!addForm.end_date) {
      alert('Please enter an end date (Pay Date)');
      return;
    }
    if (!addForm.salary_base || String(addForm.salary_base).trim() === '') {
      alert('Please enter a salary base amount');
      return;
    }
    
    setAdding(true);
    try {
      // Require manual salary input - no automatic fallback
      const salaryBase = Number(addForm.salary_base);
      if (!salaryBase || salaryBase <= 0 || isNaN(salaryBase)) {
        alert('Please enter a valid salary amount (must be greater than 0)');
        setAdding(false);
        return;
      }
      
      let overtimeVal = addForm.overtime;
      if (overtimeVal === '' && addForm.start_date && addForm.end_date) {
        overtimeVal = await calculateOvertimeFromAttendance(addForm.employee_id, addForm.start_date, addForm.end_date);
      }
      
      // Get attendance data for payslip
      const attendanceData = addForm.start_date && addForm.end_date 
        ? await getAttendanceForPayslip(addForm.employee_id, addForm.start_date, addForm.end_date)
        : { totalHours: 0, totalDays: 0, records: [] };
      
      const body = {
        payroll_id: crypto.randomUUID(),
        employee_id: addForm.employee_id,
        salary_base: salaryBase,
        bonus: Number(addForm.bonus || 0),
        overtime: Number(overtimeVal || 0),
        deductions: Number(addForm.deductions || 0),
        payroll_date: addForm.end_date,
        status: 'Approved'
      };
      
      const res = await fetch('/api/payroll', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.details || `HTTP ${res.status}: Failed to save payroll`);
      }
      const created = await res.json();
      
      // Immediately refresh payrolls to show the new entry
      await fetchPayrolls();
      
      // Immediately create a payslip so it appears under Payslips with attendance data
      try {
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
          },
          attendance: {
            totalHours: attendanceData.totalHours,
            totalDays: attendanceData.totalDays,
            records: attendanceData.records
          }
        };
        await fetch('/api/payslips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payslipPayload) });
      } catch (payslipError) {
        console.warn('Failed to create payslip (non-critical):', payslipError);
      }
      
      setShowAddModal(false);
      // Reset form after successful submission
      setAddForm({
        employee_id: '',
        start_date: '',
        end_date: '',
        salary_base: '',
        bonus: '',
        overtime: '',
        deductions: ''
      });
      
      // Refresh all data
      await Promise.all([fetchEmployees(), fetchPayrolls(), fetchPayslips()]);
      setAdding(false);
      // Don't show alert - just close modal and let the table update
    } catch (error) {
      console.error('Error adding payroll entry:', error);
      const errorMessage = error.message || 'Failed to add payroll entry';
      alert(`Error: ${errorMessage}. Please check the console for more details.`);
      setAdding(false);
    }
  }

  async function generatePayslipFor(row) {
    try {
      if (!row || !row.employee_id) {
        alert('Error: Invalid employee data. Please try again.');
        console.error('generatePayslipFor: Invalid row data', row);
        return;
      }

      let payrollId = row.id;
      let payrollDate = row.payPeriod || new Date().toISOString().slice(0,10);
      
      // If this row is a placeholder without a payroll record, create one first
      if (!row.hasPayroll) {
        const employee = employees.find(e => e.id === row.employee_id);
        const salaryBase = Number(row.basicSalary || 0) || getEmployeeSalary(employee?.job_title);
        const createBody = {
          payroll_id: crypto.randomUUID(),
          employee_id: row.employee_id,
          salary_base: salaryBase,
          bonus: Number(row.bonuses || 0),
          overtime: Number(row.overtime || 0),
          deductions: Number(row.deductions || 0),
          payroll_date: payrollDate,
          status: 'Approved'
        };
        const createRes = await fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createBody) });
        if (createRes.ok) {
          const created = await createRes.json();
          payrollId = created.id || created.payroll_id || payrollId;
          payrollDate = created.payroll_date || payrollDate;
        } else {
          const errorData = await createRes.json().catch(() => ({}));
          alert(`Failed to create payroll entry: ${errorData.error || 'Unknown error'}`);
          return;
        }
      }

      // Get attendance data for the pay period (assuming monthly, adjust as needed)
      const startDate = new Date(payrollDate);
      startDate.setDate(1); // First day of month
      const endDate = new Date(payrollDate);
      const attendanceData = await getAttendanceForPayslip(row.employee_id, startDate.toISOString().slice(0,10), endDate.toISOString().slice(0,10));

      const payload = {
        payslip_id: crypto.randomUUID(),
        payroll_id: payrollId,
        employee_id: row.employee_id,
        issue_date: payrollDate,
        amounts: {
          basic: Number(row.basicSalary || 0),
          bonus: Number(row.bonuses || 0),
          overtime: Number(row.overtime || 0),
          deductions: Number(row.deductions || 0),
          net: Number(row.netPay || 0)
        },
        attendance: {
          totalHours: attendanceData.totalHours,
          totalDays: attendanceData.totalDays,
          records: attendanceData.records
        }
      };
      
      const res = await fetch('/api/payslips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const savedPayslip = await res.json();
        await fetchPayslips();
        
        // Generate and download PDF
        const employee = employees.find(e => e.id === row.employee_id);
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.width;
        let yPos = 20;
        
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text('PAYSLIP', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const now = new Date();
        pdf.text(`Generated: ${now.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, yPos);
        yPos += 5;
        pdf.text(`Employee: ${employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}`, 14, yPos);
        yPos += 5;
        pdf.text(`Position: ${employee?.job_title || 'N/A'}`, 14, yPos);
        yPos += 5;
        pdf.text(`Employee ID: ${employee?.employee_id || 'N/A'}`, 14, yPos);
        yPos += 5;
        pdf.text(`Issue Date: ${payrollDate}`, 14, yPos);
        yPos += 5;
        pdf.text(`Payslip ID: ${savedPayslip.payslip_id || payload.payslip_id}`, 14, yPos);
        
        if (attendanceData && (attendanceData.totalDays > 0 || attendanceData.totalHours > 0)) {
          yPos += 5;
          pdf.text(`Days Worked: ${attendanceData.totalDays || 0}`, 14, yPos);
          yPos += 5;
          pdf.text(`Total Hours: ${(attendanceData.totalHours || 0).toFixed(2)}h`, 14, yPos);
        }
        yPos += 10;

        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('EARNINGS:', 14, yPos);
        yPos += 8;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Basic Pay: ${formatPeso(payload.amounts.basic)}`, 20, yPos);
        yPos += 5;
        pdf.text(`Overtime: ${formatPeso(payload.amounts.overtime)}`, 20, yPos);
        yPos += 5;
        pdf.text(`Bonus: ${formatPeso(payload.amounts.bonus)}`, 20, yPos);
        yPos += 5;
        pdf.text(`Total Earnings: ${formatPeso(payload.amounts.basic + payload.amounts.overtime + payload.amounts.bonus)}`, 20, yPos);
        yPos += 10;

        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('DEDUCTIONS:', 14, yPos);
        yPos += 8;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Deductions: -${formatPeso(payload.amounts.deductions)}`, 20, yPos);
        yPos += 10;

        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(`NET PAY: ${formatPeso(payload.amounts.net)}`, pageWidth / 2, yPos, { align: 'center' });
        
        // Download the PDF
        const fileName = `payslip-${employee ? `${employee.first_name}-${employee.last_name}` : 'employee'}-${payrollDate}.pdf`;
        pdf.save(fileName);
        
        alert('Payslip generated and downloaded successfully!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to generate payslip: ${errorData.error || 'Unknown error'}`);
        console.error('Payslip generation error:', errorData);
      }
    } catch (error) {
      console.error('Error generating payslip:', error);
      alert(`Error generating payslip: ${error.message || 'Unknown error'}`);
    }
  }

  async function processPayrollRun() {
    if (!payrollRows.length) return alert('No payroll entries to process');
    setProcessing(true);
    try {
      for (const row of payrollRows) {
        await generatePayslipFor(row);
        // Only update status for real payroll rows; placeholders will have been created inside generatePayslipFor
        if (row.hasPayroll) {
          await fetch(`/api/payroll/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Processed' }) });
        }
      }
      await fetchPayrolls();
      alert('Payroll processed and payslips generated.');
    } finally {
      setProcessing(false);
    }
  }

  function exportPayrollToPDF() {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPos = 20;

    // Add header
    pdf.setFontSize(18);
    pdf.text('Payroll Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    pdf.setFontSize(12);
    const now = new Date();
    pdf.text(`Generated: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Table headers
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('Employee', 14, yPos);
    pdf.text('Basic Salary', 60, yPos);
    pdf.text('Overtime', 100, yPos);
    pdf.text('Bonuses', 130, yPos);
    pdf.text('Deductions', 160, yPos);
    pdf.text('Net Pay', 190, yPos);
    yPos += 8;
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');

    // Table rows
    payrollRows.forEach((row) => {
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(row.employee || 'Unknown', 14, yPos, { maxWidth: 45 });
      pdf.text(formatPeso(row.basicSalary), 60, yPos);
      pdf.text(formatPeso(row.overtime), 100, yPos);
      pdf.text(formatPeso(row.bonuses), 130, yPos);
      pdf.text(formatPeso(row.deductions), 160, yPos);
      pdf.text(formatPeso(row.netPay), 190, yPos);
      yPos += 8;
    });

    // Add totals
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = 20;
    }
    yPos += 5;
    pdf.setFont(undefined, 'bold');
    const totalBasic = payrollRows.reduce((sum, r) => sum + r.basicSalary, 0);
    const totalOvertime = payrollRows.reduce((sum, r) => sum + r.overtime, 0);
    const totalBonuses = payrollRows.reduce((sum, r) => sum + r.bonuses, 0);
    const totalDeductions = payrollRows.reduce((sum, r) => sum + r.deductions, 0);
    const totalNet = payrollRows.reduce((sum, r) => sum + r.netPay, 0);
    pdf.text('TOTALS:', 14, yPos);
    pdf.text(formatPeso(totalBasic), 60, yPos);
    pdf.text(formatPeso(totalOvertime), 100, yPos);
    pdf.text(formatPeso(totalBonuses), 130, yPos);
    pdf.text(formatPeso(totalDeductions), 160, yPos);
    pdf.text(formatPeso(totalNet), 190, yPos);

    pdf.save('payroll-report.pdf');
  }

  const payrollStats = useMemo(() => {
    const totalEmployees = employees.length;
    const totalPayroll = payrollRows.reduce((sum, r) => sum + r.netPay, 0);
    const averageSalary = payrollRows.length ? Math.round(totalPayroll / payrollRows.length) : 0;
    const processedThisMonth = payrollRows.filter(r => r.status === 'Processed').length;
    const pendingApproval = payrollRows.filter(r => r.status === 'Approved' || r.status === 'Pending').length;
    return { totalEmployees, totalPayroll, averageSalary, processedThisMonth, pendingApproval };
  }, [employees, payrollRows]);


  return (
    <HROnlyRoute>
      <SidebarInset className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-600 mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-slate-800 truncate">{payrollStats.totalEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white rounded-xl shadow-lg p-6 relative z-10 cursor-help">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-600 mb-1">Monthly Payroll</p>
                    <p className="text-2xl font-bold text-slate-800 truncate">{formatPeso(payrollStats.totalPayroll)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total Monthly Payroll: {formatPeso(payrollStats.totalPayroll)}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white rounded-xl shadow-lg p-6 relative z-10 cursor-help">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-600 mb-1">Avg Salary</p>
                    <p className="text-2xl font-bold text-slate-800 truncate">{formatPeso(payrollStats.averageSalary)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Average Salary: {formatPeso(payrollStats.averageSalary)}</p>
            </TooltipContent>
          </Tooltip>

          <div className="bg-white rounded-xl shadow-lg p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-600 mb-1">Processed</p>
                <p className="text-2xl font-bold text-green-600 truncate">{payrollStats.processedThisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-600 mb-1">Approved</p>
                <p className="text-2xl font-bold text-orange-600 truncate">{payrollStats.pendingApproval}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
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
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-800">Current Payroll Period</h3>
                  <div className="flex space-x-3">
                    <button 
                      type="button" 
                      onClick={async () => {
                        await fetchEmployees(); // Refresh employees list
                        addPayrollLine();
                      }} 
                      className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 pointer-events-auto"
                    >
                      + Add Entry
                    </button>
                    <button onClick={exportPayrollToPDF} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50">
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
                        <tr key={employee.id} className="hover:bg-slate-50 group">
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
                            <EditableSalaryCell
                              value={employee.basicSalary}
                              onSave={async () => { 
                                await fetchPayrolls();
                                await fetchEmployees();
                              }}
                              employeeId={employee.employee_id}
                              payrollId={employee.id}
                              field="salary_base"
                              hasPayroll={employee.hasPayroll}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <EditableSalaryCell
                              value={employee.overtime}
                              onSave={async () => { 
                                await fetchPayrolls();
                                await fetchEmployees();
                              }}
                              employeeId={employee.employee_id}
                              payrollId={employee.id}
                              field="overtime"
                              hasPayroll={employee.hasPayroll}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <EditableSalaryCell
                              value={employee.bonuses}
                              onSave={async () => { 
                                await fetchPayrolls();
                                await fetchEmployees();
                              }}
                              employeeId={employee.employee_id}
                              payrollId={employee.id}
                              field="bonus"
                              hasPayroll={employee.hasPayroll}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            <div className="flex items-center gap-2">
                              <span>-</span>
                              <EditableSalaryCell
                                value={employee.deductions}
                                onSave={async () => { 
                                  await fetchPayrolls();
                                  await fetchEmployees();
                                }}
                                employeeId={employee.employee_id}
                                payrollId={employee.id}
                                field="deductions"
                                hasPayroll={employee.hasPayroll}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatPeso(employee.netPay)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              employee.status === 'Processed' 
                                ? 'bg-green-100 text-green-800' 
                                : employee.status === 'No Entry'
                                ? 'bg-gray-100 text-gray-800'
                                : employee.status === 'Approved'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {employee.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {employee.hasPayroll ? (
                              <>
                                <button onClick={() => { setSelectedPayroll(employee); setShowViewModal(true); }} className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                                <button onClick={() => generatePayslipFor(employee)} className="text-green-600 hover:text-green-900">Generate Payslip</button>
                              </>
                            ) : (
                              <button 
                                onClick={() => {
                                  setAddForm({
                                    employee_id: employee.employee_id,
                                    start_date: '',
                                    end_date: '',
                                    salary_base: '',
                                    bonus: '',
                                    overtime: '',
                                    deductions: ''
                                  });
                                  setShowAddModal(true);
                                }} 
                                className="text-orange-600 hover:text-orange-900 font-medium"
                              >
                                Add Salary
                              </button>
                            )}
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

            {activeTab === 'process' && (() => {
              const totalSalaries = payrollRows.reduce((sum, r) => sum + r.basicSalary, 0);
              const totalBonuses = payrollRows.reduce((sum, r) => sum + r.bonuses, 0);
              const totalDeductions = payrollRows.reduce((sum, r) => sum + r.deductions, 0);
              const totalOvertime = payrollRows.reduce((sum, r) => sum + r.overtime, 0);
              const totalNetPay = payrollRows.reduce((sum, r) => sum + r.netPay, 0);
              return (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-orange-50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Total Payroll Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
                        <h4 className="text-sm font-medium text-slate-600 mb-2">Total Salaries</h4>
                        <p className="text-2xl font-bold text-slate-800">{formatPeso(totalSalaries)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
                        <h4 className="text-sm font-medium text-slate-600 mb-2">Total Bonuses</h4>
                        <p className="text-2xl font-bold text-slate-800">{formatPeso(totalBonuses)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-purple-500">
                        <h4 className="text-sm font-medium text-slate-600 mb-2">Total Overtime Pay</h4>
                        <p className="text-2xl font-bold text-slate-800">{formatPeso(totalOvertime)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
                        <h4 className="text-sm font-medium text-slate-600 mb-2">Total Deductions</h4>
                        <p className="text-2xl font-bold text-red-600">{formatPeso(totalDeductions)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-orange-500 md:col-span-2 lg:col-span-2">
                        <h4 className="text-sm font-medium text-slate-600 mb-2">Total Net Payroll</h4>
                        <p className="text-3xl font-bold text-orange-700">{formatPeso(totalNetPay)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {activeTab === 'payslips' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">Generated Payslips</h3>
                  <div className="flex space-x-3">
                    <button onClick={() => fetchPayslips()} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50">
                      Refresh
                    </button>
                    <button onClick={() => {
                      const pdf = new jsPDF();
                      const pageWidth = pdf.internal.pageSize.width;
                      const pageHeight = pdf.internal.pageSize.height;
                      let yPos = 20;
                      
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
                        const now = new Date();
                        pdf.text(`Generated: ${now.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, yPos);
                        yPos += 5;
                        pdf.text(`Employee: ${employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}`, 14, yPos);
                        yPos += 5;
                        pdf.text(`Position: ${employee?.job_title || 'N/A'}`, 14, yPos);
                        yPos += 5;
                        pdf.text(`Employee ID: ${employee?.employee_id || 'N/A'}`, 14, yPos);
                        yPos += 5;
                        pdf.text(`Issue Date: ${payslip.issue_date}`, 14, yPos);
                        yPos += 5;
                        pdf.text(`Payslip ID: ${payslip.payslip_id}`, 14, yPos);
                        if (payslip.attendance) {
                          yPos += 5;
                          pdf.text(`Days Worked: ${payslip.attendance.totalDays || 0}`, 14, yPos);
                          yPos += 5;
                          pdf.text(`Total Hours: ${(payslip.attendance.totalHours || 0).toFixed(2)}h`, 14, yPos);
                        }
                        yPos += 10;

                        pdf.setFontSize(12);
                        pdf.setFont(undefined, 'bold');
                        pdf.text('EARNINGS:', 14, yPos);
                        yPos += 8;
                        pdf.setFontSize(10);
                        pdf.setFont(undefined, 'normal');
                        pdf.text(`Basic Pay: ${formatPeso(amounts.basic || 0)}`, 20, yPos);
                        yPos += 5;
                        pdf.text(`Overtime: ${formatPeso(amounts.overtime || 0)}`, 20, yPos);
                        yPos += 5;
                        pdf.text(`Bonus: ${formatPeso(amounts.bonus || 0)}`, 20, yPos);
                        yPos += 5;
                        pdf.text(`Total Earnings: ${formatPeso((amounts.basic || 0) + (amounts.overtime || 0) + (amounts.bonus || 0))}`, 20, yPos);
                        yPos += 10;

                        pdf.setFontSize(12);
                        pdf.setFont(undefined, 'bold');
                        pdf.text('DEDUCTIONS:', 14, yPos);
                        yPos += 8;
                        pdf.setFontSize(10);
                        pdf.setFont(undefined, 'normal');
                        pdf.text(`Deductions: -${formatPeso(amounts.deductions || 0)}`, 20, yPos);
                        yPos += 10;

                        pdf.setFontSize(14);
                        pdf.setFont(undefined, 'bold');
                        pdf.text(`NET PAY: ${formatPeso(amounts.net || 0)}`, pageWidth / 2, yPos, { align: 'center' });
                      });
                      
                      pdf.save('all-payslips.pdf');
                    }} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
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
                              {formatPeso(amounts.basic || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {formatPeso(amounts.overtime || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {formatPeso(amounts.bonus || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              -{formatPeso(amounts.deductions || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {formatPeso(amounts.net || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => {
                                  setSelectedPayslip(payslip);
                                  setShowPayslipModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => {
                                  const pdf = new jsPDF();
                                  const pageWidth = pdf.internal.pageSize.width;
                                  let yPos = 20;
                                  
                                  pdf.setFontSize(16);
                                  pdf.setFont(undefined, 'bold');
                                  pdf.text('PAYSLIP', pageWidth / 2, yPos, { align: 'center' });
                                  yPos += 10;
                                  
                                  pdf.setFontSize(10);
                                  pdf.setFont(undefined, 'normal');
                                  const now = new Date();
                                  pdf.text(`Generated: ${now.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, yPos);
                                  yPos += 5;
                                  pdf.text(`Employee: ${employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}`, 14, yPos);
                                  yPos += 5;
                                  pdf.text(`Position: ${employee?.job_title || 'N/A'}`, 14, yPos);
                                  yPos += 5;
                                  pdf.text(`Employee ID: ${employee?.employee_id || 'N/A'}`, 14, yPos);
                                  yPos += 5;
                                  pdf.text(`Issue Date: ${payslip.issue_date}`, 14, yPos);
                                  yPos += 5;
                                  pdf.text(`Payslip ID: ${payslip.payslip_id}`, 14, yPos);
                                  if (payslip.attendance) {
                                    yPos += 5;
                                    pdf.text(`Days Worked: ${payslip.attendance.totalDays || 0}`, 14, yPos);
                                    yPos += 5;
                                    pdf.text(`Total Hours: ${(payslip.attendance.totalHours || 0).toFixed(2)}h`, 14, yPos);
                                  }
                                  yPos += 10;

                                  pdf.setFontSize(12);
                                  pdf.setFont(undefined, 'bold');
                                  pdf.text('EARNINGS:', 14, yPos);
                                  yPos += 8;
                                  pdf.setFontSize(10);
                                  pdf.setFont(undefined, 'normal');
                                  pdf.text(`Basic Pay: ${formatPeso(amounts.basic || 0)}`, 20, yPos);
                                  yPos += 5;
                                  pdf.text(`Overtime: ${formatPeso(amounts.overtime || 0)}`, 20, yPos);
                                  yPos += 5;
                                  pdf.text(`Bonus: ${formatPeso(amounts.bonus || 0)}`, 20, yPos);
                                  yPos += 5;
                                  pdf.text(`Total Earnings: ${formatPeso((amounts.basic || 0) + (amounts.overtime || 0) + (amounts.bonus || 0))}`, 20, yPos);
                                  yPos += 10;

                                  pdf.setFontSize(12);
                                  pdf.setFont(undefined, 'bold');
                                  pdf.text('DEDUCTIONS:', 14, yPos);
                                  yPos += 8;
                                  pdf.setFontSize(10);
                                  pdf.setFont(undefined, 'normal');
                                  pdf.text(`Deductions: -${formatPeso(amounts.deductions || 0)}`, 20, yPos);
                                  yPos += 10;

                                  pdf.setFontSize(14);
                                  pdf.setFont(undefined, 'bold');
                                  pdf.text(`NET PAY: ${formatPeso(amounts.net || 0)}`, pageWidth / 2, yPos, { align: 'center' });
                                  
                                  pdf.save(`payslip-${payslip.payslip_id}.pdf`);
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                Download PDF
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


          </div>
        </div>
      </div>
    </SidebarInset>
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
                <label className="block text-sm font-medium text-slate-700">Employee *</label>
                <select 
                  required
                  value={addForm.employee_id} 
                  onChange={(e)=>setAddForm({...addForm, employee_id: e.target.value})} 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black"
                >
                  <option value="">Select an employee...</option>
                  {employees.length === 0 ? (
                    <option value="" disabled>No employees found. Please add employees first.</option>
                  ) : (
                    employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))
                  )}
                </select>
                {employees.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No employees available. Please add employees in the Employee Records section first.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Salary Base (₱) *</label>
                <input type="number" min="0" required value={addForm.salary_base} onChange={(e)=>setAddForm({...addForm, salary_base: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black" placeholder="Enter salary amount" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Start Date</label>
                <input type="date" value={addForm.start_date} onChange={(e)=>setAddForm({...addForm, start_date: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">End Date (Pay Date) *</label>
                <input type="date" required value={addForm.end_date} onChange={(e)=>setAddForm({...addForm, end_date: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black" />
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
                <label className="block text-sm font-medium text-slate-700">Bonus (₱)</label>
                <input type="number" min="0" value={addForm.bonus} onChange={(e)=>setAddForm({...addForm, bonus: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Overtime (₱)</label>
                <input type="number" min="0" value={addForm.overtime} onChange={(e)=>setAddForm({...addForm, overtime: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-600 focus:ring-orange-600 text-black" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Deductions (₱)</label>
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
    {/* View Payroll Modal */}
    {showViewModal && selectedPayroll && typeof window !== 'undefined' && createPortal(
      <div className="fixed inset-0 z-[2000] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowViewModal(false)}></div>
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">Payroll Details</h3>
            <button onClick={() => setShowViewModal(false)} className="text-slate-600 hover:text-slate-900">✖</button>
          </div>
          {(() => {
            const employee = employees.find(e => e.id === selectedPayroll.employee_id);
            return (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="space-y-2 text-sm text-black">
                    <p><span className="font-medium">Employee:</span> {selectedPayroll.employee || 'Unknown'}</p>
                    <p><span className="font-medium">Position:</span> {selectedPayroll.position || 'N/A'}</p>
                    <p><span className="font-medium">Employee ID:</span> {employee?.employee_id || 'N/A'}</p>
                    <p><span className="font-medium">Pay Period:</span> {selectedPayroll.payPeriod || 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {selectedPayroll.status}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">EARNINGS:</h4>
                    <div className="space-y-1 ml-4 text-black">
                      <div className="flex justify-between">
                        <span>Basic Salary:</span>
                        <span className="font-medium">{formatPeso(selectedPayroll.basicSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime:</span>
                        <span className="font-medium">{formatPeso(selectedPayroll.overtime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonuses:</span>
                        <span className="font-medium">{formatPeso(selectedPayroll.bonuses)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-medium">Total Earnings:</span>
                        <span className="font-bold">{formatPeso(selectedPayroll.basicSalary + selectedPayroll.overtime + selectedPayroll.bonuses)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">DEDUCTIONS:</h4>
                    <div className="ml-4 text-black">
                      <div className="flex justify-between">
                        <span>Deductions:</span>
                        <span className="font-medium text-red-600">-{formatPeso(selectedPayroll.deductions)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t-2 pt-4">
                    <div className="flex justify-between items-center text-black">
                      <span className="text-lg font-bold">NET PAY:</span>
                      <span className="text-2xl font-bold text-green-600">{formatPeso(selectedPayroll.netPay)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => {
                    generatePayslipFor(selectedPayroll);
                    setShowViewModal(false);
                  }} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Generate Payslip PDF
                  </button>
                  <button onClick={() => setShowViewModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Close</button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>, document.body)
    }
    {/* View Payslip Modal */}
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
                  <div className="text-2xl font-bold text-center mb-4 text-black">PAYSLIP</div>
                  <div className="space-y-2 text-sm text-black">
                    <p><span className="font-medium">Generated:</span> {new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p><span className="font-medium">Employee:</span> {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}</p>
                    <p><span className="font-medium">Position:</span> {employee?.job_title || 'N/A'}</p>
                    <p><span className="font-medium">Employee ID:</span> {employee?.employee_id || 'N/A'}</p>
                    <p><span className="font-medium">Issue Date:</span> {selectedPayslip.issue_date}</p>
                    <p><span className="font-medium">Payslip ID:</span> {selectedPayslip.payslip_id}</p>
                    {selectedPayslip.attendance && (
                      <>
                        <p><span className="font-medium">Days Worked:</span> {selectedPayslip.attendance.totalDays || 0}</p>
                        <p><span className="font-medium">Total Hours:</span> {(selectedPayslip.attendance.totalHours || 0).toFixed(2)}h</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">EARNINGS:</h4>
                    <div className="space-y-1 ml-4 text-black">
                      <div className="flex justify-between">
                        <span>Basic Pay:</span>
                        <span className="font-medium">{formatPeso(amounts.basic || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime:</span>
                        <span className="font-medium">{formatPeso(amounts.overtime || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonus:</span>
                        <span className="font-medium">{formatPeso(amounts.bonus || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-medium">Total Earnings:</span>
                        <span className="font-bold">{formatPeso((amounts.basic || 0) + (amounts.overtime || 0) + (amounts.bonus || 0))}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">DEDUCTIONS:</h4>
                    <div className="ml-4 text-black">
                      <div className="flex justify-between">
                        <span>Deductions:</span>
                        <span className="font-medium text-red-600">-{formatPeso(amounts.deductions || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t-2 pt-4">
                    <div className="flex justify-between items-center text-black">
                      <span className="text-lg font-bold">NET PAY:</span>
                      <span className="text-2xl font-bold text-green-600">{formatPeso(amounts.net || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => {
                    const pdf = new jsPDF();
                    const pageWidth = pdf.internal.pageSize.width;
                    let yPos = 20;
                    
                    pdf.setFontSize(16);
                    pdf.setFont(undefined, 'bold');
                    pdf.text('PAYSLIP', pageWidth / 2, yPos, { align: 'center' });
                    yPos += 10;
                    
                    pdf.setFontSize(10);
                    pdf.setFont(undefined, 'normal');
                    const now = new Date();
                    pdf.text(`Generated: ${now.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, yPos);
                    yPos += 5;
                    pdf.text(`Employee: ${employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}`, 14, yPos);
                    yPos += 5;
                    pdf.text(`Position: ${employee?.job_title || 'N/A'}`, 14, yPos);
                    yPos += 5;
                    pdf.text(`Employee ID: ${employee?.employee_id || 'N/A'}`, 14, yPos);
                    yPos += 5;
                    pdf.text(`Issue Date: ${selectedPayslip.issue_date}`, 14, yPos);
                    yPos += 5;
                    pdf.text(`Payslip ID: ${selectedPayslip.payslip_id}`, 14, yPos);
                    if (selectedPayslip.attendance) {
                      yPos += 5;
                      pdf.text(`Days Worked: ${selectedPayslip.attendance.totalDays || 0}`, 14, yPos);
                      yPos += 5;
                      pdf.text(`Total Hours: ${(selectedPayslip.attendance.totalHours || 0).toFixed(2)}h`, 14, yPos);
                    }
                    yPos += 10;

                    pdf.setFontSize(12);
                    pdf.setFont(undefined, 'bold');
                    pdf.text('EARNINGS:', 14, yPos);
                    yPos += 8;
                    pdf.setFontSize(10);
                    pdf.setFont(undefined, 'normal');
                    pdf.text(`Basic Pay: ${formatPeso(amounts.basic || 0)}`, 20, yPos);
                    yPos += 5;
                    pdf.text(`Overtime: ${formatPeso(amounts.overtime || 0)}`, 20, yPos);
                    yPos += 5;
                    pdf.text(`Bonus: ${formatPeso(amounts.bonus || 0)}`, 20, yPos);
                    yPos += 5;
                    pdf.text(`Total Earnings: ${formatPeso((amounts.basic || 0) + (amounts.overtime || 0) + (amounts.bonus || 0))}`, 20, yPos);
                    yPos += 10;

                    pdf.setFontSize(12);
                    pdf.setFont(undefined, 'bold');
                    pdf.text('DEDUCTIONS:', 14, yPos);
                    yPos += 8;
                    pdf.setFontSize(10);
                    pdf.setFont(undefined, 'normal');
                    pdf.text(`Deductions: -${formatPeso(amounts.deductions || 0)}`, 20, yPos);
                    yPos += 10;

                    pdf.setFontSize(14);
                    pdf.setFont(undefined, 'bold');
                    pdf.text(`NET PAY: ${formatPeso(amounts.net || 0)}`, pageWidth / 2, yPos, { align: 'center' });
                    
                    pdf.save(`payslip-${selectedPayslip.payslip_id}.pdf`);
                    setShowPayslipModal(false);
                  }} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Download PDF
                  </button>
                  <button onClick={() => setShowPayslipModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Close</button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>, document.body)
    }
    </HROnlyRoute>
  );
}
