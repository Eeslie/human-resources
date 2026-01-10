'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    position: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, login } = useAuth();

  useEffect(() => {
    // Check if already logged in
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Use auth context login function
      login(data.user);

      // Redirect to overview
      router.push('/');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Starbucks Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-800 to-green-900 rounded-full flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">☕</span>
          </div>
          <h1 className="text-2xl font-bold text-[#00704A] mb-2">STARBUCKS SIGNUP</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-black mb-2">
              CREATE YOUR ACCOUNT
            </label>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email-input"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 text-black"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 text-black"
                  placeholder="Enter your password (min. 6 characters)"
                />
              </div>
              <div>
                <label htmlFor="fullName-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName-input"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 text-black"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="position-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <select
                  id="position-input"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 text-black"
                >
                  <option value="">Select your position</option>
                  <option value="HR CEO">HR CEO</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="Barista">Barista</option>
                  <option value="Shift Supervisor">Shift Supervisor</option>
                  <option value="Store Manager">Store Manager</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00704A] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#005a3c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'CREATING ACCOUNT...' : 'SIGNUP'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-[#00704A] font-semibold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}

