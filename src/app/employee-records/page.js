'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EmployeeRecords() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);

  async function fetchEmployees() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/employees', { cache: 'no-store' });
      const data = await res.json();
      setEmployees(data);
      if (data.length && !selectedEmployee) setSelectedEmployee(data[0]);
    } catch (e) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  async function addEmployee() {
    const name = prompt('Full name');
    if (!name) return;
    const email = prompt('Email');
    if (!email) return;
    const position = prompt('Position') || '';
    const department = prompt('Department') || '';
    const phone = prompt('Phone') || '';
    const hireDate = prompt('Hire Date (YYYY-MM-DD)') || '';
    const body = { name, email, position, department, phone, hireDate, status: 'Active', avatar: '👤' };
    const res = await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      await fetchEmployees();
    } else {
      alert('Failed to add employee');
    }
  }

  async function savePersonal(updated) {
    if (!selectedEmployee) return;
    const res = await fetch(`/api/employees/${selectedEmployee.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    if (res.ok) {
      await fetchEmployees();
    } else {
      alert('Failed to save changes');
    }
  }

  async function fetchHistory(employeeId) {
    const res = await fetch(`/api/employees/${employeeId}/history`, { cache: 'no-store' });
    const data = await res.json();
    setHistory(data);
  }

  async function addHistoryEvent(employeeId) {
    const action = prompt('Action (e.g., Promotion)');
    if (!action) return;
    const description = prompt('Description') || '';
    const status = prompt('Status (success|info|warning|error)', 'success') || 'success';
    const res = await fetch(`/api/employees/${employeeId}/history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, description, status }) });
    if (res.ok) fetchHistory(employeeId);
  }

  async function fetchDocuments(employeeId) {
    const res = await fetch(`/api/employees/${employeeId}/documents`, { cache: 'no-store' });
    const data = await res.json();
    setDocuments(data);
  }

  async function uploadDocument(employeeId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = async () => {
      if (!input.files || !input.files[0]) return;
      const form = new FormData();
      form.append('file', input.files[0]);
      const res = await fetch(`/api/employees/${employeeId}/documents`, { method: 'POST', body: form });
      if (res.ok) fetchDocuments(employeeId);
      else alert('Upload failed');
    };
    input.click();
  }

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => {
    if (selectedEmployee) {
      fetchHistory(selectedEmployee.id);
      fetchDocuments(selectedEmployee.id);
    } else {
      setHistory([]);
      setDocuments([]);
    }
  }, [selectedEmployee]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'employment', label: 'Employment', icon: '💼' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'history', label: 'History', icon: '📈' }
  ];

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
              <h1 className="text-xl font-bold text-black">Partner Records & Information Management</h1>
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
      <div className="bg-gradient-to-r from-green-800 to-green-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-4xl mr-4">
              ☕
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Partner Records & Information Management</h2>
              <p className="text-green-100 text-lg">Maintain centralized partner database with comprehensive information tracking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Employee List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-black">Partner Directory</h3>
                <button onClick={addEmployee} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">+ Add Partner</button>
              </div>

              <div className="space-y-3">
                {loading && <div className="text-slate-600">Loading...</div>}
                {error && <div className="text-red-600">{error}</div>}
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          selectedEmployee?.id === employee.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-green-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-2xl">
                        {employee.avatar}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-black">{employee.name}</h4>
                        <p className="text-sm text-gray-700">{employee.position}</p>
                        <p className="text-xs text-gray-600">{employee.department}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Employee Details */}
          <div className="lg:col-span-2">
            {selectedEmployee ? (
              <div className="bg-white rounded-xl shadow-lg">
                {/* Employee Header */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-t-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-4xl">
                      {selectedEmployee.avatar}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{selectedEmployee.name}</h3>
                      <p className="text-lg text-slate-600">{selectedEmployee.position}</p>
                      <p className="text-slate-500">{selectedEmployee.department}</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200">
                  <div className="flex space-x-8 px-6">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-800 mb-2">Contact Information</h4>
                          <div className="space-y-2 text-sm text-black">
                            <p><span className="font-medium">Email:</span> {selectedEmployee.email}</p>
                            <p><span className="font-medium">Phone:</span> {selectedEmployee.phone}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 text-black">
                          <h4 className="font-semibold text-slate-800 mb-2">Employment Details</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Hire Date:</span> {selectedEmployee.hireDate}</p>
                            <p><span className="font-medium">Status:</span> {selectedEmployee.status}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-800 mb-3">Quick Stats</h4>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-blue-600">2.5</div>
                              <div className="text-xs text-slate-600">Years Experience</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">95%</div>
                              <div className="text-xs text-slate-600">Attendance</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-purple-600">15</div>
                              <div className="text-xs text-slate-600">Days Leave Used</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-orange-600">A+</div>
                              <div className="text-xs text-slate-600">Performance</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'personal' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-800">Personal Information</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Full Name</label>
                              <input id="fullName" type="text" defaultValue={selectedEmployee.name} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Email Address</label>
                              <input id="email" type="email" defaultValue={selectedEmployee.email} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                              <input id="phone" type="tel" defaultValue={selectedEmployee.phone} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-800">Additional Details</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Address</label>
                              <textarea rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" defaultValue="123 Main Street, City, State 12345"></textarea>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Emergency Contact</label>
                              <input type="text" defaultValue="Jane Doe - +1 (555) 987-6543" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50" onClick={() => fetchEmployees()}>Cancel</button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={() => {
                          const name = document.getElementById('fullName').value;
                          const email = document.getElementById('email').value;
                          const phone = document.getElementById('phone').value;
                          savePersonal({ name, email, phone });
                        }}>Save Changes</button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'employment' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-800">Employment Information</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Position</label>
                              <input type="text"defaultValue={selectedEmployee.position} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Department</label>
                              <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black">
                                <option>Engineering</option>
                                <option>Human Resources</option>
                                <option>Marketing</option>
                                <option>Finance</option>
                                <option>Sales</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Hire Date</label>
                              <input type="date" defaultValue={selectedEmployee.hireDate} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-800">Contract Details</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Contract Type</label>
                              <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black">
                                <option>Full-time</option>
                                <option>Part-time</option>
                                <option>Contract</option>
                                <option>Intern</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Salary</label>
                              <input type="text" defaultValue="$75,000" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Manager</label>
                              <input type="text" defaultValue="Sarah Johnson" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'documents' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-slate-800">Employee Documents</h4>
                        <button onClick={() => uploadDocument(selectedEmployee.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Upload Document</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc) => (
                          <div key={doc.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-red-600 font-bold">{(doc.type || '').toUpperCase().includes('PDF') ? 'PDF' : 'DOC'}</span>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-slate-800">{doc.name}</h5>
                                <p className="text-sm text-slate-500">{doc.type} • {Math.round((doc.size || 0)/1024)} KB • {doc.date}</p>
                              </div>
                              <div className="flex space-x-2">
                                <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">View</a>
                                <a href={doc.url} download className="text-green-600 hover:text-green-800">Download</a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-slate-800">Employment History</h4>
                        <button onClick={() => addHistoryEvent(selectedEmployee.id)} className="px-3 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900">+ Add Event</button>
                      </div>
                      <div className="space-y-4">
                        {history.map((event) => (
                          <div key={event.id} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full mt-2 ${
                              event.status === 'success' ? 'bg-green-500' : 
                              event.status === 'info' ? 'bg-blue-500' : 'bg-red-500'
                            }`}></div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="font-medium text-slate-800">{event.action}</h5>
                                <span className="text-sm text-slate-500">{event.date}</span>
                              </div>
                              <p className="text-sm text-slate-600">{event.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Select an Employee</h3>
                <p className="text-slate-600">Choose an employee from the directory to view their detailed information and manage their records.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
