'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Payroll() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'process', label: 'Process Payroll', icon: '⚡' },
    { id: 'history', label: 'Payroll History', icon: '📈' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const payrollData = [
    {
      id: 1,
      employee: 'John Doe',
      position: 'Software Engineer',
      basicSalary: 75000,
      overtime: 1500,
      bonuses: 2000,
      deductions: 1200,
      netPay: 77300,
      status: 'Processed',
      payPeriod: '2024-01',
      avatar: '👨‍💻'
    },
    {
      id: 2,
      employee: 'Jane Smith',
      position: 'HR Manager',
      basicSalary: 85000,
      overtime: 0,
      bonuses: 1500,
      deductions: 1500,
      netPay: 85000,
      status: 'Processed',
      payPeriod: '2024-01',
      avatar: '👩‍💼'
    },
    {
      id: 3,
      employee: 'Mike Johnson',
      position: 'Marketing Director',
      basicSalary: 95000,
      overtime: 500,
      bonuses: 3000,
      deductions: 1800,
      netPay: 96700,
      status: 'Pending',
      payPeriod: '2024-01',
      avatar: '👨‍💼'
    },
    {
      id: 4,
      employee: 'Sarah Wilson',
      position: 'Accountant',
      basicSalary: 65000,
      overtime: 800,
      bonuses: 1000,
      deductions: 1100,
      netPay: 65700,
      status: 'Processed',
      payPeriod: '2024-01',
      avatar: '👩‍💻'
    }
  ];

  const payrollStats = {
    totalEmployees: 156,
    totalPayroll: 1245000,
    averageSalary: 79807,
    processedThisMonth: 98,
    pendingApproval: 4
  };

  return (
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
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">Current Payroll Period: January 2024</h3>
                  <div className="flex space-x-3">
                    <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                      Process Payroll
                    </button>
                    <button className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50">
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
                      {payrollData.map((employee) => (
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
                              employee.status === 'Processed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {employee.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                            <button className="text-green-600 hover:text-green-900">Generate Payslip</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'process' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Payroll Processing Wizard</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold text-slate-800 mb-2">Step 1: Select Period</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Pay Period</label>
                          <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-black">
                            <option>January 2024</option>
                            <option>February 2024</option>
                            <option>March 2024</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Pay Date</label>
                          <input type="date" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-black" defaultValue="2024-01-31" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold text-slate-800 mb-2">Step 2: Review Data</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Employees:</span>
                          <span className="font-medium text-black">156</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Gross Pay:</span>
                          <span className="font-medium text-black">$1,245,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Deductions:</span>
                          <span className="font-medium text-black">$187,500</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-semibold text-slate-800">Net Pay:</span>
                          <span className="font-bold text-green-600 text-black">$1,057,500</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold text-slate-800 mb-2">Step 3: Process</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input type="checkbox" className="rounded border-slate-300 text-black" />
                          <label className="ml-2 text-sm text-slate-700">Generate payslips</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" className="rounded border-slate-300 text-black" />
                          <label className="ml-2 text-sm text-slate-700">Send notifications</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" className="rounded border-slate-300 text-black" />
                          <label className="ml-2 text-sm text-slate-700">Update bank transfers</label>
                        </div>
                        <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 mt-4">
                          Process Payroll
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">Payroll History</h3>
                  <div className="flex space-x-3">
                    <select className="border border-slate-300 rounded-lg px-3 py-2 text-black">
                      <option>All Periods</option>
                      <option>2024</option>
                      <option>2023</option>
                    </select>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      Export Report
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { period: 'January 2024', status: 'Completed', total: 1057500, employees: 156 },
                    { period: 'December 2023', status: 'Completed', total: 1042000, employees: 154 },
                    { period: 'November 2023', status: 'Completed', total: 1038000, employees: 153 },
                    { period: 'October 2023', status: 'Completed', total: 1025000, employees: 152 }
                  ].map((period, index) => (
                    <div key={index} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-800">{period.period}</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {period.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Total Payroll:</span>
                          <span className="font-medium text-black">${(period.total / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Employees:</span>
                          <span className="font-medium text-black">{period.employees}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">Payroll Reports</h3>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Generate Custom Report
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: 'Monthly Payroll Summary', description: 'Complete breakdown of monthly payroll including all components', icon: '📊' },
                    { title: 'Tax Compliance Report', description: 'Detailed tax deductions and compliance status for all employees', icon: '📋' },
                    { title: 'Employee Compensation Analysis', description: 'Salary trends and compensation analysis across departments', icon: '📈' },
                    { title: 'Overtime Report', description: 'Overtime hours and payments for the selected period', icon: '⏰' },
                    { title: 'Benefits Summary', description: 'Employee benefits and deductions breakdown', icon: '🎁' },
                    { title: 'Payroll Audit Trail', description: 'Complete audit trail of all payroll processing activities', icon: '🔍' }
                  ].map((report, index) => (
                    <div key={index} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                          <span className="text-2xl">{report.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{report.title}</h4>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm mb-4">{report.description}</p>
                      <div className="flex space-x-2">
                        <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                          Generate
                        </button>
                        <button className="border border-slate-300 text-slate-700 px-3 py-1 rounded text-sm hover:bg-slate-50">
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
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
  );
}
