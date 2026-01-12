'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import { authFetch } from '../../lib/api-client';
import jsPDF from 'jspdf';

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'Vacation', start_date: '', end_date: '' });
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!user) {
      return;
    }
    loadData();
    // Update time every minute
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (employee && !showLeaveModal) {
      loadTodayAttendance();
    }
  }, [employee, showLeaveModal]);

  async function loadData() {
    setLoading(true);
    try {
      // Load employee profile
      const empRes = await authFetch('/api/employees', { cache: 'no-store' });
      const employees = await empRes.json();
      if (employees && employees.length > 0) {
        setEmployee(employees[0]);
      }

      // Load attendance (all records for this employee)
      const attRes = await authFetch('/api/attendance', { cache: 'no-store' });
      const attendanceData = await attRes.json();
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);

      // Load leaves
      const leaveRes = await authFetch('/api/leave', { cache: 'no-store' });
      const leavesData = await leaveRes.json();
      setLeaves(Array.isArray(leavesData) ? leavesData : []);

      // Load payslips
      const payslipRes = await authFetch('/api/payslips', { cache: 'no-store' });
      const payslipData = await payslipRes.json();
      setPayslips(Array.isArray(payslipData) ? payslipData : []);

      // Load payroll data
      if (employees && employees.length > 0) {
        const payrollRes = await authFetch('/api/payroll', { cache: 'no-store' });
        const payrollData = await payrollRes.json();
        const employeePayroll = Array.isArray(payrollData) 
          ? payrollData.find(p => p.employee_id === employees[0].id) || null
          : null;
        setPayroll(employeePayroll);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTodayAttendance() {
    if (!employee) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const attRes = await authFetch(`/api/attendance?date=${today}`, { cache: 'no-store' });
      const attData = await attRes.json();
      const todayAtt = Array.isArray(attData) ? attData.find(a => a.employee_id === employee.id) : null;
      setTodayAttendance(todayAtt);
    } catch (error) {
      console.error('Failed to load today attendance:', error);
    }
  }

  async function recordTimeInOut(type) {
    if (!employee) return;
    const today = new Date().toISOString().slice(0, 10);
    const currentTimeStr = currentTime.toTimeString().slice(0, 5); // HH:MM format
    
    try {
      const existing = todayAttendance;
      
      let payload = {
        employee_id: employee.id,
        date: today
      };

      if (type === 'in') {
        payload.time_in = currentTimeStr;
        if (existing?.time_out) {
          payload.time_out = existing.time_out;
          const [inHour, inMin] = currentTimeStr.split(':').map(Number);
          const [outHour, outMin] = existing.time_out.split(':').map(Number);
          const inMinutes = inHour * 60 + inMin;
          const outMinutes = outHour * 60 + outMin;
          const hoursWorked = (outMinutes - inMinutes) / 60;
          payload.hours_worked = Math.max(0, hoursWorked).toFixed(2);
        }
      } else if (type === 'out') {
        payload.time_out = currentTimeStr;
        if (existing?.time_in) {
          payload.time_in = existing.time_in;
          const [inHour, inMin] = existing.time_in.split(':').map(Number);
          const [outHour, outMin] = currentTimeStr.split(':').map(Number);
          const inMinutes = inHour * 60 + inMin;
          const outMinutes = outHour * 60 + outMin;
          const hoursWorked = (outMinutes - inMinutes) / 60;
          payload.hours_worked = Math.max(0, hoursWorked).toFixed(2);
        }
      }

      if (existing?.id) {
        // Update existing record
        const res = await authFetch('/api/attendance', {
          method: 'PUT',
          body: JSON.stringify({ id: existing.id, updates: payload })
        });
        if (!res.ok) throw new Error('Failed to update attendance');
      } else {
        // Create new record
        const res = await authFetch('/api/attendance', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to record attendance');
      }

      await loadTodayAttendance();
      await loadData();
      alert(`Time ${type === 'in' ? 'In' : 'Out'} recorded successfully!`);
    } catch (error) {
      console.error('Failed to record attendance:', error);
      alert(`Failed to record time ${type === 'in' ? 'in' : 'out'}`);
    }
  }

  async function submitLeaveRequest(e) {
    e.preventDefault();
    if (!employee || !leaveForm.start_date || !leaveForm.end_date) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Calculate days and check limit
    const startDate = new Date(leaveForm.start_date);
    const endDate = new Date(leaveForm.end_date);
    const days = Math.max(0, Math.floor((endDate - startDate) / 86400000) + 1);
    const limit = leaveLimitations[leaveForm.leave_type] || 0;
    const willBeRejected = limit > 0 && days > limit;
    
    if (willBeRejected) {
      const confirmed = window.confirm(
        `⚠️ Warning: This leave request (${days} days) exceeds the limit for ${leaveForm.leave_type} (${limit} days).\n\n` +
        `The request will be automatically rejected. Do you want to proceed?`
      );
      if (!confirmed) return;
    }
    
    setSubmittingLeave(true);
    try {
      const res = await authFetch('/api/leave', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: employee.id,
          leave_type: leaveForm.leave_type,
          start_date: leaveForm.start_date,
          end_date: leaveForm.end_date,
          status: 'Pending' // API will auto-reject if exceeds limit
        })
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to submit leave request');
      }
      
      const leaveData = await res.json();
      setShowLeaveModal(false);
      setLeaveForm({ leave_type: 'Vacation', start_date: '', end_date: '' });
      await loadData();
      
      if (leaveData.status === 'Rejected') {
        const startDate = new Date(leaveForm.start_date);
        const endDate = new Date(leaveForm.end_date);
        const days = Math.max(0, Math.floor((endDate - startDate) / 86400000) + 1);
        const limit = leaveLimitations[leaveForm.leave_type] || 0;
        const rejectionReason = `Requested ${days} days exceeds the limit of ${limit} days for ${leaveForm.leave_type}`;
        alert(`⚠️ Leave request was automatically rejected.\n\nReason: ${rejectionReason}`);
      } else {
        alert('Leave request submitted successfully!');
      }
    } catch (error) {
      console.error('Leave request error:', error);
      alert(error.message || 'Failed to submit leave request');
    } finally {
      setSubmittingLeave(false);
    }
  }

  // Leave limitations per type
  const leaveLimitations = {
    'Vacation': 6,
    'Sick Leave': 4,
    'Personal Leave': 2,
    'Emergency Leave': 2
  };

  function formatTime(value) {
    if (!value) return '--:--';
    const str = String(value);
    const m = str.match(/^(\d{2}:\d{2})/);
    if (m) return m[1];
    try {
      const d = new Date(`1970-01-01T${str.replace('Z','')}Z`);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_e) { return str; }
  }

  // Format hours and minutes from decimal hours (e.g., 8.5 -> "8h 30m")
  function formatHoursMinutes(decimalHours) {
    if (!decimalHours || decimalHours === 0) return '0h 0m';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    if (minutes === 0) return `${hours}h`;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }

  function downloadPayslipPDF(payslip) {
    if (!payslip || !employee) return;
    
    const amounts = payslip.amounts || {};
    const basicPay = Number(amounts.basic || payslip.salary_base || 0);
    const overtime = Number(amounts.overtime || payslip.overtime || 0);
    const bonus = Number(amounts.bonus || payslip.bonus || 0);
    const deductions = Number(amounts.deductions || payslip.deductions || 0);
    const netPay = Number(amounts.net || payslip.net_pay || payslip.amount || 0);
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let y = 20;
    
    // Header
    pdf.setFillColor(0, 102, 0); // Green background
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Starbucks Partner Management', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(18);
    pdf.text('PAYSLIP', pageWidth / 2, 35, { align: 'center' });
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    y = 50;
    
    // Employee Information
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Employee Information', 20, y);
    y += 8;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim()}`, 20, y);
    y += 6;
    pdf.text(`Position: ${employee.job_title || user?.position || 'N/A'}`, 20, y);
    y += 6;
    pdf.text(`Department: ${employee.department || 'N/A'}`, 20, y);
    y += 6;
    pdf.text(`Employee ID: ${payslip.payslip_id?.slice(0, 8) || payslip.id?.slice(0, 8) || 'N/A'}`, 20, y);
    y += 10;
    
    // Payslip Details
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payslip Details', 20, y);
    y += 8;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Issue Date: ${payslip.issue_date || 'N/A'}`, 20, y);
    y += 6;
    if (payslip.period_start && payslip.period_end) {
      pdf.text(`Pay Period: ${payslip.period_start} to ${payslip.period_end}`, 20, y);
      y += 6;
    }
    y += 5;
    
    // Earnings and Deductions Table
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Earnings', 20, y);
    pdf.text('Amount', pageWidth - 60, y, { align: 'right' });
    y += 8;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Basic Pay', 25, y);
    pdf.text(`₱${basicPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' });
    y += 6;
    
    if (overtime > 0) {
      pdf.text('Overtime', 25, y);
      pdf.text(`₱${overtime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' });
      y += 6;
    }
    
    if (bonus > 0) {
      pdf.text('Bonus', 25, y);
      pdf.text(`₱${bonus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' });
      y += 6;
    }
    
    const totalEarnings = basicPay + overtime + bonus;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Earnings', 20, y);
    pdf.text(`₱${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' });
    y += 10;
    
    if (deductions > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Deductions', 20, y);
      y += 8;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Deductions', 25, y);
      pdf.text(`₱${deductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' });
      y += 10;
    }
    
    // Net Pay
    pdf.setFillColor(240, 240, 240);
    pdf.rect(15, y - 5, pageWidth - 30, 15, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Net Pay', 20, y + 5);
    pdf.setTextColor(0, 102, 0);
    pdf.text(`₱${netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, y + 5, { align: 'right' });
    
    // Footer
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('This is a computer-generated payslip. No signature required.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Generate filename
    const employeeName = (employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim()).replace(/\s+/g, '_');
    const dateStr = payslip.issue_date || new Date().toISOString().slice(0, 10);
    const filename = `Payslip_${employeeName}_${dateStr}.pdf`;
    
    pdf.save(filename);
  }

  // Redirect HR users to overview
  if (user && (user.position === 'HR CEO' || user.position === 'HR Manager')) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-green-600 mb-4">HR Access</h1>
          <p className="text-gray-700 mb-4">You have HR access. Please use the HR management pages.</p>
          <Link href="/" className="text-green-600 hover:underline inline-block">
            Go to Overview
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-green-50 to-orange-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg border-b border-green-200 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-800 to-green-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">☕</span>
              </div>
              <h1 className="text-xl font-bold text-black">My Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-black">{user?.fullName || 'User'}</div>
                <div className="text-xs text-gray-600">{user?.position || 'Employee'}</div>
              </div>
              <Link href="/" className="text-black hover:text-gray-600 font-medium">
                Overview
              </Link>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Full Screen */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 w-full">
          <div className="border-b border-green-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'profile', label: 'My Profile', icon: '👤' },
                { id: 'attendance', label: 'Time & Attendance', icon: '⏰' },
                { id: 'leaves', label: 'Leave Management', icon: '🏖️' },
                { id: 'payslips', label: 'Payslips', icon: '💰' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
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
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black mb-4">My Profile</h2>
                {employee ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-4 text-lg">Personal Information</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600">Full Name:</span>
                          <p className="font-medium text-green-900 text-lg">{employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Position:</span>
                          <p className="font-medium text-green-900 text-lg">{employee.job_title || user?.position || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Department:</span>
                          <p className="font-medium text-green-900 text-lg">{employee.department || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Employment Type:</span>
                          <p className="font-medium text-green-900 text-lg">{employee.employment_type || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Status:</span>
                          <p className="font-medium text-green-900 text-lg">{employee.status || 'Active'}</p>
                        </div>
                        {payroll && (
                          <div>
                            <span className="text-sm text-gray-600">Base Salary:</span>
                            <p className="font-medium text-green-900 text-lg">₱{Number(payroll.salary_base || 0).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                      <h3 className="font-semibold text-orange-900 mb-4 text-lg">Contact Information</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600">Email:</span>
                          <p className="font-medium text-orange-900 text-lg">{user?.email || 'N/A'}</p>
                        </div>
                        {employee.contact_info && (
                          <div>
                            <span className="text-sm text-gray-600">Contact:</span>
                            <p className="font-medium text-orange-900 text-lg">{employee.contact_info}</p>
                          </div>
                        )}
                        {employee.address && (
                          <div>
                            <span className="text-sm text-gray-600">Address:</span>
                            <p className="font-medium text-orange-900 text-lg">{employee.address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Profile information not available.</p>
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-black">Time & Attendance</h2>
                  <div className="text-sm text-gray-600">
                    Current Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Time In/Out Buttons */}
                {employee && (
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200 mb-6">
                    <h3 className="font-semibold text-green-900 mb-4">Today's Attendance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 mb-2">Time In</p>
                        <p className="text-2xl font-bold text-green-700 mb-3">
                          {todayAttendance?.time_in ? formatTime(todayAttendance.time_in) : '--:--'}
                        </p>
                        <button
                          onClick={() => recordTimeInOut('in')}
                          disabled={!!todayAttendance?.time_in}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                            todayAttendance?.time_in
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {todayAttendance?.time_in ? 'Already Timed In' : 'Time In'}
                        </button>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 mb-2">Time Out</p>
                        <p className="text-2xl font-bold text-green-700 mb-3">
                          {todayAttendance?.time_out ? formatTime(todayAttendance.time_out) : '--:--'}
                        </p>
                        <button
                          onClick={() => recordTimeInOut('out')}
                          disabled={!todayAttendance?.time_in || !!todayAttendance?.time_out}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                            !todayAttendance?.time_in || todayAttendance?.time_out
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-orange-600 text-white hover:bg-orange-700'
                          }`}
                        >
                          {todayAttendance?.time_out ? 'Already Timed Out' : 'Time Out'}
                        </button>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 mb-2">Hours Worked</p>
                        <p className="text-2xl font-bold text-green-700">
                          {todayAttendance?.hours_worked ? formatHoursMinutes(Number(todayAttendance.hours_worked)) : '0h 0m'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attendance History */}
                <div>
                  <h3 className="text-xl font-bold text-black mb-4">Attendance History</h3>
                  <div className={`space-y-4 ${attendance.length >= 3 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
                    {attendance.length > 0 ? (
                      attendance
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((record) => (
                          <div key={record.id} className="bg-white border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <span className="text-sm text-gray-600">Date:</span>
                                <p className="font-medium text-black">{record.date}</p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">Time In:</span>
                                <p className="font-medium text-black">{formatTime(record.time_in)}</p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">Time Out:</span>
                                <p className="font-medium text-black">{formatTime(record.time_out)}</p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">Hours Worked:</span>
                                <p className="font-medium text-black">{record.hours_worked ? formatHoursMinutes(Number(record.hours_worked)) : '0h 0m'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-gray-600 text-center py-8">No attendance records found.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leaves' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-black">Leave Management</h2>
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    + Request Leave
                  </button>
                </div>
                <div className="space-y-4">
                  {leaves.length > 0 ? (
                    leaves
                      .sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date))
                      .map((leave) => {
                        const startDate = new Date(leave.start_date);
                        const endDate = new Date(leave.end_date);
                        const days = Math.max(0, Math.floor((endDate - startDate) / 86400000) + 1);
                        const limit = leaveLimitations[leave.leave_type] || 0;
                        const isOverLimit = limit > 0 && days > limit;
                        
                        return (
                          <div key={leave.id} className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                            leave.status === 'Rejected' ? 'border-red-300 bg-red-50' :
                            leave.status === 'Approved' ? 'border-green-300 bg-green-50' :
                            'border-green-200'
                          }`}>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-black text-lg">{leave.leave_type}</h4>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                    leave.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {leave.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-1">
                                  <span className="font-medium">Period:</span> {leave.start_date} to {leave.end_date}
                                </p>
                                <p className="text-sm text-gray-700 mb-1">
                                  <span className="font-medium">Duration:</span> {days} day{days !== 1 ? 's' : ''}
                                  {limit > 0 && (
                                    <span className={`ml-2 ${isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                      (Limit: {limit} days{isOverLimit ? ' - Exceeded!' : ''})
                                    </span>
                                  )}
                                </p>
                                {leave.status === 'Rejected' && (() => {
                                  const startDate = new Date(leave.start_date);
                                  const endDate = new Date(leave.end_date);
                                  const days = Math.max(0, Math.floor((endDate - startDate) / 86400000) + 1);
                                  const limit = leaveLimitations[leave.leave_type] || 0;
                                  const isOverLimit = limit > 0 && days > limit;
                                  if (isOverLimit) {
                                    const rejectionReason = `Requested ${days} days exceeds the limit of ${limit} days for ${leave.leave_type}`;
                                    return (
                                      <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                                        <span className="font-medium">Rejection Reason:</span> {rejectionReason}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-gray-600 text-center py-8">No leave requests found.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'payslips' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black mb-4">My Payslips</h2>
                <div className="space-y-4">
                  {payslips.length > 0 ? (
                    payslips
                      .sort((a, b) => new Date(b.issue_date || b.created_at) - new Date(a.issue_date || a.created_at))
                      .map((payslip) => {
                        const amounts = payslip.amounts || {};
                        return (
                          <div key={payslip.id} className="bg-white border border-green-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-black text-lg mb-2">
                                  Payslip #{payslip.payslip_id?.slice(0, 8) || payslip.id?.slice(0, 8) || 'N/A'}
                                </h4>
                                <p className="text-sm text-gray-600">Issue Date: {payslip.issue_date || 'N/A'}</p>
                                {payslip.period_start && payslip.period_end && (
                                  <p className="text-sm text-gray-600">Period: {payslip.period_start} - {payslip.period_end}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-bold text-green-600">
                                  ₱{Number(amounts.net || payslip.net_pay || payslip.amount || 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">Net Pay</p>
                              </div>
                            </div>
                            {amounts.basic || amounts.overtime || amounts.bonus || amounts.deductions ? (
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 mb-4">
                                <div>
                                  <p className="text-sm text-gray-600">Basic Pay</p>
                                  <p className="font-medium text-black">₱{Number(amounts.basic || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Overtime</p>
                                  <p className="font-medium text-black">₱{Number(amounts.overtime || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Bonus</p>
                                  <p className="font-medium text-black">₱{Number(amounts.bonus || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Deductions</p>
                                  <p className="font-medium text-red-600">-₱{Number(amounts.deductions || 0).toLocaleString()}</p>
                                </div>
                              </div>
                            ) : null}
                            <div className="pt-4 border-t border-gray-200">
                              <button
                                onClick={() => downloadPayslipPDF(payslip)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Payslip PDF
                              </button>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-gray-600 text-center py-8">No payslips found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black">Request Leave</h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={submitLeaveRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                <select
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black"
                  required
                >
                  <option value="Vacation">Vacation (Limit: {leaveLimitations['Vacation'] || 6} days)</option>
                  <option value="Sick Leave">Sick Leave (Limit: {leaveLimitations['Sick Leave'] || 4} days)</option>
                  <option value="Personal Leave">Personal Leave (Limit: {leaveLimitations['Personal Leave'] || 2} days)</option>
                  <option value="Emergency Leave">Emergency Leave (Limit: {leaveLimitations['Emergency Leave'] || 2} days)</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Leave Limit:</strong> {leaveLimitations[leaveForm.leave_type] > 0 ? `${leaveLimitations[leaveForm.leave_type]} days` : 'No limit'}
                </p>
                {leaveForm.start_date && leaveForm.end_date && (() => {
                  const startDate = new Date(leaveForm.start_date);
                  const endDate = new Date(leaveForm.end_date);
                  const days = Math.max(0, Math.floor((endDate - startDate) / 86400000) + 1);
                  const limit = leaveLimitations[leaveForm.leave_type] || 0;
                  const isOverLimit = limit > 0 && days > limit;
                  return (
                    <p className={`text-sm mt-1 ${isOverLimit ? 'text-red-600 font-semibold' : 'text-blue-700'}`}>
                      <strong>Requested Duration:</strong> {days} day{days !== 1 ? 's' : ''}
                      {isOverLimit && ' (Exceeds limit - will be auto-rejected)'}
                    </p>
                  );
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                {(() => {
                  const isOverLimit = leaveForm.start_date && leaveForm.end_date && (() => {
                    const startDate = new Date(leaveForm.start_date);
                    const endDate = new Date(leaveForm.end_date);
                    const days = Math.max(0, Math.floor((endDate - startDate) / 86400000) + 1);
                    const limit = leaveLimitations[leaveForm.leave_type] || 0;
                    return limit > 0 && days > limit;
                  })();
                  return (
                    <button
                      type="submit"
                      disabled={submittingLeave}
                      className={`px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 ${
                        isOverLimit ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {submittingLeave ? 'Submitting...' : (isOverLimit ? 'Submit (Will be Rejected)' : 'Submit Request')}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
