'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EmployeeRecords() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    job_title: '',
    contact_info: '',
    employment_type: 'Full-time',
    hire_date: '',
    status: 'Active',
    department: '',
    address: ''
  });
  const [adding, setAdding] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [newHistory, setNewHistory] = useState({ action: '', description: '', status: 'success' });
  const [addingHistory, setAddingHistory] = useState(false);

  async function fetchEmployees() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/employees', { cache: 'no-store' });
      if (!res.ok) {
        const maybeError = await res.json().catch(() => ({}));
        setError(maybeError?.error || 'Failed to load employees');
        setEmployees([]);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      if (!Array.isArray(data)) {
        console.error('Unexpected /api/employees response:', data);
        setError('Invalid employees response');
      }
      setEmployees(list);
      // Adjust pagination if needed
      const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
      if (currentPage > totalPages) setCurrentPage(totalPages);
      // Maintain selection if possible
      if (list.length && !selectedEmployee) setSelectedEmployee(list[0]);
    } catch (e) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartments() { setDepartments([]); }

  function addEmployee() {
    setNewEmployee({
      first_name: '',
      last_name: '',
      job_title: '',
      contact_info: '',
      employment_type: 'Full-time',
      hire_date: '',
      status: 'Active',
      department: '',
      address: ''
    });
    setShowAddModal(true);
  }

  async function submitNewEmployee(e) {
    e?.preventDefault?.();
    if (!newEmployee.first_name || !newEmployee.last_name) return;
    setAdding(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee)
      });
      if (!res.ok) throw new Error('Failed');
      setShowAddModal(false);
      await fetchEmployees();
    } catch (_e) {
      alert('Failed to add employee');
    } finally {
      setAdding(false);
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

  async function deleteEmployee(employeeId, employeeName) {
    if (!confirm(`Are you sure you want to delete ${employeeName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/employees/${employeeId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchEmployees();
        // If we deleted the currently selected employee, clear the selection
        if (selectedEmployee && selectedEmployee.id === employeeId) {
          setSelectedEmployee(null);
        }
      } else {
        alert('Failed to delete employee');
      }
    } catch (error) {
      alert('Failed to delete employee');
    }
  }

  async function fetchHistory(employeeId) {
    const res = await fetch(`/api/employees/${employeeId}/history`, { cache: 'no-store' });
    const data = await res.json();
    setHistory(data);
  }

  function addHistoryEvent(employeeId) {
    if (!employeeId) return;
    setNewHistory({ action: '', description: '', status: 'success' });
    setShowHistoryModal(true);
  }

  async function submitNewHistory(e) {
    e?.preventDefault?.();
    if (!selectedEmployee) return;
    if (!newHistory.action) return;
    setAddingHistory(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHistory)
      });
      if (!res.ok) throw new Error('Failed');
      setShowHistoryModal(false);
      await fetchHistory(selectedEmployee.id);
    } catch (_e) {
      alert('Failed to add event');
    } finally {
      setAddingHistory(false);
    }
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

  function getDepartmentName(departmentId) {
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : 'Unknown Department';
  }

  useEffect(() => { 
    fetchEmployees(); 
    fetchDepartments();
  }, []);
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
                {(Array.isArray(employees) ? employees.slice((currentPage - 1) * pageSize, currentPage * pageSize) : []).map((employee) => (
                  <div
                    key={employee.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 relative ${
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
                        <h4 className="font-semibold text-black">{employee.first_name} {employee.last_name}</h4>
                        <p className="text-sm text-gray-700">{employee.job_title}</p>
                        <p className="text-xs text-gray-600">{employee.department || 'Department'} • ID: {employee.employee_id}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.status}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEmployee(employee.id, `${employee.first_name} ${employee.last_name}`);
                          }}
                          className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded transition-colors"
                          title="Delete employee"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-slate-600 order-2 sm:order-1">
                  Page {currentPage} of {Math.max(1, Math.ceil((employees?.length || 0) / pageSize))}
                </div>
                <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md border font-medium transition-colors ${currentPage === 1 ? 'border-slate-200 text-slate-300' : 'border-green-700 text-green-800 hover:bg-green-50'}`}
                    aria-label="Previous page"
                  >
                    ‹ Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(Math.max(1, Math.ceil((employees?.length || 0) / pageSize)), p + 1))}
                    disabled={currentPage >= Math.max(1, Math.ceil((employees?.length || 0) / pageSize))}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md border font-medium transition-colors ${currentPage >= Math.max(1, Math.ceil((employees?.length || 0) / pageSize)) ? 'border-slate-200 text-slate-300' : 'border-green-700 text-green-800 hover:bg-green-50'}`}
                    aria-label="Next page"
                  >
                    Next ›
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Details */}
          <div className="lg:col-span-2">
            {selectedEmployee ? (
              <div className="bg-white rounded-xl shadow-lg">
                {/* Employee Header */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-4xl">
                        {selectedEmployee.avatar}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">{selectedEmployee.first_name} {selectedEmployee.last_name}</h3>
                        <p className="text-lg text-slate-600">{selectedEmployee.job_title}</p>
                        <p className="text-slate-500">{selectedEmployee.department || 'Department'} • ID: {selectedEmployee.employee_id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEmployee(selectedEmployee.id, `${selectedEmployee.first_name} ${selectedEmployee.last_name}`)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      title="Delete employee"
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
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
                            <p><span className="font-medium">Contact Info:</span> {selectedEmployee.contact_info}</p>
                            <p><span className="font-medium">Employee ID:</span> {selectedEmployee.employee_id}</p>
                            <p><span className="font-medium">Address:</span> {selectedEmployee.address || '—'}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 text-black">
                          <h4 className="font-semibold text-slate-800 mb-2">Employment Details</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Hire Date:</span> {selectedEmployee.hire_date}</p>
                            <p><span className="font-medium">Status:</span> {selectedEmployee.status}</p>
                            <p><span className="font-medium">Employment Type:</span> {selectedEmployee.employment_type}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-white border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-800 mb-2">Partner Card</h4>
                          <p className="text-sm text-slate-600">Key partner details without redundant metrics.</p>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                              <div className="text-xs text-slate-500">Department</div>
                              <div className="font-medium text-slate-800">{selectedEmployee.department || '—'}</div>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                              <div className="text-xs text-slate-500">Job Title</div>
                              <div className="font-medium text-slate-800">{selectedEmployee.job_title || '—'}</div>
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
                              <label className="block text-sm font-medium text-slate-700">First Name</label>
                              <input id="firstName" type="text" defaultValue={selectedEmployee.first_name} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Last Name</label>
                              <input id="lastName" type="text" defaultValue={selectedEmployee.last_name} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Contact Info</label>
                              <input id="contactInfo" type="text" defaultValue={selectedEmployee.contact_info} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" placeholder="email, phone" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50" onClick={() => fetchEmployees()}>Cancel</button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={() => {
                          const firstName = document.getElementById('firstName').value;
                          const lastName = document.getElementById('lastName').value;
                          const contactInfo = document.getElementById('contactInfo').value;
                          savePersonal({ first_name: firstName, last_name: lastName, contact_info: contactInfo });
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
                              <label className="block text-sm font-medium text-slate-700">Job Title</label>
                              <input id="jobTitle" type="text" defaultValue={selectedEmployee.job_title} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Department</label>
                              <input id="department" type="text" defaultValue={selectedEmployee.department || ''} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Hire Date</label>
                              <input id="hireDate" type="date" defaultValue={selectedEmployee.hire_date} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-800">Contract Details</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Address</label>
                              <textarea id="address" rows={3} defaultValue={selectedEmployee.address || ''} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"></textarea>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Employment Type</label>
                              <select id="employmentType" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" value={selectedEmployee.employment_type || 'Full-time'} onChange={(e) => setSelectedEmployee({ ...selectedEmployee, employment_type: e.target.value })}>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Intern">Intern</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Status</label>
                              <select id="status" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" value={selectedEmployee.status || 'Active'} onChange={(e) => setSelectedEmployee({ ...selectedEmployee, status: e.target.value })}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Terminated">Terminated</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Employee ID</label>
                              <input id="employeeId" type="text" defaultValue={selectedEmployee.employee_id} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50" onClick={() => fetchEmployees()}>Cancel</button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={() => {
                          const jobTitle = document.getElementById('jobTitle').value;
                          const department = document.getElementById('department').value;
                          const hireDate = document.getElementById('hireDate').value;
                          const employmentType = document.getElementById('employmentType').value;
                          const status = document.getElementById('status').value;
                          const employeeId = document.getElementById('employeeId').value;
                          const address = document.getElementById('address').value;
                          savePersonal({ 
                            job_title: jobTitle, 
                            department: department,
                            hire_date: hireDate, 
                            employment_type: employmentType, 
                            status: status, 
                            employee_id: employeeId,
                            address: address
                          });
                        }}>Save Changes</button>
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
                        <button onClick={() => addHistoryEvent(selectedEmployee.id)} className="px-3 py-2 bg-green-700 text-white rounded-md hover:bg-green-800">+ Add Event</button>
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
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-black">Add New Partner</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-600 hover:text-slate-900">✖</button>
            </div>
            <form onSubmit={submitNewEmployee} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">First Name</label>
                  <input required value={newEmployee.first_name} onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Last Name</label>
                  <input required value={newEmployee.last_name} onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Job Title</label>
                  <input value={newEmployee.job_title} onChange={(e) => setNewEmployee({ ...newEmployee, job_title: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Department</label>
                  <input value={newEmployee.department} onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" placeholder="Store Operations" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Contact Info</label>
                <input value={newEmployee.contact_info} onChange={(e) => setNewEmployee({ ...newEmployee, contact_info: e.target.value })} placeholder="email, phone" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Address</label>
                <textarea rows={3} value={newEmployee.address} onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" placeholder="Street, City, State, ZIP"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Employment Type</label>
                  <select value={newEmployee.employment_type} onChange={(e) => setNewEmployee({ ...newEmployee, employment_type: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black">
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Hire Date</label>
                  <input type="date" value={newEmployee.hire_date} onChange={(e) => setNewEmployee({ ...newEmployee, hire_date: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Status</label>
                  <select value={newEmployee.status} onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={adding} className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:opacity-50">{adding ? 'Adding…' : 'Add Partner'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowHistoryModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-black">Add History Event</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-600 hover:text-slate-900">✖</button>
            </div>
            <form onSubmit={submitNewHistory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Action</label>
                <input required value={newHistory.action} onChange={(e) => setNewHistory({ ...newHistory, action: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" placeholder="Promotion" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea rows={3} value={newHistory.description} onChange={(e) => setNewHistory({ ...newHistory, description: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black" placeholder="Details of the event"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select value={newHistory.status} onChange={(e) => setNewHistory({ ...newHistory, status: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-green-600 focus:ring-green-600 text-black">
                  <option value="success">success</option>
                  <option value="info">info</option>
                  <option value="warning">warning</option>
                  <option value="error">error</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowHistoryModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={addingHistory} className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:opacity-50">{addingHistory ? 'Adding…' : 'Add Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
