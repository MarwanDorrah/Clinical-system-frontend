'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import { USER_ROLES } from '@/config/api.config';
import { ApiError } from '@/types/api.types';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [userType, setUserType] = useState<'doctor' | 'nurse'>('doctor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    
    const reason = searchParams?.get('reason');
    if (reason === 'session_expired') {
      setSessionMessage('Your session has expired due to inactivity. Please login again.');
    } else if (reason === 'token_expired') {
      setSessionMessage('Your session token has expired. Please login again to continue.');
    } else if (reason === 'logout') {
      setSessionMessage('You have been logged out successfully.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginData = { email, password };
      const response = userType === 'doctor' 
        ? await authService.doctorLogin(loginData)
        : await authService.nurseLogin(loginData);

      const role = userType === 'doctor' ? USER_ROLES.DOCTOR : USER_ROLES.NURSE;
      const userId = userType === 'doctor' 
        ? response.doctorId?.toString() || ''
        : response.nurseId?.toString() || '';

      login(response.token, role, response.name, userId);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10">
        {}
        <div className="text-center mb-8">
          <div className="mb-3">
            <Activity className="w-14 h-14 mx-auto text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
            DENTAL CLINIC
          </h1>
          <p className="text-gray-600 mt-1 text-sm">Information System</p>
        </div>

        {}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            type="button"
            onClick={() => setUserType('doctor')}
            className={`flex-1 py-3 text-center font-semibold uppercase text-sm transition-all ${
              userType === 'doctor'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            DOCTOR
          </button>
          <button
            type="button"
            onClick={() => setUserType('nurse')}
            className={`flex-1 py-3 text-center font-semibold uppercase text-sm transition-all ${
              userType === 'nurse'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            NURSE
          </button>
        </div>

        {}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError('')} autoClose={false} />
          </div>
        )}

        {}
        {sessionMessage && (
          <div className="mb-6">
            <Alert 
              type={sessionMessage.includes('successfully') ? 'success' : 'error'} 
              message={sessionMessage} 
              onClose={() => setSessionMessage('')}
              autoClose={false}
            />
          </div>
        )}

        {}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourmail@clinic.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <Button
            type="submit"
            className="w-full py-3 text-sm font-semibold uppercase tracking-wide"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'SIGNING IN...' : `LOGIN AS ${userType.toUpperCase()}`}
          </Button>
        </form>

        {}
        <div className="mt-6 text-center space-y-2">
          {userType === 'doctor' ? (
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Register as Doctor →
              </Link>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register-nurse" className="text-green-600 hover:text-green-700 font-semibold">
                Register as Nurse →
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
