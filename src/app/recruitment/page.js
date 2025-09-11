'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJob, setSelectedJob] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'jobs', label: 'Job Postings', icon: '💼' },
    { id: 'applicants', label: 'Applicants', icon: '👥' },
    { id: 'interviews', label: 'Interviews', icon: '🗣️' },
    { id: 'onboarding', label: 'Onboarding', icon: '🎯' }
  ];

  const jobPostings = [
    {
      id: 1,
      title: 'Senior Software Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      experience: '5+ years',
      applicants: 24,
      status: 'Active',
      postedDate: '2024-01-15',
      salary: '$120,000 - $150,000'
    },
    {
      id: 2,
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'New York, NY',
      type: 'Full-time',
      experience: '3+ years',
      applicants: 18,
      status: 'Active',
      postedDate: '2024-01-10',
      salary: '$80,000 - $100,000'
    },
    {
      id: 3,
      title: 'UX Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      experience: '2+ years',
      applicants: 32,
      status: 'Active',
      postedDate: '2024-01-08',
      salary: '$70,000 - $90,000'
    },
    {
      id: 4,
      title: 'Data Analyst',
      department: 'Analytics',
      location: 'Chicago, IL',
      type: 'Full-time',
      experience: '1+ years',
      applicants: 15,
      status: 'Closed',
      postedDate: '2023-12-20',
      salary: '$60,000 - $75,000'
    }
  ];

  const applicants = [
    {
      id: 1,
      name: 'Alex Johnson',
      position: 'Senior Software Engineer',
      email: 'alex.johnson@email.com',
      phone: '+1 (555) 123-4567',
      experience: '6 years',
      status: 'Interview Scheduled',
      rating: 4.5,
      avatar: '👨‍💻'
    },
    {
      id: 2,
      name: 'Sarah Chen',
      position: 'Marketing Manager',
      email: 'sarah.chen@email.com',
      phone: '+1 (555) 234-5678',
      experience: '4 years',
      status: 'Under Review',
      rating: 4.2,
      avatar: '👩‍💼'
    },
    {
      id: 3,
      name: 'Michael Rodriguez',
      position: 'UX Designer',
      email: 'michael.r@email.com',
      phone: '+1 (555) 345-6789',
      experience: '3 years',
      status: 'Interview Scheduled',
      rating: 4.7,
      avatar: '👨‍🎨'
    },
    {
      id: 4,
      name: 'Emily Davis',
      position: 'Data Analyst',
      email: 'emily.davis@email.com',
      phone: '+1 (555) 456-7890',
      experience: '2 years',
      status: 'Offered',
      rating: 4.3,
      avatar: '👩‍💻'
    }
  ];

  const recruitmentStats = {
    activeJobs: 12,
    totalApplicants: 156,
    interviewsScheduled: 28,
    offersMade: 8,
    newHires: 5
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
              <h1 className="text-xl font-bold text-black">Partner Recruitment & Onboarding</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/" className="text-black hover:text-gray-600 font-medium">
                Overview
              </Link>
              <Link href="/employee-records" className="text-black hover:text-gray-600 font-medium">
                Partner Records
              </Link>
              <Link href="/payroll" className="text-black hover:text-gray-600 font-medium">
                Payroll
              </Link>
              <Link href="/recruitment" className="text-black hover:text-gray-600 font-medium">
                Recruitment
              </Link>
              <Link href="/time-attendance" className="text-black hover:text-gray-600 font-medium">
                Time & Attendance
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black to-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-4xl mr-4">
              🎯
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Partner Recruitment & Onboarding</h2>
              <p className="text-gray-100 text-lg">Streamline the hiring process from job posting to successful partner onboarding</p>
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
                <p className="text-sm font-medium text-slate-600">Active Jobs</p>
                <p className="text-2xl font-bold text-slate-800">{recruitmentStats.activeJobs}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💼</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Applicants</p>
                <p className="text-2xl font-bold text-slate-800">{recruitmentStats.totalApplicants}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Interviews</p>
                <p className="text-2xl font-bold text-slate-800">{recruitmentStats.interviewsScheduled}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🗣️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Offers Made</p>
                <p className="text-2xl font-bold text-slate-800">{recruitmentStats.offersMade}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">New Hires</p>
                <p className="text-2xl font-bold text-slate-800">{recruitmentStats.newHires}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎉</span>
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
                      ? 'border-black text-black'
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
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Recent Job Postings</h3>
                    <div className="space-y-4">
                      {jobPostings.slice(0, 3).map((job) => (
                        <div key={job.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-slate-800">{job.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              job.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{job.department} • {job.location}</p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">{job.applicants} applicants</span>
                            <span className="text-green-600 font-medium">{job.salary}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Top Applicants</h3>
                    <div className="space-y-4">
                      {applicants.slice(0, 3).map((applicant) => (
                        <div key={applicant.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-xl">
                              {applicant.avatar}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800">{applicant.name}</h4>
                              <p className="text-sm text-slate-600">{applicant.position}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              applicant.status === 'Offered' ? 'bg-green-100 text-green-800' :
                              applicant.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {applicant.status}
                            </span>
                            <div className="flex items-center">
                              <span className="text-yellow-500">⭐</span>
                              <span className="text-sm font-medium ml-1">{applicant.rating}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">Job Postings</h3>
                  <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
                    + Create Job Posting
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Job Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Applicants</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {jobPostings.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-slate-900">{job.title}</div>
                              <div className="text-sm text-slate-500">{job.salary}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {job.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {job.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {job.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {job.applicants}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              job.status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-purple-600 hover:text-purple-900 mr-3">Edit</button>
                            <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                            <button className="text-red-600 hover:text-red-900">Close</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'applicants' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">Applicants</h3>
                  <div className="flex space-x-3">
                    <select className="border border-slate-300 rounded-lg px-3 py-2 text-black">
                      <option>All Positions</option>
                      <option>Software Engineer</option>
                      <option>Marketing Manager</option>
                      <option>UX Designer</option>
                    </select>
                    <select className="border border-slate-300 rounded-lg px-3 py-2 text-black">
                      <option>All Status</option>
                      <option>Under Review</option>
                      <option>Interview Scheduled</option>
                      <option>Offered</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {applicants.map((applicant) => (
                    <div key={applicant.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                          {applicant.avatar}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{applicant.name}</h4>
                          <p className="text-sm text-slate-600">{applicant.position}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Email:</span> {applicant.email}
                        </p>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Phone:</span> {applicant.phone}
                        </p>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Experience:</span> {applicant.experience}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          applicant.status === 'Offered' ? 'bg-green-100 text-green-800' :
                          applicant.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {applicant.status}
                        </span>
                        <div className="flex items-center">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-sm font-medium ml-1">{applicant.rating}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 text-sm">
                          View Profile
                        </button>
                        <button className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50 text-sm">
                          Schedule Interview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'interviews' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">Interview Schedule</h3>
                        <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
                          + Schedule Interview
                        </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-4">Today's Interviews</h4>
                    <div className="space-y-4">
                      {[
                        { time: '10:00 AM', candidate: 'Alex Johnson', position: 'Senior Software Engineer', type: 'Technical Interview' },
                        { time: '2:00 PM', candidate: 'Sarah Chen', position: 'Marketing Manager', type: 'Panel Interview' },
                        { time: '4:30 PM', candidate: 'Michael Rodriguez', position: 'UX Designer', type: 'Portfolio Review' }
                      ].map((interview, index) => (
                        <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-slate-800">{interview.candidate}</h5>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {interview.time}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{interview.position}</p>
                          <p className="text-sm text-slate-500">{interview.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-4">Upcoming Interviews</h4>
                    <div className="space-y-4">
                      {[
                        { date: 'Tomorrow', candidate: 'Emily Davis', position: 'Data Analyst', time: '11:00 AM' },
                        { date: 'Jan 25', candidate: 'David Kim', position: 'Product Manager', time: '3:00 PM' },
                        { date: 'Jan 26', candidate: 'Lisa Wang', position: 'DevOps Engineer', time: '10:30 AM' }
                      ].map((interview, index) => (
                        <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-slate-800">{interview.candidate}</h5>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                              {interview.date}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{interview.position}</p>
                          <p className="text-sm text-slate-500">{interview.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'onboarding' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">Employee Onboarding</h3>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                    + Start Onboarding
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-4">New Hires (This Month)</h4>
                    <div className="space-y-4">
                      {[
                        { name: 'Emily Davis', position: 'Data Analyst', startDate: 'Jan 15, 2024', progress: 80 },
                        { name: 'David Kim', position: 'Product Manager', startDate: 'Jan 22, 2024', progress: 60 },
                        { name: 'Lisa Wang', position: 'DevOps Engineer', startDate: 'Jan 29, 2024', progress: 40 }
                      ].map((hire, index) => (
                        <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium text-slate-800">{hire.name}</h5>
                              <p className="text-sm text-slate-600">{hire.position}</p>
                              <p className="text-xs text-slate-500">Start Date: {hire.startDate}</p>
                            </div>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              {hire.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${hire.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-4">Onboarding Checklist</h4>
                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                      <div className="space-y-4">
                        {[
                          { task: 'Account Setup', completed: true },
                          { task: 'IT Equipment Assignment', completed: true },
                          { task: 'Company Orientation', completed: true },
                          { task: 'Document Collection', completed: false },
                          { task: 'Benefits Enrollment', completed: false },
                          { task: 'Security Training', completed: false },
                          { task: 'Team Introduction', completed: false },
                          { task: 'First Week Check-in', completed: false }
                        ].map((task, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300'
                            }`}>
                              {task.completed && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className={`text-sm ${task.completed ? 'text-slate-600 line-through' : 'text-slate-800'}`}>
                              {task.task}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
