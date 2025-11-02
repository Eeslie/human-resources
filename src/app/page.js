'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [activeModule, setActiveModule] = useState(null);

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-800 to-green-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">☕</span>
              </div>
              <h1 className="text-xl font-bold text-black">Starbucks Partner Management</h1>
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
      <div className="bg-gradient-to-r from-green-800 via-green-700 to-green-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Starbucks Partner Management System
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            Inspire and nurture the human spirit – one partner, one cup, and one neighborhood at a time. Manage your Starbucks partners with our comprehensive system.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <span className="text-lg font-semibold">Partner Records</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <span className="text-lg font-semibold">Payroll Management</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <span className="text-lg font-semibold">Recruitment</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <span className="text-lg font-semibold">Time & Attendance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-black mb-4">Core Partner Management Functions</h3>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Explore our comprehensive partner management modules designed to streamline your Starbucks operations and nurture our partner community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
      </div>

      {/* Footer */}
      <footer className="bg-green-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-green-100">
            © 2024 Starbucks Partner Management System. Built with Next.js and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
