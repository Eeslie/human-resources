'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TimeAttendance() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'attendance', label: 'Attendance', icon: '⏰' },
    { id: 'timesheets', label: 'Timesheets', icon: '📝' },
    { id: 'leave', label: 'Leave Management', icon: '🏖️' },
    { id: 'reports', label: 'Reports', icon: '📋' }
  ];

  const employees = [
    {
      id: 1,
      name: 'John Doe',
      position: 'Barista',
      department: 'Store Operations',
      status: 'Present',
      checkIn: '09:00 AM',
      checkOut: '--:--',
      hours: '8.0',
      avatar: '☕'
    },
    {
      id: 2,
      name: 'Jane Smith',
      position: 'Store Manager',
      department: 'Store Operations',
      status: 'Present',
      checkIn: '08:45 AM',
      checkOut: '--:--',
      hours: '7.75',
      avatar: '👩‍💼'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      position: 'Shift Supervisor',
      department: 'Store Operations',
      status: 'Late',
      checkIn: '09:30 AM',
      checkOut: '--:--',
      hours: '7.5',
      avatar: '👨‍💼'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      position: 'Partner',
      department: 'Store Operations',
      status: 'On Leave',
      checkIn: '--:--',
      checkOut: '--:--',
      hours: '0.0',
      avatar: '☕'
    }
  ];

  const attendanceStats = {
    totalEmployees: 156,
    present: 142,
    absent: 8,
    late: 6,
    onLeave: 12,
    averageHours: 7.8
  };

  const leaveRequests = [
    {
      id: 1,
      employee: 'Sarah Wilson',
      type: 'Sick Leave',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      days: 3,
      status: 'Approved',
      reason: 'Medical appointment',
      avatar: '☕'
    },
    {
      id: 2,
      employee: 'Alex Chen',
      type: 'Vacation',
      startDate: '2024-01-25',
      endDate: '2024-01-29',
      days: 5,
      status: 'Pending',
      reason: 'Family vacation',
      avatar: '☕'
    },
    {
      id: 3,
      employee: 'Maria Garcia',
      type: 'Personal Leave',
      startDate: '2024-01-23',
      endDate: '2024-01-23',
      days: 1,
      status: 'Approved',
      reason: 'Personal matter',
      avatar: '☕'
    }
  ];

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
                    <h3 className="text-xl font-bold text-black mb-4">Today's Attendance</h3>
                    <div className="space-y-4">
                      {employees.map((employee) => (
                        <div key={employee.id} className="border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                          <div className="grid grid-cols-3 gap-4 text-sm">
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
                        </div>
                      ))}
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
                            <p className="text-green-700">{request.reason}</p>
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
                    <select className="border border-green-300 rounded-lg px-3 py-2 text-black">
                      <option>Today</option>
                      <option>This Week</option>
                      <option>This Month</option>
                      <option>Custom Range</option>
                    </select>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
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
                      {employees.map((employee) => (
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
                            <button className="text-green-600 hover:text-green-900 mr-3">View Details</button>
                            <button className="text-blue-600 hover:text-blue-900">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'timesheets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-green-900">Timesheet Management</h3>
                  <div className="flex space-x-3">
                    <select className="border border-green-300 rounded-lg px-3 py-2 text-black">
                      <option>Current Week</option>
                      <option>Previous Week</option>
                      <option>Current Month</option>
                    </select>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      Approve All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-green-900 mb-4">Weekly Timesheet Summary</h4>
                    <div className="bg-white border border-green-200 rounded-lg p-6">
                      <div className="space-y-4">
                        {[
                          { day: 'Monday', hours: 8.0, status: 'Approved' },
                          { day: 'Tuesday', hours: 7.5, status: 'Approved' },
                          { day: 'Wednesday', hours: 8.5, status: 'Pending' },
                          { day: 'Thursday', hours: 8.0, status: 'Pending' },
                          { day: 'Friday', hours: 7.0, status: 'Pending' }
                        ].map((day, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-green-100 last:border-b-0">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-green-900">{day.day}</span>
                              <span className="text-green-800">{day.hours}h</span>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              day.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {day.status}
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
                      {[
                        { employee: 'John Doe', regular: 40, overtime: 8, total: 48 },
                        { employee: 'Jane Smith', regular: 40, overtime: 4, total: 44 },
                        { employee: 'Mike Johnson', regular: 40, overtime: 12, total: 52 }
                      ].map((emp, index) => (
                        <div key={index} className="bg-white border border-green-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-green-900">{emp.employee}</h5>
                            <span className="text-sm font-medium text-orange-600">{emp.overtime}h OT</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-800">Regular Hours:</span>
                              <span className="text-green-900">{emp.regular}h</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-800">Overtime:</span>
                              <span className="text-orange-600">{emp.overtime}h</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium border-t pt-2">
                              <span className="text-green-900">Total:</span>
                              <span className="text-green-900">{emp.total}h</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leave' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-green-900">Leave Management</h3>
                  <div className="flex space-x-3">
                    <select className="border border-green-300 rounded-lg px-3 py-2 text-black">
                      <option>All Types</option>
                      <option>Sick Leave</option>
                      <option>Vacation</option>
                      <option>Personal Leave</option>
                    </select>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      + Request Leave
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-green-900 mb-4">Leave Requests</h4>
                    <div className="space-y-4">
                      {leaveRequests.map((request) => (
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
                            <p><span className="font-medium text-green-900">Reason:</span> <span className="text-green-800">{request.reason}</span></p>
                          </div>
                          {request.status === 'Pending' && (
                            <div className="mt-3 flex space-x-2">
                              <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                Approve
                              </button>
                              <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-green-900 mb-4">Leave Balance</h4>
                    <div className="bg-white border border-green-200 rounded-lg p-6">
                      <div className="space-y-4">
                        {[
                          { type: 'Vacation', used: 12, total: 20, remaining: 8 },
                          { type: 'Sick Leave', used: 3, total: 10, remaining: 7 },
                          { type: 'Personal Leave', used: 2, total: 5, remaining: 3 },
                          { type: 'Emergency Leave', used: 0, total: 3, remaining: 3 }
                        ].map((leave, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-green-900">{leave.type}</span>
                              <span className="text-sm text-green-800">{leave.used}/{leave.total} days</span>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${(leave.used / leave.total) * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700">Used: {leave.used} days</span>
                              <span className="text-green-600 font-medium">Remaining: {leave.remaining} days</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
    </div>
  );
}
