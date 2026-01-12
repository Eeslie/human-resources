'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';

export default function Home() {
  const [activeModule, setActiveModule] = useState(null);
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  const hrModules = [
    {
      id: 'employee-records',
      title: 'Partner Records & Information Management',
      description: 'Maintains a centralized database of all Starbucks partner information, making it easy to access and update personnel data.',
      icon: '☕',
      color: 'from-green-800 to-green-900',
      features: [
        'Store personal details, job titles, departments, and contact info',
        'Manage employment history and contract types',
        'Upload and track certifications, licenses, and IDs',
        'Integrate with other modules for payroll, time tracking, and access control'
      ]
    },
    {
      id: 'payroll',
      title: 'Payroll & Compensation Management',
      description: 'Automates partner salary processing, deductions, benefits, and compliance with tax regulations.',
      icon: '💰',
      color: 'from-orange-800 to-orange-900',
      features: [
        'Calculate salaries, bonuses, overtime, and deductions',
        'Process payroll runs and generate payslips',
        'Manage tax filings and government contributions',
        'Integrate with attendance and leave records'
      ]
    },
    {
      id: 'recruitment',
      title: 'Recruitment & Onboarding',
      description: 'Streamlines the hiring process, from posting job openings to onboarding new Starbucks partners.',
      icon: '🎯',
      color: 'from-black to-gray-800',
      features: [
        'Create and manage job vacancies',
        'Track applicants and schedule interviews',
        'Evaluate candidates and issue job offers',
        'Automate onboarding tasks like account setup and document collection'
      ]
    },
    {
      id: 'time-attendance',
      title: 'Time, Attendance & Leave Management',
      description: 'Monitors partner attendance, working hours, and leave balances to ensure accurate payroll and compliance.',
      icon: '⏰',
      color: 'from-green-700 to-green-800',
      features: [
        'Record time-in and time-out using biometric or digital systems',
        'Manage different leave types (sick, vacation, emergency)',
        'Automate leave approvals and accruals',
        'Track overtime and shift schedules'
      ]
    }
  ];

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-green-50 to-orange-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg border-b border-green-200 w-full sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-green-800 to-green-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">☕</span>
              </div>
              <h1 className="text-xl font-bold text-black">Starbucks Partner Management</h1>
            </div>
            <div className="flex items-center space-x-4 flex-shrink-0">
              <Link href="/" className="text-black hover:text-gray-600 font-medium">
                Overview
              </Link>
              {user && (user.position === 'HR CEO' || user.position === 'HR Manager') ? (
                <>
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
                </>
              ) : (
                <Link href="/employee-dashboard" className="text-black hover:text-gray-600 font-medium">
                  My Dashboard
                </Link>
              )}
              {user && (
                <button
                  onClick={logout}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-4"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-800 via-green-700 to-green-900 text-white py-16 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Starbucks Partner Management System
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            Inspire and nurture the human spirit – one partner, one cup, and one neighborhood at a time. Manage your Starbucks partners with our comprehensive system.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/employee-records" className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 hover:bg-white/30 transition-colors">
              <span className="text-lg font-semibold">Partner Records</span>
            </Link>
            <Link href="/payroll" className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 hover:bg-white/30 transition-colors">
              <span className="text-lg font-semibold">Payroll Management</span>
            </Link>
            <Link href="/recruitment" className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 hover:bg-white/30 transition-colors">
              <span className="text-lg font-semibold">Recruitment</span>
            </Link>
            <Link href="/time-attendance" className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 hover:bg-white/30 transition-colors">
              <span className="text-lg font-semibold">Time & Attendance</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-black mb-4">
            {user && (user.position === 'HR CEO' || user.position === 'HR Manager')
              ? 'Core Partner Management Functions' 
              : 'Welcome to Your Dashboard'}
          </h3>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            {user && (user.position === 'HR CEO' || user.position === 'HR Manager')
              ? 'Explore our comprehensive partner management modules designed to streamline your Starbucks operations and nurture our partner community.'
              : 'Access your personal information, attendance records, leave requests, and payslips all in one place.'}
          </p>
        </div>

        {user && (user.position === 'HR CEO' || user.position === 'HR Manager') ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {hrModules.map((module) => (
            <div
              key={module.id}
              className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-green-200 ${
                activeModule === module.id ? 'ring-2 ring-green-500' : ''
              }`}
              onMouseEnter={() => setActiveModule(module.id)}
              onMouseLeave={() => setActiveModule(null)}
            >
              <Link href={`/${module.id}`}>
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${module.color} rounded-xl flex items-center justify-center text-3xl mr-4 shadow-lg`}>
                      {module.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-black mb-2">{module.title}</h4>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {module.description}
                  </p>

                  <div className="space-y-3">
                    <h5 className="font-semibold text-black mb-3">Key Features:</h5>
                    <ul className="space-y-2">
                      {module.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${module.color} text-white rounded-lg font-medium hover:shadow-md transition-all duration-200`}>
                      Explore Module
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-2xl mx-auto">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-5xl mb-6 mx-auto">
                👤
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Employee Portal</h3>
              <p className="text-gray-700 mb-6">
                View your profile, attendance records, leave requests, and payslips from your personal dashboard.
              </p>
              <Link 
                href="/employee-dashboard"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:shadow-md transition-all duration-200"
              >
                Go to My Dashboard
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-green-900 text-white py-8 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-green-100">
            © 2024 Starbucks Partner Management System. Built with Next.js and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
