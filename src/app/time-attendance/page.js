'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SidebarInset } from '@humanresource/components/ui/sidebar';
import { authFetch } from '../../lib/api-client';
import { useAuth } from '../../components/AuthProvider';

// Leave limitations per type
const leaveLimitations = {
  'Vacation': 6,
  'Sick Leave': 4,
  'Personal Leave': 2,
  'Emergency Leave': 2
};

export default function TimeAttendance() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]); // For calendar view
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({ id: null, employee_id: '', date: '', time_in: '', time_out: '', hours_worked: '' });
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ employee_id: '', leave_type: 'Vacation', start_date: '', end_date: '', status: 'Pending' });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [leaveFilter, setLeaveFilter] = useState('All Types');
  const [selectedDate, setSelectedDate] = useState(isoToday());
  const [currentPage, setCurrentPage] = useState({ attendance: 1, leave: 1 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const itemsPerPage = 10;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'attendance', label: 'Attendance', icon: '⏰' },
    { id: 'leave', label: 'Leave Management', icon: '🏖️' }
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

  // Format hours and minutes from decimal hours (e.g., 8.5 -> "8h 30m")
  function formatHoursMinutes(decimalHours) {
    if (!decimalHours || decimalHours === 0) return '0h 0m';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    if (minutes === 0) return `${hours}h`;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }

  // Calculate hours and minutes from time_in and time_out
  function calculateHoursMinutes(timeIn, timeOut) {
    if (!timeIn || !timeOut) return { hours: 0, minutes: 0, totalMinutes: 0 };
    try {
      const [inHour, inMin] = timeIn.split(':').map(Number);
      const [outHour, outMin] = timeOut.split(':').map(Number);
      const inMinutes = inHour * 60 + inMin;
      const outMinutes = outHour * 60 + outMin;
      const totalMinutes = Math.max(0, outMinutes - inMinutes);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return { hours, minutes, totalMinutes };
    } catch (_e) {
      return { hours: 0, minutes: 0, totalMinutes: 0 };
    }
  }

  function isoToday() {
    return new Date().toISOString().slice(0,10);
  }


  useEffect(() => {
    async function loadAll() {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const startDate = firstDay.toISOString().slice(0, 10);
      const endDate = lastDay.toISOString().slice(0, 10);
      
      const [empRes, attRes, attMonthRes, leaveRes] = await Promise.all([
        authFetch('/api/employees', { cache: 'no-store' }),
        authFetch(`/api/attendance?date=${selectedDate}`, { cache: 'no-store' }),
        authFetch(`/api/attendance?start_date=${startDate}&end_date=${endDate}`, { cache: 'no-store' }),
        authFetch('/api/leave', { cache: 'no-store' })
      ]);
      const [emp, att, attMonth, leaves] = await Promise.all([
        empRes.json().catch(() => []),
        attRes.json().catch(() => []),
        attMonthRes.json().catch(() => []),
        leaveRes.json().catch(() => [])
      ]);
      
      setEmployees(Array.isArray(emp) ? emp : []);
      setAttendanceToday(Array.isArray(att) ? att : []);
      setAllAttendance(Array.isArray(attMonth) ? attMonth : []);
      setAllLeaves(Array.isArray(leaves) ? leaves : []);
      setRecentLeaves(Array.isArray(leaves) ? leaves.slice(0, 6) : []);
    }
    loadAll();
  }, [selectedDate]);

  // Update current time every minute for real-time avg hours calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Ensure UI reflects new attendance rows added to DB by reloading when modal closes
  useEffect(() => {
    if (!attendanceModalOpen) {
      (async () => {
        const attRes = await authFetch(`/api/attendance?date=${selectedDate}`, { cache: 'no-store' });
        const att = await attRes.json().catch(() => []);
        setAttendanceToday(Array.isArray(att) ? att : []);
      })();
    }
  }, [attendanceModalOpen, selectedDate]);

  async function saveAttendance(e) {
    e?.preventDefault?.();
    let hoursWorked = attendanceForm.hours_worked;
    
    // Calculate hours_worked from time_in and time_out if both are provided
    if (attendanceForm.time_in && attendanceForm.time_out && (!hoursWorked || hoursWorked === '0' || hoursWorked === '')) {
      const { totalMinutes } = calculateHoursMinutes(attendanceForm.time_in, attendanceForm.time_out);
      hoursWorked = (totalMinutes / 60).toFixed(2);
    }
    
    const payload = { 
      employee_id: attendanceForm.employee_id, 
      date: attendanceForm.date, 
      time_in: attendanceForm.time_in || null, 
      time_out: attendanceForm.time_out || null, 
      hours_worked: hoursWorked ? parseFloat(hoursWorked) : null 
    };
    
    if (attendanceForm.id) {
      await authFetch('/api/attendance', { method: 'PUT', body: JSON.stringify({ id: attendanceForm.id, updates: payload }) });
    } else {
      await authFetch('/api/attendance', { method: 'POST', body: JSON.stringify(payload) });
    }
    setAttendanceModalOpen(false);
    // refresh today attendance
    const attRes = await authFetch(`/api/attendance?date=${encodeURIComponent(attendanceForm.date || isoToday())}`, { cache: 'no-store' });
    const att = await attRes.json().catch(() => []);
    setAttendanceToday(Array.isArray(att) ? att : []);
  }

  async function deleteAttendance() {
    if (!attendanceForm.id) return;
    await authFetch(`/api/attendance?id=${encodeURIComponent(attendanceForm.id)}`, { method: 'DELETE' });
    setAttendanceModalOpen(false);
    const attRes = await authFetch(`/api/attendance?date=${isoToday()}`, { cache: 'no-store' });
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
        const { totalMinutes } = calculateHoursMinutes(currentTime, existing.time_out);
        payload.hours_worked = (totalMinutes / 60).toFixed(2);
      }
    } else if (type === 'out') {
      payload.time_out = currentTime;
      // Preserve existing time_in
      if (existing?.time_in) {
        payload.time_in = existing.time_in;
        // Calculate hours worked
        const { totalMinutes } = calculateHoursMinutes(existing.time_in, currentTime);
        payload.hours_worked = (totalMinutes / 60).toFixed(2);
      } else {
        // If no time_in exists, we still need to set time_out but can't calculate hours
        payload.hours_worked = null;
      }
    }

    try {
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
        if (!res.ok) throw new Error('Failed to create attendance');
      }
      
      // Refresh attendance data immediately
      const attRes = await authFetch(`/api/attendance?date=${today}`, { cache: 'no-store' });
      const att = await attRes.json().catch(() => []);
      setAttendanceToday(Array.isArray(att) ? att : []);
      
    } catch (error) {
      console.error('Failed to record attendance:', error);
      alert(`Failed to record attendance: ${error.message}`);
    }
  }

  function openViewDetails(row) {
    const existing = (attendanceToday || []).find(a => a.employee_id === row.employee_id);
    const hoursWorked = Number(existing?.hours_worked || 0);
    const { hours, minutes } = existing?.time_in && existing?.time_out 
      ? calculateHoursMinutes(existing.time_in, existing.time_out)
      : { hours: Math.floor(hoursWorked), minutes: Math.round((hoursWorked - Math.floor(hoursWorked)) * 60) };
    setViewData({
      name: row.name,
      department: row.department,
      position: row.position,
      date: existing?.date || isoToday(),
      time_in: formatTime(existing?.time_in),
      time_out: formatTime(existing?.time_out),
      hours: hoursWorked,
      hoursDisplay: formatHoursMinutes(hoursWorked),
      hoursRaw: hours,
      minutesRaw: minutes
    });
    setViewModalOpen(true);
  }

  async function saveLeave(e) {
    e?.preventDefault?.();
    try {
      // Validate date duration
      if (leaveForm.start_date && leaveForm.end_date) {
        const startDate = new Date(leaveForm.start_date);
        const endDate = new Date(leaveForm.end_date);
        const days = Math.max(0, Math.floor((endDate - startDate) / 86400000) + 1);
        const limit = leaveLimitations[leaveForm.leave_type] || 0;
        
        if (limit > 0 && days > limit) {
          const confirmed = window.confirm(
            `⚠️ Warning: This leave request (${days} days) exceeds the limit for ${leaveForm.leave_type} (${limit} days).\n\n` +
            `The request will be automatically rejected. Do you want to proceed?`
          );
          if (!confirmed) return;
        }
      }
      
      const response = await fetch('/api/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leaveForm) });
      if (!response.ok) {
        const error = await response.json();
        console.error('Leave creation failed:', error);
        alert('Failed to create leave request: ' + (error.error || 'Unknown error'));
        return;
      }
      
      // API now handles auto-rejection, so we just refresh
      const leaveData = await response.json();
      setLeaveModalOpen(false);
      const res = await fetch('/api/leave', { cache: 'no-store' });
      const leaves = await res.json().catch(() => []);
      setAllLeaves(Array.isArray(leaves) ? leaves : []);
      setRecentLeaves(Array.isArray(leaves) ? leaves.slice(0, 6) : []);
      
      if (leaveData.status === 'Rejected') {
        const startDate = new Date(leaveForm.start_date);
        const endDate = new Date(leaveForm.end_date);
        const days = Math.max(0, Math.floor((endDate - startDate) / 86400000) + 1);
        const limit = leaveLimitations[leaveForm.leave_type] || 0;
        const rejectionReason = `Requested ${days} days exceeds the limit of ${limit} days for ${leaveForm.leave_type}`;
        alert(`⚠️ Leave request was automatically rejected.\n\nReason: ${rejectionReason}`);
      }
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
    setAllLeaves(Array.isArray(leaves) ? leaves : []);
    setRecentLeaves(Array.isArray(leaves) ? leaves.slice(0, 6) : []);
  }



  async function updateLeaveStatus(id, status) {
    if (!id) return;
    await authFetch('/api/leave', { method: 'PUT', body: JSON.stringify({ id, updates: { status } }) });
    const res = await authFetch('/api/leave', { cache: 'no-store' });
    const leaves = await res.json().catch(() => []);
    setAllLeaves(Array.isArray(leaves) ? leaves : []);
    setRecentLeaves(Array.isArray(leaves) ? leaves.slice(0, 6) : []);
  }

  const attendanceStats = useMemo(() => {
    const total = employees.length || 0;
    const today = isoToday();
    const currentTimeStr = currentTime.toTimeString().slice(0, 5); // HH:MM format
    
    // Get all employees on leave today (approved leave requests)
    const employeesOnLeave = new Set();
    (allLeaves || []).forEach(l => {
      if (l.status === 'Approved' && l.start_date <= today && l.end_date >= today) {
        employeesOnLeave.add(String(l.employee_id));
      }
    });
    
    // Create a map of attendance by employee_id
    const attendanceByEmp = new Map();
    (attendanceToday || []).forEach(a => {
      attendanceByEmp.set(String(a.employee_id), a);
    });
    
    // Calculate present (both time_in AND time_out), late, and hours
    let present = 0;
    let late = 0;
    const hoursArray = [];
    
    employees.forEach(emp => {
      const empId = String(emp.id);
      // Skip if on leave
      if (employeesOnLeave.has(empId)) return;
      
      const att = attendanceByEmp.get(empId);
      if (att?.time_in && att?.time_out) {
        // Has both time_in and time_out - present
        present++;
        
        // Check if late (time_in after 9:00 AM)
        const [inHour, inMin] = att.time_in.split(':').map(Number);
        if (inHour > 9 || (inHour === 9 && inMin > 0)) {
          late++;
        }
        
        // Add hours worked (convert to decimal for average calculation)
        const hours = Number(att.hours_worked || 0);
        if (hours > 0) hoursArray.push(hours);
      } else if (att?.time_in && !att?.time_out) {
        // Has time_in but no time_out - calculate real-time hours for avg calculation
        const [inHour, inMin] = att.time_in.split(':').map(Number);
        const [currHour, currMin] = currentTimeStr.split(':').map(Number);
        const inMinutes = inHour * 60 + inMin;
        const currMinutes = currHour * 60 + currMin;
        const realTimeHours = Math.max(0, (currMinutes - inMinutes) / 60);
        hoursArray.push(realTimeHours);
        // Note: This employee is still absent (doesn't have both time_in and time_out)
      }
    });
    
    // Calculate absent: employees not on leave who don't have both time_in and time_out
    let absent = 0;
    employees.forEach(emp => {
      const empId = String(emp.id);
      if (employeesOnLeave.has(empId)) return; // Skip if on leave
      
      const att = attendanceByEmp.get(empId);
      if (!att?.time_in || !att?.time_out) {
        // Doesn't have both time_in and time_out - absent
        absent++;
      }
    });
    
    // On leave count
    const onLeave = employeesOnLeave.size;
    
    // Calculate average hours (including real-time calculations for those with time_in but no time_out)
    const avgHours = hoursArray.length > 0
      ? +(hoursArray.reduce((s, h) => s + h, 0) / hoursArray.length).toFixed(2)
      : 0;
    
    return { totalEmployees: total, present, absent, late, onLeave, averageHours: avgHours };
  }, [employees, attendanceToday, allLeaves, currentTime]);

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
      const hoursWorked = Number(a?.hours_worked || 0);
      const { hours, minutes } = a?.time_in && a?.time_out 
        ? calculateHoursMinutes(a.time_in, a.time_out)
        : { hours: Math.floor(hoursWorked), minutes: Math.round((hoursWorked - Math.floor(hoursWorked)) * 60) };
      return {
        id: a?.id || emp.id,
        employee_id: emp.id,
        name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        position: emp.job_title || '',
        department: emp.department || '',
        checkIn: formatTime(a?.time_in),
        checkOut: formatTime(a?.time_out),
        hours: hoursWorked,
        hoursDisplay: formatHoursMinutes(hoursWorked),
        hoursRaw: hours,
        minutesRaw: minutes,
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


  const paginatedLeaves = useMemo(() => {
    const start = (currentPage.leave - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return leaveRequests.slice(start, end);
  }, [leaveRequests, currentPage.leave]);

  return (
    <SidebarInset className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50">
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
                <p className="text-2xl font-bold text-black">{formatHoursMinutes(attendanceStats.averageHours)}</p>
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
                      <h3 className="text-xl font-bold text-black">Today&apos;s Attendance</h3>
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
                              <span className="font-medium ml-1 text-black">{employee.hoursDisplay || formatHoursMinutes(employee.hours)}</span>
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
                              request.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                              request.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <div className="text-sm text-green-800">
                            <p>{request.startDate} - {request.endDate} ({request.days} days)</p>
                            {request.status === 'Rejected' && request.isOverLimit && (() => {
                              const rejectionReason = `Requested ${request.days} days exceeds the limit of ${request.limit} days for ${request.type}`;
                              return (
                                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                                  <span className="font-medium">Rejection Reason:</span> {rejectionReason}
                                </div>
                              );
                            })()}
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
                  </div>
                </div>

                {/* Attendance Calendar View */}
                <div className="bg-white border border-green-200 rounded-lg p-6">
                  <h4 className="font-semibold text-green-900 mb-4">Attendance Calendar</h4>
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-green-700 mb-2">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {(() => {
                      const today = new Date();
                      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                      const startDate = new Date(firstDay);
                      startDate.setDate(startDate.getDate() - startDate.getDay());
                      const days = [];
                      for (let i = 0; i < 42; i++) {
                        const date = new Date(startDate);
                        date.setDate(startDate.getDate() + i);
                        const dateStr = date.toISOString().slice(0, 10);
                        const dayAttendance = allAttendance.filter(att => att.date === dateStr);
                        const isCurrentMonth = date.getMonth() === today.getMonth();
                        const isToday = dateStr === today.toISOString().slice(0, 10);
                        const hasAttendance = dayAttendance.length > 0;
                        days.push(
                          <div 
                            key={i} 
                            className={`p-2 text-xs border rounded cursor-pointer hover:bg-green-50 ${
                              !isCurrentMonth ? 'text-slate-300 border-slate-200' : 
                              isToday ? 'bg-green-100 border-green-400 font-semibold' : 
                              hasAttendance ? 'bg-green-50 border-green-300' :
                              'border-green-200'
                            }`}
                            onClick={() => setSelectedDate(dateStr)}
                            title={hasAttendance ? `${dayAttendance.length} attendance record(s)` : 'No attendance'}
                          >
                            <div>{date.getDate()}</div>
                            {hasAttendance && (
                              <div className="mt-1 text-xs text-green-700 font-medium">
                                {dayAttendance.length} record{dayAttendance.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return days;
                    })()}
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
                            {employee.hoursDisplay || formatHoursMinutes(employee.hours)}
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
                      {paginatedLeaves.filter(r => leaveFilter === 'All Types' ? true : r.type === leaveFilter).map((request) => {
                        return (
                          <div key={request.id} className={`bg-white border rounded-lg p-4 ${
                            request.status === 'Rejected' ? 'border-red-300 bg-red-50' :
                            request.status === 'Approved' ? 'border-green-300 bg-green-50' :
                            'border-green-200'
                          }`}>
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
                                request.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                                request.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
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
                              {request.status === 'Rejected' && request.isOverLimit && (() => {
                                const rejectionReason = `Requested ${request.days} days exceeds the limit of ${request.limit} days for ${request.type}`;
                                return (
                                  <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                                    <span className="font-medium">Rejection Reason:</span> {rejectionReason}
                                  </div>
                                );
                              })()}
                            </div>
                            {request.status === 'Pending' && (
                              <div className="mt-3 flex space-x-2">
                                <button 
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm" 
                                  onClick={() => updateLeaveStatus(request.id, 'Approved')}
                                >
                                  Approve
                                </button>
                                <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700" onClick={() => updateLeaveStatus(request.id, 'Rejected')}>
                                  Reject
                                </button>
                              </div>
                            )}
                            {request.status === 'Rejected' && (
                              <div className="mt-3 text-xs text-red-700 font-medium">
                                ⚠️ Automatically rejected due to exceeding leave limit
                              </div>
                            )}
                            <div className="mt-2">
                              <button className="text-red-700 hover:text-red-900 text-sm" onClick={() => deleteLeave(request.id)}>Delete Request</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-green-900 mb-4">Leave Classifications</h4>
                    <div className="space-y-3">
                      {[
                        { type: 'Vacation', icon: '🏖️', color: 'blue', total: leaveLimitations['Vacation'] || 6 },
                        { type: 'Sick Leave', icon: '🏥', color: 'red', total: leaveLimitations['Sick Leave'] || 4 },
                        { type: 'Personal Leave', icon: '👤', color: 'purple', total: leaveLimitations['Personal Leave'] || 2 },
                        { type: 'Emergency Leave', icon: '🚨', color: 'orange', total: leaveLimitations['Emergency Leave'] || 2 }
                      ].map((leave, index) => {
                        const colorClasses = {
                          blue: { border: 'border-blue-200', text: 'text-blue-900', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
                          red: { border: 'border-red-200', text: 'text-red-900', iconBg: 'bg-red-100', iconText: 'text-red-600' },
                          purple: { border: 'border-purple-200', text: 'text-purple-900', iconBg: 'bg-purple-100', iconText: 'text-purple-600' },
                          orange: { border: 'border-orange-200', text: 'text-orange-900', iconBg: 'bg-orange-100', iconText: 'text-orange-600' }
                        };
                        
                        const colors = colorClasses[leave.color];
                        
                        return (
                          <div key={index} className={`bg-white border ${colors.border} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`w-14 h-14 ${colors.iconBg} rounded-xl flex items-center justify-center text-3xl`}>
                                  {leave.icon}
                                </div>
                                <div>
                                  <h5 className={`font-semibold ${colors.text} text-lg mb-1`}>{leave.type}</h5>
                                  <p className={`text-2xl font-bold ${colors.text}`}>{leave.total} Days</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
      {leaveModalOpen && (() => {
        const limit = leaveLimitations[leaveForm.leave_type] || 0;
        const days = leaveForm.start_date && leaveForm.end_date 
          ? Math.max(0, Math.floor((new Date(leaveForm.end_date) - new Date(leaveForm.start_date)) / 86400000) + 1)
          : 0;
        const isOverLimit = limit > 0 && days > limit;
        
        return (
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
                    <option value="Vacation">Vacation (Limit: {leaveLimitations['Vacation'] || 6} days)</option>
                    <option value="Sick Leave">Sick Leave (Limit: {leaveLimitations['Sick Leave'] || 4} days)</option>
                    <option value="Personal Leave">Personal Leave (Limit: {leaveLimitations['Personal Leave'] || 2} days)</option>
                    <option value="Emergency Leave">Emergency Leave (Limit: {leaveLimitations['Emergency Leave'] || 2} days)</option>
                  </select>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Leave Limit:</strong> {limit > 0 ? `${limit} days` : 'No limit'}
                  </p>
                  {leaveForm.start_date && leaveForm.end_date && (
                    <p className={`text-sm mt-1 ${isOverLimit ? 'text-red-600 font-semibold' : 'text-blue-700'}`}>
                      <strong>Requested Duration:</strong> {days} day{days !== 1 ? 's' : ''}
                      {isOverLimit && ' (Exceeds limit - will be auto-rejected)'}
                    </p>
                  )}
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
                  <button type="submit" className={`px-4 py-2 rounded-md text-white hover:opacity-90 ${isOverLimit ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'}`}>
                    {isOverLimit ? 'Submit (Will be Rejected)' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

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
              <div className="flex justify-between"><span className="text-slate-600">Hours</span><span className="text-black font-medium">{viewData?.hours ? formatHoursMinutes(viewData.hours) : '0h 0m'}</span></div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50" onClick={() => setViewModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </SidebarInset>
  );
}