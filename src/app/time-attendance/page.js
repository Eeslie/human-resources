'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function TimeAttendance() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [timesheetAgg, setTimesheetAgg] = useState([]);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({ id: null, employee_id: '', date: '', time_in: '', time_out: '', hours_worked: '' });
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ employee_id: '', leave_type: 'Vacation', start_date: '', end_date: '', status: 'Pending' });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [leaveFilter, setLeaveFilter] = useState('All Types');
  const [timesheetRange, setTimesheetRange] = useState('Current Week');
  const [selectedDate, setSelectedDate] = useState(isoToday());
  const [currentPage, setCurrentPage] = useState({ attendance: 1, timesheets: 1, leave: 1 });
  const itemsPerPage = 10;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'attendance', label: 'Attendance', icon: '⏰' },
    { id: 'timesheets', label: 'Timesheets', icon: '📝' },
    { id: 'leave', label: 'Leave Management', icon: '🏖️' },
    { id: 'reports', label: 'Reports', icon: '📋' }
  ];

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

  function isoToday() {
    return new Date().toISOString().slice(0,10);
  }

  function weekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMon = (day + 6) % 7; // Mon=0
    const start = new Date(d); start.setDate(d.getDate() - diffToMon);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    const toIso = (x) => x.toISOString().slice(0,10);
    return { start: toIso(start), end: toIso(end) };
  }

  useEffect(() => {
    async function loadAll() {
      const [empRes, attRes, leaveRes] = await Promise.all([
        fetch('/api/employees', { cache: 'no-store' }),
        fetch(`/api/attendance?date=${selectedDate}`, { cache: 'no-store' }),
        fetch('/api/leave', { cache: 'no-store' })
      ]);
      const [emp, att, leaves] = await Promise.all([
        empRes.json().catch(() => []),
        attRes.json().catch(() => []),
        leaveRes.json().catch(() => [])
      ]);
      
      setEmployees(Array.isArray(emp) ? emp : []);
      setAttendanceToday(Array.isArray(att) ? att : []);
      setRecentLeaves(Array.isArray(leaves) ? leaves.slice(0, 6) : []);

      const { start, end } = weekRange();
      const tsRes = await fetch(`/api/timesheets?start_date=${start}&end_date=${end}`, { cache: 'no-store' });
      const ts = await tsRes.json().catch(() => []);
      setTimesheetAgg(Array.isArray(ts) ? ts : []);
    }
    loadAll();
  }, [selectedDate]);

  // Ensure UI reflects new attendance rows added to DB by reloading when modal closes
  useEffect(() => {
    if (!attendanceModalOpen) {
      (async () => {
        const attRes = await fetch(`/api/attendance?date=${selectedDate}`, { cache: 'no-store' });
        const att = await attRes.json().catch(() => []);
        setAttendanceToday(Array.isArray(att) ? att : []);
      })();
    }
  }, [attendanceModalOpen, selectedDate]);

  async function saveAttendance(e) {
    e?.preventDefault?.();
    const payload = { employee_id: attendanceForm.employee_id, date: attendanceForm.date, time_in: attendanceForm.time_in || null, time_out: attendanceForm.time_out || null, hours_worked: attendanceForm.hours_worked || null };
    if (attendanceForm.id) {
      await fetch('/api/attendance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: attendanceForm.id, updates: payload }) });
    } else {
      await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    setAttendanceModalOpen(false);
    // refresh today attendance
    const attRes = await fetch(`/api/attendance?date=${encodeURIComponent(attendanceForm.date || isoToday())}`, { cache: 'no-store' });
    const att = await attRes.json().catch(() => []);
    setAttendanceToday(Array.isArray(att) ? att : []);
    // refresh timesheets based on current range
    await refreshTimesheets();
  }

  async function deleteAttendance() {
    if (!attendanceForm.id) return;
    await fetch(`/api/attendance?id=${encodeURIComponent(attendanceForm.id)}`, { method: 'DELETE' });
    setAttendanceModalOpen(false);
    const attRes = await fetch(`/api/attendance?date=${isoToday()}`, { cache: 'no-store' });
    const att = await attRes.json().catch(() => []);
    setAttendanceToday(Array.isArray(att) ? att : []);
  }

  function openAttendanceEdit(row) {
    const existing = (attendanceToday || []).find(a => a.employee_id === row.employee_id);
    setAttendanceForm({
      id: existing?.id || null,
      employee_id: existing?.employee_id || row.employee_id,
      date: existing?.date || isoToday(),
      time_in: existing?.time_in || '',
      time_out: existing?.time_out || '',
      hours_worked: existing?.hours_worked || ''
    });
    setAttendanceModalOpen(true);
  }

  async function recordRealTimeAttendance(employeeId, type) {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const today = isoToday();
    
    // Check if attendance record exists for today
    const existing = (attendanceToday || []).find(a => a.employee_id === employeeId);
    
    let payload = {
      employee_id: employeeId,
      date: today
    };

    if (type === 'in') {
      payload.time_in = currentTime;
      // Preserve existing time_out if it exists
      if (existing?.time_out) {
        payload.time_out = existing.time_out;
        // Recalculate hours if time_out already exists
        const [inHour, inMin] = currentTime.split(':').map(Number);
        const [outHour, outMin] = existing.time_out.split(':').map(Number);
        const inMinutes = inHour * 60 + inMin;
        const outMinutes = outHour * 60 + outMin;
        const hoursWorked = (outMinutes - inMinutes) / 60;
        payload.hours_worked = Math.max(0, hoursWorked).toFixed(2);
      }
    } else if (type === 'out') {
      payload.time_out = currentTime;
      // Preserve existing time_in
      if (existing?.time_in) {
        payload.time_in = existing.time_in;
        // Calculate hours worked
        const [inHour, inMin] = existing.time_in.split(':').map(Number);
        const [outHour, outMin] = currentTime.split(':').map(Number);
        const inMinutes = inHour * 60 + inMin;
        const outMinutes = outHour * 60 + outMin;
        const hoursWorked = (outMinutes - inMinutes) / 60;
        payload.hours_worked = Math.max(0, hoursWorked).toFixed(2);
      } else {
        // If no time_in exists, we still need to set time_out but can't calculate hours
        payload.hours_worked = null;
      }
    }

    try {
      if (existing?.id) {
        // Update existing record
        const res = await fetch('/api/attendance', { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ id: existing.id, updates: payload }) 
        });
        if (!res.ok) throw new Error('Failed to update attendance');
      } else {
        // Create new record
        const res = await fetch('/api/attendance', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(payload) 
        });
        if (!res.ok) throw new Error('Failed to create attendance');
      }
      
      // Refresh attendance data immediately
      const attRes = await fetch(`/api/attendance?date=${today}`, { cache: 'no-store' });
      const att = await attRes.json().catch(() => []);
      setAttendanceToday(Array.isArray(att) ? att : []);
      
      // Also refresh timesheets
      await refreshTimesheets();
    } catch (error) {
      console.error('Failed to record attendance:', error);
      alert(`Failed to record attendance: ${error.message}`);
    }
  }

  function openViewDetails(row) {
    const existing = (attendanceToday || []).find(a => a.employee_id === row.employee_id);
    setViewData({
      name: row.name,
      department: row.department,
      position: row.position,
      date: existing?.date || isoToday(),
      time_in: formatTime(existing?.time_in),
      time_out: formatTime(existing?.time_out),
      hours: Number(existing?.hours_worked || 0)
    });
    setViewModalOpen(true);
  }

  async function saveLeave(e) {
    e?.preventDefault?.();
    try {
      const response = await fetch('/api/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leaveForm) });
      if (!response.ok) {
        const error = await response.json();
        console.error('Leave creation failed:', error);
        alert('Failed to create leave request: ' + (error.error || 'Unknown error'));
        return;
      }
      setLeaveModalOpen(false);
      const res = await fetch('/api/leave', { cache: 'no-store' });
      const leaves = await res.json().catch(() => []);
      setRecentLeaves(Array.isArray(leaves) ? leaves.slice(0, 6) : []);
    } catch (err) {
      console.error('Leave creation error:', err);
      alert('Failed to create leave request: ' + err.message);
    }
  }
  async function deleteLeave(id) {
    if (!id) return;
    await fetch(`/api/leave?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const res = await fetch('/api/leave', { cache: 'no-store' });
    const leaves = await res.json().catch(() => []);
    setRecentLeaves(Array.isArray(leaves) ? leaves.slice(0, 6) : []);
  }

  async function refreshTimesheets() {
    let start, end;
    const today = new Date();
    if (timesheetRange === 'Current Week') {
      const r = weekRange(today); start = r.start; end = r.end;
    } else if (timesheetRange === 'Previous Week') {
      const r = weekRange(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)); start = r.start; end = r.end;
    } else {
      // Current Month
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      start = first.toISOString().slice(0,10);
      end = last.toISOString().slice(0,10);
    }
    const tsRes = await fetch(`/api/timesheets?start_date=${start}&end_date=${end}`, { cache: 'no-store' });
    const ts = await tsRes.json().catch(() => []);
    setTimesheetAgg(Array.isArray(ts) ? ts : []);
  }

  async function exportAttendanceCsv() {
    const start = isoToday();
    const end = isoToday();
    const res = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'attendance', start_date: start, end_date: end }) });
    const { rows = [] } = await res.json().catch(() => ({ rows: [] }));
    const csv = [Object.keys(rows[0] || { Date:'',Employee:'',Department:'', 'Time In':'','Time Out':'','Hours Worked':'' }).join(','), ...rows.map(r => Object.values(r).map(v => (String(v).includes(',')?`"${String(v).replace(/"/g,'""')}"`:String(v))).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance-${start}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  async function updateLeaveStatus(id, status) {
    if (!id) return;
    await fetch('/api/leave', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, updates: { status } }) });
    const res = await fetch('/api/leave', { cache: 'no-store' });
    const leaves = await res.json().catch(() => []);
    setRecentLeaves(Array.isArray(leaves) ? leaves.slice(0, 6) : []);
  }

  const attendanceStats = useMemo(() => {
    const total = employees.length || 0;
    // Present is any employee with a time_in today
    const present = (attendanceToday || []).filter(a => a.time_in).length;
    const onLeave = (recentLeaves || []).filter(l => {
      const today = isoToday();
      return (!l.status || l.status !== 'Rejected') && l.start_date <= today && l.end_date >= today;
    }).length;
    const absent = Math.max(0, total - present - onLeave);
    const avgHours = (attendanceToday || []).length
      ? +((attendanceToday.reduce((s, r) => s + Number(r.hours_worked || 0), 0) / attendanceToday.length) || 0).toFixed(2)
      : 0;
    return { totalEmployees: total, present, absent, late: 0, onLeave, averageHours: avgHours };
  }, [employees, attendanceToday, recentLeaves]);

  // Leave limitations per type
  const leaveLimitations = {
    'Vacation': 6,
    'Sick Leave': 4,
    'Personal Leave': 2,
    'Emergency Leave': 2
  };

  const leaveRequests = useMemo(() => {
    const empById = new Map((employees || []).map(e => [e.id, e]));
    const empByEmployeeId = new Map((employees || []).map(e => [e.employee_id, e]));
    
    return (recentLeaves || []).map(r => {
      // Try both id and employee_id to find the employee
      const emp = empById.get(r.employee_id) || empByEmployeeId.get(r.employee_id);
      const days = r.start_date && r.end_date ? (Math.max(0, (new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1) : undefined;
      const limit = leaveLimitations[r.leave_type] || 0;
      const isOverLimit = days !== undefined && limit > 0 && days > limit;
      
      return {
        id: r.id,
        employee: emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : 'Unknown Employee',
        type: r.leave_type,
        startDate: r.start_date,
        endDate: r.end_date,
        days,
        limit,
        isOverLimit,
        status: r.status || 'Pending',
        avatar: '☕'
      };
    });
  }, [recentLeaves, employees]);

  const attendanceRows = useMemo(() => {
    const byEmp = new Map((attendanceToday || []).map(r => [String(r.employee_id), r]));
    return (employees || []).map(emp => {
      const a = byEmp.get(String(emp.id));
      return {
        id: a?.id || emp.id,
        employee_id: emp.id,
        name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        position: emp.job_title || '',
        department: emp.department || '',
        checkIn: formatTime(a?.time_in),
        checkOut: formatTime(a?.time_out),
        hours: Number(a?.hours_worked || 0),
        status: a?.time_in ? 'Present' : 'Absent',
        avatar: '☕'
      };
    });
  }, [employees, attendanceToday]);

  // Pagination logic
  const paginatedAttendance = useMemo(() => {
    const start = (currentPage.attendance - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return attendanceRows.slice(start, end);
  }, [attendanceRows, currentPage.attendance]);

  const paginatedTimesheets = useMemo(() => {
    const start = (currentPage.timesheets - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return timesheetAgg.slice(start, end);
  }, [timesheetAgg, currentPage.timesheets]);

  const paginatedLeaves = useMemo(() => {
    const start = (currentPage.leave - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return leaveRequests.slice(start, end);
  }, [leaveRequests, currentPage.leave]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-800 to-green-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">☕</span>
              </div>
              <h1 className="text-xl font-bold text-black">Partner Time, Attendance & Leave</h1>
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
              <Link href="/time-attendance" className="text-black hover:text-gray-600 font-medium text-black">
                Time & Attendance
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-4xl mr-4">
              ⏰
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Partner Time, Attendance & Leave Management</h2>
              <p className="text-green-100 text-lg">Monitor partner attendance, working hours, and leave balances for accurate payroll and compliance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Partners</p>
                <p className="text-2xl font-bold text-black">{attendanceStats.totalEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">☕</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Present</p>
                <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Absent</p>
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Late</p>
                <p className="text-2xl font-bold text-orange-600">{attendanceStats.late}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">On Leave</p>
                <p className="text-2xl font-bold text-purple-600">{attendanceStats.onLeave}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏖️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Avg Hours</p>
                <p className="text-2xl font-bold text-black">{attendanceStats.averageHours}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg">
          {/* Tabs */}
          <div className="border-b border-green-200">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => (
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
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-black">Today's Attendance</h3>
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {attendanceRows.length} {attendanceRows.length === 1 ? 'Employee' : 'Employees'}
                      </span>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-50">
                      {attendanceRows.map((employee) => (
                        <div key={employee.id} className="border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-xl">
                                {employee.avatar}
                              </div>
                              <div>
                                <h4 className="font-semibold text-black">{employee.name}</h4>
                                <p className="text-sm text-gray-700">{employee.position}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              employee.status === 'Present' ? 'bg-green-100 text-green-800' :
                              employee.status === 'Late' ? 'bg-orange-100 text-orange-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {employee.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-gray-600">Check In:</span>
                              <span className="font-medium ml-1 text-black">{employee.checkIn}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Check Out:</span>
                              <span className="font-medium ml-1 text-black">{employee.checkOut}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Hours:</span>
                              <span className="font-medium ml-1 text-black">{employee.hours}h</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            {!employee.checkIn || employee.checkIn === '--:--' ? (
                              <button 
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors w-full" 
                                onClick={() => recordRealTimeAttendance(employee.employee_id, 'in')}
                              >
                                ⏰ Time In Now
                              </button>
                            ) : !employee.checkOut || employee.checkOut === '--:--' ? (
                              <button 
                                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors w-full" 
                                onClick={() => recordRealTimeAttendance(employee.employee_id, 'out')}
                              >
                                ⏰ Time Out Now
                              </button>
                            ) : (
                              <div className="text-center text-sm text-green-700 font-medium py-2">
                                ✓ Attendance Complete
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {attendanceRows.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No attendance records for today</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-green-900 mb-4">Recent Leave Requests</h3>
                    <div className="space-y-4">
                      {leaveRequests.map((request) => (
                        <div key={request.id} className="border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-xl">
                                {request.avatar}
                              </div>
                              <div>
                                <h4 className="font-semibold text-green-900">{request.employee}</h4>
                                <p className="text-sm text-green-800">{request.type}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              request.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <div className="text-sm text-green-800">
                            <p>{request.startDate} - {request.endDate} ({request.days} days)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-green-900">Attendance Tracking</h3>
                  <div className="flex space-x-3">
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-green-300 rounded-lg px-3 py-2 text-black"
                    />
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" onClick={exportAttendanceCsv}>
                      Export Report
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-green-200">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Partner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Check In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Check Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Hours Worked</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-green-200">
                      {paginatedAttendance.map((employee) => (
                        <tr key={employee.id} className="hover:bg-green-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-xl mr-3">
                                {employee.avatar}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-green-900">{employee.name}</div>
                                <div className="text-sm text-green-700">{employee.position}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">
                            {employee.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">
                            {employee.checkIn}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">
                            {employee.checkOut}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">
                            {employee.hours}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              employee.status === 'Present' 
                                ? 'bg-green-100 text-green-800' 
                                : employee.status === 'Late'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {employee.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-green-600 hover:text-green-900 mr-3" onClick={() => openViewDetails(employee)}>View Details</button>
                            <button className="text-blue-600 hover:text-blue-900 mr-3" onClick={() => openAttendanceEdit(employee)}>{employee.status === 'Absent' ? 'Add' : 'Edit'}</button>
                            {(() => {
                              // Show Time In button if no time_in, or Time Out button if time_in exists but no time_out
                              if (!employee.checkIn || employee.checkIn === '--:--') {
                                return (
                                  <button 
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors" 
                                    onClick={() => recordRealTimeAttendance(employee.employee_id, 'in')}
                                  >
                                    ⏰ Time In
                                  </button>
                                );
                              } else if (!employee.checkOut || employee.checkOut === '--:--') {
                                return (
                                  <button 
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors" 
                                    onClick={() => recordRealTimeAttendance(employee.employee_id, 'out')}
                                  >
                                    ⏰ Time Out
                                  </button>
                                );
                              }
                              return null;
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage.attendance - 1) * itemsPerPage) + 1} to {Math.min(currentPage.attendance * itemsPerPage, attendanceRows.length)} of {attendanceRows.length} employees
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setCurrentPage(prev => ({ ...prev, attendance: Math.max(1, prev.attendance - 1) }))}
                      disabled={currentPage.attendance === 1}
                      className="px-3 py-1 border border-green-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage.attendance} of {Math.ceil(attendanceRows.length / itemsPerPage)}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => ({ ...prev, attendance: Math.min(Math.ceil(attendanceRows.length / itemsPerPage), prev.attendance + 1) }))}
                      disabled={currentPage.attendance >= Math.ceil(attendanceRows.length / itemsPerPage)}
                      className="px-3 py-1 border border-green-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timesheets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-green-900">Timesheet Management</h3>
                  <div className="flex space-x-3">
                    <select className="border border-green-300 rounded-lg px-3 py-2 text-black" value={timesheetRange} onChange={(e) => { setTimesheetRange(e.target.value); setTimeout(refreshTimesheets, 0); }}>
                      <option>Current Week</option>
                      <option>Previous Week</option>
                      <option>Current Month</option>
                    </select>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" onClick={refreshTimesheets}>
                      Approve All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-green-900 mb-4">Weekly Timesheet Summary</h4>
                    <div className="bg-white border border-green-200 rounded-lg p-6">
                      <div className="space-y-4">
                        {paginatedTimesheets.map((row, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-green-100 last:border-b-0">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-green-900">{row.employee?.first_name || ''} {row.employee?.last_name || ''}</span>
                              <span className="text-green-800">{row.total_hours}h</span>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              (row.avg_hours ?? 0) >= 8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              Avg {row.avg_hours}h/day
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-900">Total Hours:</span>
                          <span className="font-bold text-green-600">39h</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-green-900 mb-4">Overtime Tracking</h4>
                    <div className="space-y-4">
                      {paginatedTimesheets.map((emp, index) => (
                        <div key={index} className="bg-white border border-green-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-green-900">{emp.employee?.first_name || ''} {emp.employee?.last_name || ''}</h5>
                            <span className="text-sm font-medium text-orange-600">{Math.max(0, (emp.total_hours || 0) - 40)}h OT</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-800">Regular Hours:</span>
                              <span className="text-green-900">{Math.min(40, emp.total_hours || 0)}h</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-800">Overtime:</span>
                              <span className="text-orange-600">{Math.max(0, (emp.total_hours || 0) - 40)}h</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium border-t pt-2">
                              <span className="text-green-900">Total:</span>
                              <span className="text-green-900">{emp.total_hours || 0}h</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Pagination Controls for Timesheets */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage.timesheets - 1) * itemsPerPage) + 1} to {Math.min(currentPage.timesheets * itemsPerPage, timesheetAgg.length)} of {timesheetAgg.length} employees
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setCurrentPage(prev => ({ ...prev, timesheets: Math.max(1, prev.timesheets - 1) }))}
                      disabled={currentPage.timesheets === 1}
                      className="px-3 py-1 border border-green-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage.timesheets} of {Math.ceil(timesheetAgg.length / itemsPerPage)}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => ({ ...prev, timesheets: Math.min(Math.ceil(timesheetAgg.length / itemsPerPage), prev.timesheets + 1) }))}
                      disabled={currentPage.timesheets >= Math.ceil(timesheetAgg.length / itemsPerPage)}
                      className="px-3 py-1 border border-green-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leave' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-green-900">Leave Management</h3>
                  <div className="flex space-x-3">
                    <select className="border border-green-300 rounded-lg px-3 py-2 text-black" value={leaveFilter} onChange={(e) => setLeaveFilter(e.target.value)}>
                      <option>All Types</option>
                      <option>Sick Leave</option>
                      <option>Vacation</option>
                      <option>Personal Leave</option>
                      <option>Emergency Leave</option>
                    </select>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" onClick={() => { const firstEmp = employees?.[0]; setLeaveForm({ employee_id: firstEmp?.id || '', leave_type: 'Vacation', start_date: isoToday(), end_date: isoToday(), status: 'Pending' }); setLeaveModalOpen(true); }}>
                      + Request Leave
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-green-900 mb-4">Leave Requests</h4>
                    <div className="space-y-4">
                      {paginatedLeaves.filter(r => leaveFilter === 'All Types' ? true : r.type === leaveFilter).map((request) => (
                        <div key={request.id} className="bg-white border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-xl">
                                {request.avatar}
                              </div>
                              <div>
                                <h5 className="font-medium text-green-900">{request.employee}</h5>
                                <p className="text-sm text-green-800">{request.type}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              request.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium text-green-900">Duration:</span> <span className="text-green-800">{request.startDate} - {request.endDate} ({request.days} days)</span></p>
                            {request.limit > 0 && (
                              <p className={request.isOverLimit ? 'text-red-600 font-medium' : 'text-green-700'}>
                                Limit: {request.days || 0}/{request.limit} days {request.isOverLimit ? '(Exceeded!)' : ''}
                              </p>
                            )}
                          </div>
                          {request.status === 'Pending' && (
                            <div className="mt-3 flex space-x-2">
                              <button 
                                className={`px-3 py-1 rounded text-sm ${request.isOverLimit ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`} 
                                onClick={async () => {
                                  if (request.isOverLimit) {
                                    const confirmed = window.confirm(`This leave request exceeds the limit of ${request.limit} days. Do you want to approve anyway?`);
                                    if (!confirmed) return;
                                  }
                                  await updateLeaveStatus(request.id, 'Approved');
                                }}
                              >
                                {request.isOverLimit ? '⚠️ Approve (Over Limit)' : 'Approve'}
                              </button>
                              <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700" onClick={() => updateLeaveStatus(request.id, 'Rejected')}>
                                Reject
                              </button>
                            </div>
                          )}
                          <div className="mt-2">
                            <button className="text-red-700 hover:text-red-900 text-sm" onClick={() => deleteLeave(request.id)}>Delete Request</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-green-900 mb-4">Leave Balance</h4>
                    <div className="bg-white border border-green-200 rounded-lg p-6">
                      <div className="space-y-4">
                        {[
                          { type: 'Vacation', used: 0, total: leaveLimitations['Vacation'] || 6, remaining: leaveLimitations['Vacation'] || 6 },
                          { type: 'Sick Leave', used: 0, total: leaveLimitations['Sick Leave'] || 4, remaining: leaveLimitations['Sick Leave'] || 4 },
                          { type: 'Personal Leave', used: 0, total: leaveLimitations['Personal Leave'] || 2, remaining: leaveLimitations['Personal Leave'] || 2 },
                          { type: 'Emergency Leave', used: 0, total: leaveLimitations['Emergency Leave'] || 2, remaining: leaveLimitations['Emergency Leave'] || 2 }
                        ].map((leave, index) => {
                          // Calculate actual used days from approved leaves
                          const usedDays = leaveRequests
                            .filter(l => l.type === leave.type && l.status === 'Approved')
                            .reduce((sum, l) => sum + (l.days || 0), 0);
                          const remaining = Math.max(0, leave.total - usedDays);
                          return (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-green-900">{leave.type}</span>
                              <span className="text-sm text-green-800">{leave.used}/{leave.total} days</span>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${(usedDays / leave.total) * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700">Used: {usedDays} days</span>
                              <span className="text-green-600 font-medium">Remaining: {remaining} days</span>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Pagination Controls for Leave */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage.leave - 1) * itemsPerPage) + 1} to {Math.min(currentPage.leave * itemsPerPage, leaveRequests.length)} of {leaveRequests.length} leave requests
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setCurrentPage(prev => ({ ...prev, leave: Math.max(1, prev.leave - 1) }))}
                      disabled={currentPage.leave === 1}
                      className="px-3 py-1 border border-green-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage.leave} of {Math.ceil(leaveRequests.length / itemsPerPage)}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => ({ ...prev, leave: Math.min(Math.ceil(leaveRequests.length / itemsPerPage), prev.leave + 1) }))}
                      disabled={currentPage.leave >= Math.ceil(leaveRequests.length / itemsPerPage)}
                      className="px-3 py-1 border border-green-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-green-900">Attendance Reports</h3>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Generate Custom Report
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: 'Monthly Attendance Summary', description: 'Complete attendance overview for the selected month', icon: '📊' },
                    { title: 'Late Arrival Report', description: 'Detailed report of partners with frequent late arrivals', icon: '⏰' },
                    { title: 'Overtime Analysis', description: 'Overtime hours and costs analysis across departments', icon: '💰' },
                    { title: 'Leave Utilization Report', description: 'Leave usage patterns and trends analysis', icon: '📈' },
                    { title: 'Attendance Compliance', description: 'Compliance status and policy adherence report', icon: '✅' },
                    { title: 'Partner Productivity', description: 'Working hours and productivity correlation analysis', icon: '🚀' }
                  ].map((report, index) => (
                    <div key={index} className="bg-white border border-green-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                          <span className="text-2xl">{report.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-900">{report.title}</h4>
                        </div>
                      </div>
                      <p className="text-green-800 text-sm mb-4">{report.description}</p>
                      <div className="flex space-x-2">
                        <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                          Generate
                        </button>
                        <button className="border border-green-300 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-50">
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Edit Modal */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAttendanceModalOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-black">Edit Attendance</h3>
              <button onClick={() => setAttendanceModalOpen(false)} className="text-slate-600 hover:text-slate-900">✖</button>
            </div>
            <form onSubmit={saveAttendance} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Date</label>
                <input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Time In</label>
                <input type="time" value={attendanceForm.time_in || ''} onChange={(e) => setAttendanceForm({ ...attendanceForm, time_in: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Time Out</label>
                <input type="time" value={attendanceForm.time_out || ''} onChange={(e) => setAttendanceForm({ ...attendanceForm, time_out: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Hours Worked</label>
                <input type="number" step="0.01" value={attendanceForm.hours_worked || ''} onChange={(e) => setAttendanceForm({ ...attendanceForm, hours_worked: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" />
              </div>
              <div className="flex justify-between pt-2">
                {attendanceForm.id ? (
                  <button type="button" onClick={deleteAttendance} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
                ) : <span></span>}
                <div className="space-x-2">
                  <button type="button" onClick={() => setAttendanceModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800">Save</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setLeaveModalOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-black">Request Leave</h3>
              <button onClick={() => setLeaveModalOpen(false)} className="text-slate-600 hover:text-slate-900">✖</button>
            </div>
            <form onSubmit={saveLeave} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Employee</label>
                <select value={leaveForm.employee_id} onChange={(e) => setLeaveForm({ ...leaveForm, employee_id: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black">
                  {(employees || []).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Type</label>
                <select value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black">
                  <option value="Vacation">Vacation</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Personal Leave">Personal Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Start Date</label>
                  <input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">End Date</label>
                  <input type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" />
                </div>
              </div>
              <div className="flex justify-end pt-2 space-x-2">
                <button type="button" onClick={() => setLeaveModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewModalOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-black">Attendance Details</h3>
              <button onClick={() => setViewModalOpen(false)} className="text-slate-600 hover:text-slate-900">✖</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Name</span><span className="text-black font-medium">{viewData?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Department</span><span className="text-black font-medium">{viewData?.department}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Position</span><span className="text-black font-medium">{viewData?.position}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Date</span><span className="text-black font-medium">{viewData?.date}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Time In</span><span className="text-black font-medium">{viewData?.time_in}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Time Out</span><span className="text-black font-medium">{viewData?.time_out}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Hours</span><span className="text-black font-medium">{viewData?.hours}h</span></div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50" onClick={() => setViewModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}