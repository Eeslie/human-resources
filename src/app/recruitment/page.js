'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [allApplicants, setAllApplicants] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [onboardingTasks, setOnboardingTasks] = useState([]);

	// Modal infra
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTitle, setConfirmTitle] = useState('');
	const [confirmMessage, setConfirmMessage] = useState('');
	const [confirmAction, setConfirmAction] = useState(null);

	function Modal({ open, title, children, onClose }) {
		if (!open) return null;
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center">
				<div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
				<div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
					<div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
						<h3 className="text-lg font-semibold text-black">{title}</h3>
						<button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
					</div>
					<div className="p-6">{children}</div>
				</div>
			</div>
		);
	}

	// Job Creation Modal Component
	function JobCreateModal({ open, onClose, onSubmit }) {
		const [formData, setFormData] = useState({ 
			job_title: '', 
			department_id: '', 
			location: '', 
			type: 'Full-time', 
			salary: '', 
			status: 'Active' 
		});

		const handleSubmit = async (e) => {
			e.preventDefault();
			await onSubmit(formData);
			setFormData({ job_title: '', department_id: '', location: '', type: 'Full-time', status: 'Active' });
		};

		const handleInputChange = (field, value) => {
			setFormData(prev => ({ ...prev, [field]: value }));
		};

		if (!open) return null;
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center">
				<div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
				<div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
					<div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
						<h3 className="text-lg font-semibold text-black">Create Job Posting</h3>
						<button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
					</div>
					<div className="p-6">
						<form onSubmit={handleSubmit} className="space-y-4">
							<input 
								className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
								placeholder="Job title" 
								value={formData.job_title} 
								onChange={(e) => handleInputChange('job_title', e.target.value)} 
								required 
							/>
							<input 
								className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
								placeholder="Department ID or Name" 
								value={formData.department_id} 
								onChange={(e) => handleInputChange('department_id', e.target.value)} 
							/>
							<div className="grid grid-cols-2 gap-3">
								<input 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="Location" 
									value={formData.location} 
									onChange={(e) => handleInputChange('location', e.target.value)} 
								/>
								<input 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="Type" 
									value={formData.type} 
									onChange={(e) => handleInputChange('type', e.target.value)} 
								/>
							</div>
							<div className="grid grid-cols-1 gap-3">
								<input 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="Status" 
									value={formData.status} 
									onChange={(e) => handleInputChange('status', e.target.value)} 
								/>
							</div>
							<div className="flex justify-end space-x-2">
								<button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
								<button type="submit" className="px-4 py-2 rounded-lg bg-orange-900 text-white hover:bg-orange-800 transition-colors">Create</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		);
	}

	// Job Edit Modal Component
	function JobEditModal({ open, onClose, onSubmit, initialData }) {
		const [formData, setFormData] = useState(initialData || { 
			job_title: '', 
			department_id: '', 
			location: '', 
			type: 'Full-time', 
			salary: '', 
			status: 'Active' 
		});

		useEffect(() => {
			if (initialData) {
				setFormData(initialData);
			}
		}, [initialData]);

		const handleSubmit = async (e) => {
			e.preventDefault();
			await onSubmit(formData);
		};

		const handleInputChange = (field, value) => {
			setFormData(prev => ({ ...prev, [field]: value }));
		};

		if (!open) return null;
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center">
				<div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
				<div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
					<div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
						<h3 className="text-lg font-semibold text-black">Edit Job Posting</h3>
						<button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
					</div>
					<div className="p-6">
						<form onSubmit={handleSubmit} className="space-y-4">
							<input 
								className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
								placeholder="Job title" 
								value={formData.job_title} 
								onChange={(e) => handleInputChange('job_title', e.target.value)} 
								required 
							/>
							<input 
								className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
								placeholder="Department ID or Name" 
								value={formData.department_id} 
								onChange={(e) => handleInputChange('department_id', e.target.value)} 
							/>
							<div className="grid grid-cols-2 gap-3">
								<input 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="Location" 
									value={formData.location} 
									onChange={(e) => handleInputChange('location', e.target.value)} 
								/>
								<input 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="Type" 
									value={formData.type} 
									onChange={(e) => handleInputChange('type', e.target.value)} 
								/>
							</div>
							<div className="grid grid-cols-1 gap-3">
								<input 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="Status" 
									value={formData.status} 
									onChange={(e) => handleInputChange('status', e.target.value)} 
								/>
							</div>
							<div className="flex justify-end space-x-2">
								<button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
								<button type="submit" className="px-4 py-2 rounded-lg bg-orange-900 text-white hover:bg-orange-800 transition-colors">Save</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		);
	}

	// Applicant Add Modal Component
	function ApplicantAddModal({ open, onClose, onSubmit }) {
		const [formData, setFormData] = useState({ 
			full_name: '', 
			position: '', 
			email: '', 
			phone: '', 
			experience: '', 
			rating: 0, 
			status: 'Under Review',
			vacancy_id: ''
		});

		const handleSubmit = async (e) => {
			e.preventDefault();
			await onSubmit(formData);
			setFormData({ full_name: '', position: '', email: '', phone: '', experience: '', rating: 0, status: 'Under Review', vacancy_id: '' });
		};

		const handleInputChange = (field, value) => {
			setFormData(prev => ({ ...prev, [field]: value }));
		};

		if (!open) return null;
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center">
				<div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
				<div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
					<div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
						<h3 className="text-lg font-semibold text-black">Add Applicant</h3>
						<button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
					</div>
					<div className="p-6">
						<form onSubmit={handleSubmit} className="space-y-3">
							<select 
								className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
								value={formData.vacancy_id} 
								onChange={(e) => {
									const selectedJob = jobs.find(j => j.id === e.target.value);
									handleInputChange('vacancy_id', e.target.value);
									handleInputChange('position', selectedJob?.job_title || '');
								}}
							>
								<option value="">Select a job posting...</option>
								{jobs.map(job => (
									<option key={job.id} value={job.id}>
										{job.job_title || job.title} - {job.departments?.department_name || job.department || 'No Department'}
									</option>
								))}
							</select>
							<input 
								className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
								placeholder="Full name" 
								value={formData.full_name} 
								onChange={(e) => handleInputChange('full_name', e.target.value)} 
								required 
							/>
							<input 
								className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
								placeholder="Position (auto-filled from job selection)" 
								value={formData.position} 
								onChange={(e) => handleInputChange('position', e.target.value)} 
							/>
							<div className="grid grid-cols-2 gap-3">
								<input 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="Email" 
									value={formData.email} 
									onChange={(e) => handleInputChange('email', e.target.value)} 
								/>
								<input 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="Phone" 
									value={formData.phone} 
									onChange={(e) => handleInputChange('phone', e.target.value)} 
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<input 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="Experience" 
									value={formData.experience} 
									onChange={(e) => handleInputChange('experience', e.target.value)} 
								/>
								<input 
									type="number" 
									step="0.1" 
									min="0" 
									max="5" 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="Rating" 
									value={formData.rating} 
									onChange={(e) => handleInputChange('rating', Number(e.target.value))} 
								/>
							</div>
							<div className="flex justify-end space-x-2">
								<button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
								<button type="submit" className="px-4 py-2 rounded-lg bg-green-900 text-white hover:bg-green-800 transition-colors">Add</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		);
	}

	// Interview Add Modal Component
	function InterviewAddModal({ open, onClose, onSubmit }) {
		const [formData, setFormData] = useState({ 
			candidate: '', 
			position: '', 
			date: new Date().toISOString().slice(0,10), 
			time: '10:00',
			applicant_id: ''
		});

		const handleSubmit = async (e) => {
			e.preventDefault();
			await onSubmit(formData);
			setFormData({ candidate: '', position: '', date: new Date().toISOString().slice(0,10), time: '10:00', applicant_id: '' });
		};

		const handleInputChange = (field, value) => {
			setFormData(prev => ({ ...prev, [field]: value }));
		};

		if (!open) return null;
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center">
				<div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
				<div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
					<div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
						<h3 className="text-lg font-semibold text-black">Schedule Interview</h3>
						<button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
					</div>
					<div className="p-6">
						<form onSubmit={handleSubmit} className="space-y-4">
							<select 
								className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
								value={formData.applicant_id} 
								onChange={(e) => {
									const selectedApplicant = allApplicants.find(a => a.id === e.target.value);
									handleInputChange('applicant_id', e.target.value);
									handleInputChange('candidate', selectedApplicant?.full_name || '');
									handleInputChange('position', selectedApplicant?.position || '');
								}}
							>
								<option value="">Select an applicant...</option>
								{allApplicants.map(applicant => (
									<option key={applicant.id} value={applicant.id}>
										{applicant.full_name} - {applicant.position || 'No position'}
									</option>
								))}
							</select>
							<input 
								className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
								placeholder="Candidate (auto-filled from selection)" 
								value={formData.candidate} 
								onChange={(e) => handleInputChange('candidate', e.target.value)} 
								required 
							/>
							<input 
								className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
								placeholder="Position (auto-filled from selection)" 
								value={formData.position} 
								onChange={(e) => handleInputChange('position', e.target.value)} 
							/>
							<div className="grid grid-cols-2 gap-3">
								<input 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="YYYY-MM-DD" 
									value={formData.date} 
									onChange={(e) => handleInputChange('date', e.target.value)} 
								/>
								<input 
									className="border border-slate-300 rounded-lg px-3 py-2 text-black" 
									placeholder="HH:MM" 
									value={formData.time} 
									onChange={(e) => handleInputChange('time', e.target.value)} 
								/>
							</div>
							<div className="flex justify-end space-x-2">
								<button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
								<button type="submit" className="px-4 py-2 rounded-lg bg-orange-900 text-white hover:bg-orange-800 transition-colors">Schedule</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		);
	}

	// Jobs modals state
	const [jobCreateOpen, setJobCreateOpen] = useState(false);
	const [jobEditOpen, setJobEditOpen] = useState(false);
	const [jobViewOpen, setJobViewOpen] = useState(false);
	const [jobEditingId, setJobEditingId] = useState(null);
  const [jobForm, setJobForm] = useState({ job_title: '', department_id: '', location: '', type: 'Full-time', status: 'Active' });

	// Applicants modals state
	const [applicantAddOpen, setApplicantAddOpen] = useState(false);
	const [applicantEditOpen, setApplicantEditOpen] = useState(false);
	const [applicantStatusOpen, setApplicantStatusOpen] = useState(false);
	const [applicantInterviewOpen, setApplicantInterviewOpen] = useState(false);
	const [applicantOfferOpen, setApplicantOfferOpen] = useState(false);
	const [applicantTarget, setApplicantTarget] = useState(null);
  const [applicantForm, setApplicantForm] = useState({ full_name: '', position: '', email: '', phone: '', experience: '', rating: 0, status: 'Under Review' });
  const [offerForm, setOfferForm] = useState({ salary: '' });

	// Interviews modals state
	const [interviewAddOpen, setInterviewAddOpen] = useState(false);
	const [interviewEditOpen, setInterviewEditOpen] = useState(false);
	const [interviewEditing, setInterviewEditing] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ 
    candidate: '', 
    position: '', 
    date: new Date().toISOString().slice(0,10), 
    time: '10:00',
    interviewer: '',
    location: '',
    status: 'Scheduled'
  });

	// Onboarding modals state
	const [onboardingStartOpen, setOnboardingStartOpen] = useState(false);
	const [onboardingEditOpen, setOnboardingEditOpen] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({ employee_name: '', position: '', start_date: new Date().toISOString().slice(0,10) });
  const [onboardingTaskEditing, setOnboardingTaskEditing] = useState(null);

  // Helper function for onboarding form changes
  const handleOnboardingFormChange = (field, value) => {
    setOnboardingForm(prev => ({ ...prev, [field]: value }));
  };

  async function fetchJobs() {
    const res = await fetch('/api/recruitment', { cache: 'no-store' });
    const data = await res.json();
    setJobs(data);
  }
  async function fetchApplicants() {
    const res = await fetch('/api/applicants', { cache: 'no-store' });
    const data = await res.json();
    setAllApplicants(Array.isArray(data) ? data : []);
  }
  async function fetchInterviews() {
    const res = await fetch('/api/interviews', { cache: 'no-store' });
    const data = await res.json();
    setInterviews(data);
  }
  async function fetchOnboarding() {
    const res = await fetch('/api/onboarding', { cache: 'no-store' });
    const data = await res.json();
    setOnboardingTasks(data);
  }

  useEffect(() => {
    fetchJobs();
    fetchApplicants();
    fetchInterviews();
    fetchOnboarding();
  }, []);

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

  return (<>
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
      <div className="bg-gradient-to-r from-orange-800 to-orange-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-4xl mr-4">
              🎯
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Partner Recruitment & Onboarding</h2>
              <p className="text-orange-100 text-lg">Streamline the hiring process from job posting to successful partner onboarding</p>
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
                      {(jobs.length ? jobs : jobPostings).slice(0, 3).map((job) => (
                        <div key={job.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-slate-800">{job.job_title || job.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              (job.status || 'Active') === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {job.status || 'Active'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">
                            {job.departments?.department_name || job.department || job.department_id || 'No Department'} • {job.location || '—'}
                          </p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">
                              {job.applicant_count ?? (Array.isArray(allApplicants) ? allApplicants.filter(a => a.vacancy_id === job.vacancy_id || a.position === (job.job_title || job.title)).length : 0)} applicants
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Top Applicants</h3>
                    <div className="space-y-4">
                      {(Array.isArray(allApplicants) && allApplicants.length ? allApplicants : applicants).slice(0, 3).map((applicant) => (
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
                  <h3 className="text-xl font-bold text-black">Job Postings</h3>
                  <button onClick={() => setJobCreateOpen(true)} className="bg-orange-900 text-white px-4 py-2 rounded-lg hover:bg-orange-800 transition-colors">
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
                      {(jobs.length ? jobs : jobPostings).map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-slate-900">{job.job_title || job.title}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {job.departments?.department_name || job.department || job.department_id || 'No Department'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {job.location || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {job.employment_type || job.type || 'Full-time'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {job.applicant_count ?? (Array.isArray(allApplicants) ? allApplicants.filter(a => a.vacancy_id === job.vacancy_id || a.position === (job.job_title || job.title)).length : 0)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              (job.status || 'Active') === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {job.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onClick={() => { setJobEditingId(job.id); setJobForm({ job_title: job.job_title || job.title || '', department_id: job.department_id || job.departments?.department_name || '', location: job.location || '', type: job.employment_type || job.type || 'Full-time', status: job.status || 'Active' }); setJobEditOpen(true); }} className="text-orange-900 hover:text-orange-800 mr-3 transition-colors">Edit</button>
                            <button onClick={() => { setSelectedJob(job); setJobViewOpen(true); }} className="text-green-900 hover:text-green-800 mr-3 transition-colors">View</button>
                            <button onClick={() => { setConfirmTitle('Close Job'); setConfirmMessage('Are you sure you want to close this job posting?'); setConfirmAction(() => async () => { const res = await fetch(`/api/recruitment/${job.id}`, { method: 'DELETE' }); if (res.ok) fetchJobs(); setConfirmOpen(false); }); setConfirmOpen(true); }} className="text-red-900 hover:text-red-800 transition-colors">Close</button>
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
                  <h3 className="text-xl font-bold text-black">Applicants</h3>
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
                  <button onClick={() => setApplicantAddOpen(true)} className="bg-green-900 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors">+ Add Applicant</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(Array.isArray(allApplicants) && allApplicants.length ? allApplicants : applicants).map((applicant) => (
                    <div key={applicant.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                          {applicant.avatar}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{applicant.full_name || applicant.name}</h4>
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
                        <button onClick={() => { setApplicantTarget(applicant); setApplicantForm({ full_name: applicant.full_name || applicant.name || '', position: applicant.position || '', email: applicant.email || '', phone: applicant.phone || '', experience: applicant.experience || '', rating: applicant.rating ?? 0, status: applicant.status || 'Under Review' }); setApplicantEditOpen(true); }} className="flex-1 border border-slate-300 text-black py-2 rounded-lg hover:bg-slate-50 text-sm transition-colors">
                          Edit
                        </button>
                        <button onClick={() => { setApplicantTarget(applicant); setApplicantForm(prev => ({ ...prev, status: applicant.status || 'Under Review' })); setApplicantStatusOpen(true); }} className="flex-1 bg-orange-900 text-white py-2 rounded-lg hover:bg-orange-800 text-sm transition-colors">
                          Update Status
                        </button>
                        <button onClick={() => { setApplicantTarget(applicant); setInterviewForm({ candidate: applicant.full_name || applicant.name || '', position: applicant.position || '', date: new Date().toISOString().slice(0,10), time: '10:00' }); setApplicantInterviewOpen(true); }} className="flex-1 border border-slate-300 text-black py-2 rounded-lg hover:bg-slate-50 text-sm transition-colors">
                          Schedule Interview
                        </button>
                        <button onClick={() => { setApplicantTarget(applicant); setOfferForm({ salary: '' }); setApplicantOfferOpen(true); }} className="flex-1 bg-green-900 text-white py-2 rounded-lg hover:bg-green-800 text-sm transition-colors">
                          Issue Offer
                        </button>
                        <button onClick={() => { setApplicantTarget(applicant); setConfirmTitle('Delete Applicant'); setConfirmMessage('Are you sure you want to delete this applicant?'); setConfirmAction(() => async () => { const res = await fetch(`/api/applicants/${applicant.id}`, { method: 'DELETE' }); if (res.ok) fetchApplicants(); setConfirmOpen(false); }); setConfirmOpen(true); }} className="flex-1 bg-red-900 text-white py-2 rounded-lg hover:bg-red-800 text-sm transition-colors">
                          Delete
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
                  <h3 className="text-xl font-bold text-black">Interview Schedule</h3>
                        <button onClick={() => setInterviewAddOpen(true)} className="bg-orange-900 text-white px-4 py-2 rounded-lg hover:bg-orange-800 transition-colors">
                          + Schedule Interview
                        </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-4">Today's Interviews</h4>
                    <div className="space-y-4">
                      {(interviews.length ? interviews : [
                        { time: '10:00 AM', candidate: 'Alex Johnson', position: 'Senior Software Engineer', type: 'Technical Interview' },
                        { time: '2:00 PM', candidate: 'Sarah Chen', position: 'Marketing Manager', type: 'Panel Interview' },
                        { time: '4:30 PM', candidate: 'Michael Rodriguez', position: 'UX Designer', type: 'Portfolio Review' }
                      ]).map((interview, index) => (
                        <div key={interview.id || index} className="bg-white border border-slate-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-slate-800">{interview.candidate}</h5>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {interview.time || ''}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{interview.position}</p>
                          <p className="text-sm text-slate-500">{interview.type}</p>
                          <div className="mt-3 flex space-x-2">
                            <button onClick={() => { 
                              if (!interview.id) return; 
                              setInterviewEditing(interview); 
                              setInterviewForm({ 
                                candidate: interview.candidate || '', 
                                position: interview.position || '', 
                                date: interview.date || new Date().toISOString().slice(0,10), 
                                time: interview.time || '10:00',
                                interviewer: interview.interviewer || '',
                                location: interview.location || '',
                                status: interview.status || 'Scheduled'
                              }); 
                              setInterviewEditOpen(true); 
                            }} className="text-orange-900 hover:text-orange-800 text-sm transition-colors">Edit</button>
                            <button onClick={() => { if (!interview.id) return; setConfirmTitle('Delete Interview'); setConfirmMessage('Are you sure you want to delete this interview?'); setConfirmAction(() => async () => { const res = await fetch(`/api/interviews/${interview.id}`, { method: 'DELETE' }); if (res.ok) fetchInterviews(); setConfirmOpen(false); }); setConfirmOpen(true); }} className="text-red-900 hover:text-red-800 text-sm transition-colors">Delete</button>
                          </div>
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
                  <h3 className="text-xl font-bold text-black">Employee Onboarding</h3>
                  <button onClick={async () => {
                    const name = prompt('New hire name');
                    if (!name) return;
                    const position = prompt('Position') || '';
                    const startDate = prompt('Start date (YYYY-MM-DD)', new Date().toISOString().slice(0,10));
                    const tasks = [
                      'Account Setup','IT Equipment Assignment','Company Orientation','Document Collection','Benefits Enrollment'
                    ];
                    for (const t of tasks) {
                      await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employee_name: name, position, task: t, start_date: startDate }) });
                    }
                    fetchOnboarding();
                    alert('Onboarding tasks created.');
                  }} className="bg-green-900 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors">
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
                        {(onboardingTasks.length ? onboardingTasks : []).map((task) => (
                          <div key={task.id} className="flex items-center space-x-3">
                            <button onClick={async () => {
                              await fetch('/api/onboarding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, updates: { completed: !task.completed } }) });
                              fetchOnboarding();
                            }} className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300'
                            }`}>
                              {task.completed && <span className="text-white text-xs">✓</span>}
                            </button>
                            <span className={`text-sm ${task.completed ? 'text-slate-600 line-through' : 'text-slate-800'}`}>
                              {task.task} {task.employee_name ? `• ${task.employee_name}` : ''}
                            </span>
                            <div className="ml-auto space-x-2">
                              <button onClick={async () => {
                                const newTask = prompt('Edit task', task.task) || task.task;
                                await fetch('/api/onboarding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, updates: { task: newTask } }) });
                                fetchOnboarding();
                              }} className="text-orange-900 hover:text-orange-800 text-sm transition-colors">Edit</button>
                              <button onClick={async () => {
                                if (!confirm('Delete task?')) return;
                                await fetch(`/api/onboarding/${task.id}`, { method: 'DELETE' });
                                fetchOnboarding();
                              }} className="text-red-900 hover:text-red-800 text-sm transition-colors">Delete</button>
                            </div>
                          </div>
                        ))}
                        {onboardingTasks.length === 0 && (
                          <div className="text-slate-500 text-sm">No onboarding tasks yet. Click "Start Onboarding" to create tasks.</div>
                        )}
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

    {/* Modals */}
    <JobCreateModal 
      open={jobCreateOpen} 
      onClose={() => setJobCreateOpen(false)}
      onSubmit={async (formData) => {
        const vacancy_id = crypto.randomUUID();
        const body = { vacancy_id, vacancy_date: new Date().toISOString().slice(0,10), ...formData };
        const res = await fetch('/api/recruitment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) {
          setJobCreateOpen(false);
          fetchJobs();
        }
      }}
    />

    <JobEditModal 
      open={jobEditOpen} 
      onClose={() => setJobEditOpen(false)}
      initialData={jobForm}
      onSubmit={async (formData) => {
        if (!jobEditingId) return;
        const res = await fetch(`/api/recruitment/${jobEditingId}`, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ...formData, title: formData.job_title, department: formData.department_id }) 
        });
        if (res.ok) {
          setJobEditOpen(false);
          fetchJobs();
        }
      }}
    />

    <Modal open={jobViewOpen} title="Job Details" onClose={() => setJobViewOpen(false)}>
      {selectedJob && (
        <div className="space-y-2 text-sm text-black">
          <div><span className="font-medium">Title:</span> {selectedJob.job_title || selectedJob.title}</div>
          <div><span className="font-medium">Department:</span> {selectedJob.departments?.department_name || selectedJob.department || selectedJob.department_id}</div>
          <div><span className="font-medium">Location:</span> {selectedJob.location || '—'}</div>
          <div><span className="font-medium">Type:</span> {selectedJob.employment_type || selectedJob.type || '—'}</div>
          <div><span className="font-medium">Status:</span> {selectedJob.status || 'Active'}</div>
          {selectedJob.experience_required && <div><span className="font-medium">Experience Required:</span> {selectedJob.experience_required}</div>}
          {selectedJob.job_description && <div><span className="font-medium">Description:</span> {selectedJob.job_description}</div>}
        </div>
      )}
    </Modal>

    <Modal open={confirmOpen} title={confirmTitle} onClose={() => setConfirmOpen(false)}>
      <div className="space-y-4">
        <p className="text-black">{confirmMessage}</p>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={()=>setConfirmOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="button" onClick={() => { if (confirmAction) confirmAction(); }} className="px-4 py-2 rounded-lg bg-red-900 text-white hover:bg-red-800 transition-colors">Confirm</button>
        </div>
      </div>
    </Modal>

    <InterviewAddModal 
      open={interviewAddOpen} 
      onClose={() => setInterviewAddOpen(false)}
      onSubmit={async (formData) => {
        const res = await fetch('/api/interviews', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            ...formData, 
            type: 'Interview',
            applicant_id: formData.applicant_id
          }) 
        });
        if (res.ok) {
          setInterviewAddOpen(false);
          fetchInterviews();
        }
      }}
    />

    <Modal open={interviewEditOpen} title="Edit Interview" onClose={() => setInterviewEditOpen(false)}>
      <form onSubmit={async (e) => { 
        e.preventDefault(); 
        if (!interviewEditing?.id) return; 
        const res = await fetch(`/api/interviews/${interviewEditing.id}`, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            candidate: interviewForm.candidate,
            position: interviewForm.position,
            date: interviewForm.date, 
            time: interviewForm.time,
            interviewer: interviewForm.interviewer,
            location: interviewForm.location,
            status: interviewForm.status
          }) 
        }); 
        if (res.ok) { 
          setInterviewEditOpen(false); 
          fetchInterviews(); 
        } 
      }} className="space-y-4">
        <input 
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
          placeholder="Candidate" 
          value={interviewForm.candidate} 
          onChange={(e) => setInterviewForm({ ...interviewForm, candidate: e.target.value })} 
        />
        <input 
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
          placeholder="Position" 
          value={interviewForm.position} 
          onChange={(e) => setInterviewForm({ ...interviewForm, position: e.target.value })} 
        />
        <div className="grid grid-cols-2 gap-3">
          <input className="border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="YYYY-MM-DD" value={interviewForm.date} onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })} />
          <input className="border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="HH:MM" value={interviewForm.time} onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })} />
        </div>
        <input 
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
          placeholder="Interviewer" 
          value={interviewForm.interviewer || ''} 
          onChange={(e) => setInterviewForm({ ...interviewForm, interviewer: e.target.value })} 
        />
        <input 
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
          placeholder="Location" 
          value={interviewForm.location || ''} 
          onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })} 
        />
        <select 
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" 
          value={interviewForm.status || 'Scheduled'} 
          onChange={(e) => setInterviewForm({ ...interviewForm, status: e.target.value })} 
        >
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Rescheduled">Rescheduled</option>
        </select>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={()=>setInterviewEditOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-orange-900 text-white hover:bg-orange-800 transition-colors">Save</button>
        </div>
      </form>
    </Modal>

    <ApplicantAddModal 
      open={applicantAddOpen} 
      onClose={() => setApplicantAddOpen(false)}
      onSubmit={async (formData) => {
        const res = await fetch('/api/applicants', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(formData) 
        });
        if (res.ok) {
          setApplicantAddOpen(false);
          fetchApplicants();
        }
      }}
    />

    <Modal open={applicantEditOpen} title="Edit Applicant" onClose={() => setApplicantEditOpen(false)}>
      <form onSubmit={async (e) => { e.preventDefault(); if (!applicantTarget?.id) return; const res = await fetch(`/api/applicants/${applicantTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: applicantForm.full_name, position: applicantForm.position, email: applicantForm.email, phone: applicantForm.phone, experience: applicantForm.experience, rating: applicantForm.rating }) }); if (res.ok) { setApplicantEditOpen(false); fetchApplicants(); } }} className="space-y-3">
        <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Full name" value={applicantForm.full_name} onChange={(e) => setApplicantForm({ ...applicantForm, full_name: e.target.value })} required />
        <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Position" value={applicantForm.position} onChange={(e) => setApplicantForm({ ...applicantForm, position: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className="border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Email" value={applicantForm.email} onChange={(e) => setApplicantForm({ ...applicantForm, email: e.target.value })} />
          <input className="border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Phone" value={applicantForm.phone} onChange={(e) => setApplicantForm({ ...applicantForm, phone: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Experience" value={applicantForm.experience} onChange={(e) => setApplicantForm({ ...applicantForm, experience: e.target.value })} />
          <input type="number" step="0.1" min="0" max="5" className="border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Rating" value={applicantForm.rating} onChange={(e) => setApplicantForm({ ...applicantForm, rating: Number(e.target.value) })} />
        </div>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={()=>setApplicantEditOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-orange-900 text-white hover:bg-orange-800 transition-colors">Save</button>
        </div>
      </form>
    </Modal>

    <Modal open={applicantStatusOpen} title="Update Applicant Status" onClose={() => setApplicantStatusOpen(false)}>
      <form onSubmit={async (e) => { e.preventDefault(); if (!applicantTarget?.id) return; const res = await fetch(`/api/applicants/${applicantTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: applicantForm.status }) }); if (res.ok) { setApplicantStatusOpen(false); fetchApplicants(); } }} className="space-y-4">
        <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" value={applicantForm.status} onChange={(e) => setApplicantForm({ ...applicantForm, status: e.target.value })}>
          <option>Under Review</option>
          <option>Interview Scheduled</option>
          <option>Offered</option>
          <option>Rejected</option>
        </select>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={()=>setApplicantStatusOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-orange-900 text-white hover:bg-orange-800 transition-colors">Update</button>
        </div>
      </form>
    </Modal>

    <Modal open={applicantInterviewOpen} title="Schedule Interview" onClose={() => setApplicantInterviewOpen(false)}>
      <form onSubmit={async (e) => { e.preventDefault(); if (!applicantTarget?.id) return; const body = { applicant_id: applicantTarget.id, candidate: interviewForm.candidate, position: interviewForm.position, date: interviewForm.date, time: interviewForm.time, type: 'Interview' }; const res = await fetch('/api/interviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (res.ok) { setApplicantInterviewOpen(false); fetchInterviews(); } }} className="space-y-4">
        <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Candidate" value={interviewForm.candidate} onChange={(e) => setInterviewForm({ ...interviewForm, candidate: e.target.value })} required />
        <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Position" value={interviewForm.position} onChange={(e) => setInterviewForm({ ...interviewForm, position: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className="border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="YYYY-MM-DD" value={interviewForm.date} onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })} />
          <input className="border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="HH:MM" value={interviewForm.time} onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })} />
        </div>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={()=>setApplicantInterviewOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-orange-900 text-white hover:bg-orange-800 transition-colors">Schedule</button>
        </div>
      </form>
    </Modal>

    <Modal open={applicantOfferOpen} title="Issue Offer" onClose={() => setApplicantOfferOpen(false)}>
      <form onSubmit={async (e) => { e.preventDefault(); if (!applicantTarget?.id) return; const res = await fetch('/api/offers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicant_id: applicantTarget.id, candidate: applicantTarget.full_name || applicantTarget.name, position: applicantTarget.position, salary: offerForm.salary }) }); if (res.ok) { await fetch(`/api/applicants/${applicantTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Offered' }) }); setApplicantOfferOpen(false); fetchApplicants(); } }} className="space-y-4">
        <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Salary" value={offerForm.salary} onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })} required />
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={()=>setApplicantOfferOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-green-900 text-white hover:bg-green-800 transition-colors">Send Offer</button>
        </div>
      </form>
    </Modal>

    <Modal open={onboardingStartOpen} title="Start Onboarding" onClose={() => setOnboardingStartOpen(false)}>
      <form onSubmit={async (e) => { e.preventDefault(); const tasks = ['Account Setup','IT Equipment Assignment','Company Orientation','Document Collection','Benefits Enrollment']; for (const t of tasks) { await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employee_name: onboardingForm.employee_name, position: onboardingForm.position, task: t, start_date: onboardingForm.start_date }) }); } setOnboardingStartOpen(false); fetchOnboarding(); }} className="space-y-4">
        <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Employee name" value={onboardingForm.employee_name} onChange={(e) => handleOnboardingFormChange('employee_name', e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <input className="border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Position" value={onboardingForm.position} onChange={(e) => handleOnboardingFormChange('position', e.target.value)} />
          <input className="border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="YYYY-MM-DD" value={onboardingForm.start_date} onChange={(e) => handleOnboardingFormChange('start_date', e.target.value)} />
        </div>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={()=>setOnboardingStartOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-green-900 text-white hover:bg-green-800 transition-colors">Create Tasks</button>
        </div>
      </form>
    </Modal>

    <Modal open={onboardingEditOpen} title="Edit Onboarding Task" onClose={() => setOnboardingEditOpen(false)}>
      <form onSubmit={async (e) => { e.preventDefault(); if (!onboardingTaskEditing?.id) return; const newTask = onboardingTaskEditing.task; await fetch('/api/onboarding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: onboardingTaskEditing.id, updates: { task: newTask } }) }); setOnboardingEditOpen(false); fetchOnboarding(); }} className="space-y-4">
        <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-black" placeholder="Task" value={onboardingTaskEditing?.task || ''} onChange={(e) => setOnboardingTaskEditing(prev => ({ ...prev, task: e.target.value }))} />
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={()=>setOnboardingEditOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-black hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-orange-900 text-white hover:bg-orange-800 transition-colors">Save</button>
        </div>
      </form>
    </Modal>
  </>);
}
